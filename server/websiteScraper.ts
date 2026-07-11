/**
 * websiteScraper.ts
 * Real HTTP fetching + HTML-to-text extraction for business profile scraping.
 * No stubs, no mocks — fetches actual page content.
 */

import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_CONTENT_CHARS = 15_000; // per page, to stay within LLM context

const USER_AGENT =
  "Mozilla/5.0 (compatible; NexusAI-Bot/1.0; +https://nexusai.app/bot) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Normalise a URL — add https:// if missing */
export function normaliseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Fetch a single URL and return the raw HTML (or null on failure) */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Strip HTML tags and collapse whitespace to get readable text */
function htmlToText(html: string): string {
  const $ = cheerio.load(html);

  // Remove noise elements
  $("script, style, noscript, iframe, svg, img, video, audio, canvas, nav, footer, header, [aria-hidden='true']").remove();
  $("[class*='cookie'], [class*='popup'], [class*='modal'], [class*='banner'], [id*='cookie'], [id*='popup']").remove();

  // Extract meaningful text from key elements
  const sections: string[] = [];

  // Title and meta description
  const title = $("title").text().trim();
  const metaDesc = $("meta[name='description']").attr("content")?.trim() || "";
  const metaKeywords = $("meta[name='keywords']").attr("content")?.trim() || "";
  const ogDesc = $("meta[property='og:description']").attr("content")?.trim() || "";
  const ogSiteName = $("meta[property='og:site_name']").attr("content")?.trim() || "";

  if (title) sections.push(`[TITLE] ${title}`);
  if (ogSiteName) sections.push(`[SITE NAME] ${ogSiteName}`);
  if (metaDesc) sections.push(`[META DESCRIPTION] ${metaDesc}`);
  if (ogDesc && ogDesc !== metaDesc) sections.push(`[OG DESCRIPTION] ${ogDesc}`);
  if (metaKeywords) sections.push(`[META KEYWORDS] ${metaKeywords}`);

  // Main content areas
  const contentSelectors = [
    "main", "article", "[role='main']",
    ".hero", ".about", ".services", ".products", ".features",
    "h1", "h2", "h3", "h4",
    "p", "li", "blockquote",
    ".content", "#content", ".page-content",
  ];

  for (const sel of contentSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 20) sections.push(text);
    });
  }

  // Deduplicate and join
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const s of sections) {
    const key = s.substring(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  }

  return unique.join("\n").substring(0, MAX_CONTENT_CHARS);
}

/** Discover internal links that likely contain useful business info */
function discoverInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const priority = ["about", "services", "products", "solutions", "what-we-do", "company", "contact", "team", "mission", "who-we-are"];
  const found: { url: string; score: number }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    try {
      const abs = new URL(href, baseUrl).toString();
      const parsed = new URL(abs);
      // Only same-origin links
      if (parsed.hostname !== base.hostname) return;
      // Skip anchors, files, query-heavy URLs
      if (parsed.hash && !parsed.pathname.includes("/")) return;
      if (/\.(pdf|jpg|png|gif|svg|zip|css|js)$/i.test(parsed.pathname)) return;
      if (parsed.pathname === "/" || parsed.pathname === base.pathname) return;

      const path = parsed.pathname.toLowerCase();
      let score = 0;
      for (const kw of priority) {
        if (path.includes(kw)) { score = priority.length - priority.indexOf(kw); break; }
      }
      if (score > 0) found.push({ url: abs, score });
    } catch {}
  });

  // Sort by priority score, deduplicate, take top 3
  const seen = new Set<string>();
  return found
    .sort((a, b) => b.score - a.score)
    .filter(({ url }) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, 3)
    .map(({ url }) => url);
}

export interface ScrapedWebsiteContent {
  url: string;
  pages: { url: string; text: string }[];
  combinedText: string;
  error?: string;
}

/**
 * Scrape a website: fetch homepage + up to 3 priority sub-pages.
 * Returns combined text content ready for AI extraction.
 */
export async function scrapeWebsite(rawUrl: string): Promise<ScrapedWebsiteContent> {
  const url = normaliseUrl(rawUrl);
  const pages: { url: string; text: string }[] = [];

  // 1. Fetch homepage
  const homeHtml = await fetchHtml(url);
  if (!homeHtml) {
    return {
      url,
      pages: [],
      combinedText: "",
      error: `Could not fetch ${url} — the site may be down, blocking bots, or require JavaScript rendering.`,
    };
  }

  const homeText = htmlToText(homeHtml);
  pages.push({ url, text: homeText });

  // 2. Discover and fetch priority sub-pages
  const subLinks = discoverInternalLinks(homeHtml, url);
  const subFetches = await Promise.allSettled(
    subLinks.map(async (link) => {
      const html = await fetchHtml(link);
      if (!html) return null;
      return { url: link, text: htmlToText(html) };
    })
  );

  for (const result of subFetches) {
    if (result.status === "fulfilled" && result.value) {
      pages.push(result.value);
    }
  }

  // 3. Combine all page text, capped to avoid LLM overload
  const combined = pages
    .map((p) => `\n\n=== PAGE: ${p.url} ===\n${p.text}`)
    .join("")
    .substring(0, 40_000);

  return { url, pages, combinedText: combined };
}
