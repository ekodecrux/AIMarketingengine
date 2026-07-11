import crypto from "crypto";
import { scrapeWebsite } from "./websiteScraper";
import { validateSocialCredentials } from "./socialValidator";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "nexusai_salt_2026").digest("hex");
}
import {
  createBacklink,
  createCampaign,
  createCompetitor,
  createContentItem,
  createKeywords,
  createLead,
  createMarketingPlan,
  createProject,
  createSeoAudit,
  deleteBacklink,
  deleteCampaign,
  deleteCompetitor,
  deleteContentItem,
  deleteKeyword,
  deleteLead,
  deleteProject,
  deleteSocialAccount,
  findKnowledge,
  getBacklinks,
  getBusinessProfile,
  getCampaigns,
  getCompetitors,
  getConsolidatedStats,
  getContentItems,
  getKeywords,
  getKnowledgeEntries,
  deleteKnowledge,
  updateKnowledgeContent,
  getLeadStats,
  getLeads,
  getMarketingPlans,
  getProjectById,
  getProjectsByUser,
  getSeoAudits,
  getSocialAccounts,
  saveKnowledge,
  updateCampaign,
  updateContentItem,
  updateLead,
  updateMarketingPlan,
  updateProject,
  upsertBusinessProfile,
  upsertSocialAccount,
  createClientPortalAccess,
  getClientPortalByToken,
  getClientPortalsByProject,
  revokeClientPortal,
  addLeadActivity,
  getLeadActivities,
  createLeadScrapeJob,
  updateLeadScrapeJob,
  getLeadScrapeJobs,
  getLeadScrapeJob,
  getDb,
  getProjectApiKeys,
  upsertProjectApiKey,
  deleteProjectApiKey,
  getUserByEmailAndPassword,
  getLeadMonthlyTrend,
  getUsageStats,
  getAllUsers,
  updateUserRole,
  getGlobalSettings,
  setGlobalSettings,
} from "./db";
import { z } from "zod";

// ─── Shared AI helper with RAG fallback ──────────────────────────────────────

async function aiWithKnowledge(
  userId: number,
  projectId: number | null,
  category: string,
  topicKey: string,
  question: string,
  systemPrompt: string,
  userPrompt: string,
  responseSchema?: object
): Promise<string> {
  // 1. Try knowledge base first (RAG)
  const existing = await findKnowledge(userId, projectId, category, topicKey);
  if (existing) return existing.content;

  // 2. Fall back to AI
  const params: any = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (responseSchema) {
    params.response_format = {
      type: "json_schema",
      json_schema: { name: "response", strict: true, schema: responseSchema },
    };
  }
  const result = await invokeLLM(params);
  const rawContent = result.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text || "").join("") : "");

  // 3. Store in knowledge base for future use
  await saveKnowledge({
    userId,
    projectId,
    category,
    topicKey: topicKey.substring(0, 500),
    question,
    content,
    source: "ai",
    hitCount: 0,
  });

  return content;
}

// ─── Marketing best practices system context ─────────────────────────────────

const MARKETING_SYSTEM_PROMPT = `You are an elite digital marketing strategist with 20+ years of experience across B2B and B2C markets. You apply industry best practices including:
- RACE framework (Reach, Act, Convert, Engage)
- TOFU/MOFU/BOFU full-funnel content strategy
- OKR-based goal setting with SMART KPIs
- SEO E-E-A-T signals and Google helpful content guidelines
- Core Web Vitals and technical SEO
- LinkedIn SSI (Social Selling Index) optimization
- Multi-touch attribution modelling (first-touch, last-touch, linear, time-decay)
- Customer Lifetime Value (CLV) and NPS optimization
- 70/20/10 budget allocation rule (proven/experimental/innovative)
- A/B testing frameworks and conversion rate optimization
- Brand voice consistency and content quality scoring
- WhatsApp Business API marketing best practices
- Google Ads, Meta Ads, LinkedIn Ads campaign optimization
- Quora marketing for thought leadership and lead generation
Always provide actionable, specific recommendations tailored to the business context. Explain concepts in plain English suitable for business owners with no marketing background. Use simple language, avoid jargon, and include "why this matters" explanations.`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    localLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const passwordHash = hashPassword(input.password);
        const user = await getUserByEmailAndPassword(input.email, passwordHash);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        // Create session token using the same mechanism as OAuth
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
  }),

  // ─── Projects ──────────────────────────────────────────────────────────────
  projects: router({
    list: protectedProcedure.query(({ ctx }) => getProjectsByUser(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) =>
      getProjectById(input.id, ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        websiteUrl: z.string().optional(),
        industry: z.string().optional(),
        goal: z.string().optional(),
        goals: z.array(z.string()).optional(),
        monthlyBudget: z.string().optional(),
        color: z.string().optional(),
        targetAudience: z.string().optional(),
        location: z.string().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { goals, targetAudience, location, currency, ...rest } = input;
        const id = await createProject({
          ...rest,
          goal: goals?.join(", ") || input.goal,
          userId: ctx.user.id,
        });
        // Save currency to business profile for this project
        if (currency && currency !== "USD") {
          await upsertBusinessProfile({ projectId: id, currency });
        }
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        websiteUrl: z.string().optional(),
        industry: z.string().optional(),
        goal: z.string().optional(),
        monthlyBudget: z.string().optional(),
        color: z.string().optional(),
        status: z.enum(["active", "paused", "archived"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateProject(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Business Profile ──────────────────────────────────────────────────────
  businessProfile: router({
    get: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getBusinessProfile(input.projectId)),

    extractFromUrl: protectedProcedure
      .input(z.object({ projectId: z.number(), url: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Step 0: Check RAG knowledge base first — avoid re-scraping the same URL
        const ragKey = `website_extraction:${input.url.toLowerCase().trim()}`;
        const cached = await findKnowledge(ctx.user.id, input.projectId, "profile", ragKey);
        if (cached) {
          try {
            const cachedParsed = JSON.parse(cached.content);
            return { ...cachedParsed, pagesScraped: 0, pageUrls: [], fromCache: true };
          } catch { /* fall through to re-scrape if cache is malformed */ }
        }
        // Step 1: Real HTTP fetch of the website (homepage + sub-pages)
        const scraped = await scrapeWebsite(input.url);
        if (scraped.error || !scraped.combinedText) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: scraped.error || `Could not fetch content from ${input.url}. The site may be blocking automated access or require JavaScript rendering.`,
          });
        }

        // Step 2: AI extraction from REAL page content — no hallucination
        const pagesScraped = scraped.pages.map(p => p.url).join(", ");
        const content = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a business intelligence analyst. Extract accurate business profile information ONLY from the actual website content provided. Do NOT invent, assume, or hallucinate any information not present in the content. If a field cannot be determined from the content, use an empty string.

Pages scraped: ${pagesScraped}`,
            },
            {
              role: "user",
              content: `Extract a comprehensive business profile from this actual website content:

${scraped.combinedText}

Return a JSON object with ONLY information found in the above content:
- companyName: string (exact company name from the site)
- industry: string (what sector/industry they operate in)
- description: string (2-3 sentences describing what they actually do, from their own words)
- targetAudience: string (who their customers are, based on site content)
- valueProposition: string (their unique selling points as stated on the site)
- products: string (actual products/services listed on the site)
- toneOfVoice: string (professional/casual/technical/friendly — inferred from writing style)
- location: string (city/country if mentioned on the site)
- marketingOpportunities: string (3-5 opportunities based on what the site lacks or could improve)
- suggestedChannels: string (best marketing channels for this specific business type)`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "business_profile",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  companyName: { type: "string" },
                  industry: { type: "string" },
                  description: { type: "string" },
                  targetAudience: { type: "string" },
                  valueProposition: { type: "string" },
                  products: { type: "string" },
                  toneOfVoice: { type: "string" },
                  location: { type: "string" },
                  marketingOpportunities: { type: "string" },
                  suggestedChannels: { type: "string" },
                },
                required: ["companyName", "industry", "description", "targetAudience", "valueProposition", "products", "toneOfVoice", "location", "marketingOpportunities", "suggestedChannels"],
                additionalProperties: false,
              },
            },
          },
        });

        // Extract text from InvokeResult
        const rawText = (() => {
          const msg = content.choices?.[0]?.message?.content;
          if (typeof msg === "string") return msg;
          if (Array.isArray(msg)) {
            const t = msg.find((p: any) => p.type === "text");
            return (t as any)?.text || "";
          }
          return "";
        })();

        let parsed: any = {};
        try { parsed = JSON.parse(rawText); } catch {}
        await upsertBusinessProfile({
          projectId: input.projectId,
          ...parsed,
          extractionSource: "website",
          sourceUrl: input.url,
          rawExtraction: rawText,
        });
        // Save to RAG knowledge base scoped to this project — future extractions of same URL return instantly
        await saveKnowledge({
          userId: ctx.user.id,
          projectId: input.projectId,
          category: "profile",
          topicKey: ragKey,
          question: `Business profile extraction from ${input.url}`,
          content: rawText,
          source: "ai",
          hitCount: 0,
        });
        return { ...parsed, pagesScraped: scraped.pages.length, pageUrls: scraped.pages.map(p => p.url), fromCache: false };
      }),

    save: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        companyName: z.string().optional(),
        industry: z.string().optional(),
        description: z.string().optional(),
        targetAudience: z.string().optional(),
        valueProposition: z.string().optional(),
        products: z.string().optional(),
        toneOfVoice: z.string().optional(),
        location: z.string().optional(),
        extractionSource: z.enum(["website", "manual", "hybrid"]).optional(),
        sourceUrl: z.string().optional(),
        currency: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertBusinessProfile(input);
        return { success: true };
      }),
  }),

  // ─── Marketing Plans ───────────────────────────────────────────────────────
  marketingPlans: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getMarketingPlans(input.projectId)),

    generate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        objective: z.string(),
        budget: z.string(),
        timeframe: z.string(),
        industry: z.string().optional(),
        targetAudience: z.string().optional(),
        currentChannels: z.string().optional(),
        currency: z.string().optional(),
        currencySymbol: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const currency = input.currency || "USD";
        const currencySymbol = input.currencySymbol || "$";
        const topicKey = `marketing_plan_${input.objective}_${input.budget}_${input.timeframe}_${currency}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "plan", topicKey,
          `Generate marketing plan for ${input.objective}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a comprehensive, actionable marketing plan with these details:
- Business Objective: ${input.objective}
- Monthly Budget: ${currencySymbol}${input.budget} (Currency: ${currency})
- Timeframe: ${input.timeframe}
- Industry: ${input.industry || "General"}
- Target Audience: ${input.targetAudience || "To be defined"}
- Current Channels: ${input.currentChannels || "None"}
- IMPORTANT: All monetary values in the response MUST use the ${currency} currency symbol "${currencySymbol}" — never use $ unless currency is USD.

Apply the RACE framework and 70/20/10 budget rule. SEO must be the primary channel.

Return a detailed JSON marketing plan with:
- executiveSummary: plain English overview (2-3 sentences, no jargon)
- goals: array of SMART goals with OKRs
- channels: array of {channel, budget_percent, monthly_budget, tactics, expectedROI, why_this_channel}
  Include: SEO (primary), Google Ads, Facebook/Instagram, LinkedIn, WhatsApp, Quora, Content Marketing
- contentStrategy: {tofu, mofu, bofu} with specific content types and posting frequency
- seoStrategy: {primaryKeywords, contentCalendar, technicalSeo, linkBuilding, expectedTimeToRank}
- whatsappStrategy: {messageTemplates, audienceSegments, broadcastFrequency, expectedOpenRate}
- kpis: array of {metric, target, measurement, benchmark, plainEnglishExplanation}
- milestones: array of {week, action, expectedOutcome}
- budgetBreakdown: {seo, googleAds, socialAds, contentCreation, whatsapp, tools, contingency}
- quickWins: array of actions that can show results within 30 days
- warningSignals: what to watch out for
- estimatedLeadsPerMonth: number
- estimatedROI: string`
        );
        // Strip markdown code fences before storing
        let cleanContent = content.trim();
        cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        let planObj: any = {};
        try { planObj = JSON.parse(cleanContent); } catch {
          // Try extracting JSON object from within
          const m = cleanContent.match(/\{[\s\S]*\}/);
          if (m) try { planObj = JSON.parse(m[0]); cleanContent = m[0]; } catch {}
        }
        const id = await createMarketingPlan({
          projectId: input.projectId,
          title: `Marketing Plan \u2014 ${input.objective}`,
          objective: input.objective,
          totalBudget: input.budget as any,
          timeframe: input.timeframe,
          planJson: cleanContent,
          status: "draft",
        });
        return { id, plan: planObj, raw: cleanContent };
      }),

    activate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateMarketingPlan(input.id, { status: "active" });
        return { success: true };
      }),

    exportPdf: protectedProcedure
      .input(z.object({ id: z.number(), currencySymbol: z.string().optional() }))
      .mutation(async ({ input }) => {
        const plans = await getMarketingPlans(0); // will fetch by id below
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { marketingPlans: mp } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(mp).where(eq(mp.id, input.id)).limit(1);
        const plan = rows[0];
        if (!plan) throw new Error("Plan not found");
        const sym = input.currencySymbol || "$";
        let parsed: any = {};
        try {
          let raw = (plan.planJson || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
          parsed = JSON.parse(raw);
        } catch {}
        // Build HTML for PDF
        const channels = (parsed.channels || []).map((ch: any) =>
          `<tr><td>${ch.channel || ""}</td><td>${ch.budget_percent || 0}%</td><td>${sym}${ch.monthly_budget || 0}/mo</td><td>${ch.expectedROI || ""}</td></tr>`
        ).join("");
        const goals = (parsed.goals || []).map((g: any) =>
          `<li><strong>${g.objective || ""}</strong>${(g.keyResults || []).map((kr: any) => `<br/>&nbsp;&nbsp;• ${kr.kr || kr.metric || ""}: ${kr.target || ""}`).join("")}</li>`
        ).join("");
        const kpis = (parsed.kpis || []).map((k: any) =>
          `<tr><td>${k.metric || ""}</td><td>${k.target || ""}</td><td>${k.plainEnglishExplanation || k.measurement || ""}</td></tr>`
        ).join("");
        const milestones = (parsed.milestones || []).map((m: any) =>
          `<tr><td>${m.week || ""}</td><td>${m.action || ""}</td><td>${m.expectedOutcome || ""}</td></tr>`
        ).join("");
        const quickWins = (parsed.quickWins || []).map((w: string) => `<li>${w}</li>`).join("");
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
          body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;padding:0;background:#fff;}
          .cover{background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 50%,#0d1b2a 100%);color:#fff;padding:60px 48px;min-height:200px;}
          .cover h1{font-size:32px;font-weight:700;margin:0 0 8px;letter-spacing:-0.5px;}
          .cover p{font-size:14px;opacity:0.7;margin:0 0 4px;}
          .cover .badge{display:inline-block;background:rgba(139,92,246,0.3);border:1px solid rgba(139,92,246,0.5);color:#c4b5fd;padding:4px 12px;border-radius:20px;font-size:12px;margin-top:16px;}
          .body{padding:40px 48px;}
          h2{font-size:18px;font-weight:700;color:#0f0f23;border-left:4px solid #8b5cf6;padding-left:12px;margin:32px 0 16px;}
          h3{font-size:14px;font-weight:600;color:#4c1d95;margin:20px 0 8px;}
          p{font-size:13px;line-height:1.7;color:#374151;}
          table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;}
          th{background:#f3f0ff;color:#4c1d95;font-weight:600;padding:8px 12px;text-align:left;border:1px solid #e5e7eb;}
          td{padding:7px 12px;border:1px solid #e5e7eb;color:#374151;}
          tr:nth-child(even) td{background:#fafafa;}
          ul,ol{font-size:13px;color:#374151;line-height:1.8;padding-left:20px;}
          .summary{background:#f3f0ff;border-left:4px solid #8b5cf6;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;}
          .footer{text-align:center;font-size:11px;color:#9ca3af;padding:24px;border-top:1px solid #e5e7eb;margin-top:40px;}
          .chip{display:inline-block;background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-left:6px;}
        </style></head><body>
        <div class="cover">
          <div style="font-size:11px;opacity:0.5;margin-bottom:8px;">NEXUS AI — MARKETING INTELLIGENCE PLATFORM</div>
          <h1>${plan.title || "AI Marketing Plan"}</h1>
          <p>Objective: ${plan.objective || ""}</p>
          <p>Budget: ${sym}${plan.totalBudget || ""} &nbsp;|&nbsp; Timeframe: ${plan.timeframe || ""}</p>
          <div class="badge">SEO-First Strategy &bull; RACE Framework &bull; 70/20/10 Budget Rule</div>
        </div>
        <div class="body">
          ${parsed.executiveSummary ? `<h2>Executive Summary</h2><div class="summary"><p>${parsed.executiveSummary}</p></div>` : ""}
          ${channels ? `<h2>Channel Budget Allocation</h2><table><tr><th>Channel</th><th>Budget %</th><th>Monthly</th><th>Expected ROI</th></tr>${channels}</table>` : ""}
          ${goals ? `<h2>SMART Goals &amp; OKRs</h2><ul>${goals}</ul>` : ""}
          ${kpis ? `<h2>Key Performance Indicators</h2><table><tr><th>Metric</th><th>Target</th><th>What It Means</th></tr>${kpis}</table>` : ""}
          ${milestones ? `<h2>Milestones &amp; Timeline</h2><table><tr><th>Week</th><th>Action</th><th>Expected Outcome</th></tr>${milestones}</table>` : ""}
          ${quickWins ? `<h2>Quick Wins (First 30 Days)</h2><ul>${quickWins}</ul>` : ""}
          ${parsed.warningSignals?.length ? `<h2>Warning Signals to Watch</h2><ul>${parsed.warningSignals.map((w: string) => `<li>${w}</li>`).join("")}</ul>` : ""}
          <div class="footer">Generated by Nexus AI &bull; ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &bull; Confidential</div>
        </div></body></html>`;
        return { html, title: plan.title || "Marketing Plan" };
      }),
  }),

  // ─── Keywords ──────────────────────────────────────────────────────────────
  keywords: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getKeywords(input.projectId)),

    analyze: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        seedKeywords: z.string(),
        industry: z.string().optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `keywords_${input.seedKeywords}_${input.industry}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "keyword", topicKey,
          `Keyword analysis for ${input.seedKeywords}`,
          MARKETING_SYSTEM_PROMPT,
          `Perform comprehensive keyword research for:
Seed Keywords: ${input.seedKeywords}
Industry: ${input.industry || "General"}
Target Audience: ${input.targetAudience || "General"}

Apply Google's E-E-A-T principles and search intent analysis. Return a JSON array of 15-20 keywords:
[{
  "keyword": string,
  "searchVolume": string (e.g. "1K-10K/mo"),
  "difficulty": number (0-100, where 0=easy, 100=very hard),
  "intent": "informational"|"navigational"|"commercial"|"transactional",
  "cpc": string (estimated cost per click e.g. "$2.50"),
  "opportunity": string (plain English: why this keyword is valuable),
  "currentRank": null,
  "targetRank": number (realistic target rank in 6 months),
  "contentType": string (what type of content to create),
  "quickWin": boolean (can rank within 90 days)
}]
Include a mix of: head terms, long-tail keywords, question keywords, local keywords if applicable.`
        );
        let kwArray: any[] = [];
        try { kwArray = JSON.parse(content); } catch {}
        if (Array.isArray(kwArray) && kwArray.length > 0) {
          await createKeywords(kwArray.map((k) => ({
            projectId: input.projectId,
            keyword: k.keyword,
            searchVolume: k.searchVolume,
            difficulty: k.difficulty,
            intent: k.intent,
            cpc: k.cpc,
            opportunity: k.opportunity,
            currentRank: k.currentRank,
            targetRank: k.targetRank,
          })));
        }
        return { keywords: kwArray };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKeyword(input.id);
        return { success: true };
      }),
  }),

  // ─── Competitors ───────────────────────────────────────────────────────────
  competitors: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getCompetitors(input.projectId)),

    analyze: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        businessDescription: z.string(),
        industry: z.string().optional(),
        websiteUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `competitors_${input.businessDescription}_${input.industry}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "competitor", topicKey,
          `Competitor analysis for ${input.businessDescription}`,
          MARKETING_SYSTEM_PROMPT,
          `Perform a comprehensive competitor landscape analysis for:
Business: ${input.businessDescription}
Industry: ${input.industry || "General"}
Website: ${input.websiteUrl || "Not provided"}

Return a JSON array of 5-6 likely competitors with:
[{
  "name": string,
  "websiteUrl": string,
  "strengths": string (2-3 key strengths),
  "weaknesses": string (2-3 exploitable weaknesses),
  "positioning": string (how they position themselves),
  "channels": string (their primary marketing channels),
  "estimatedTraffic": string (e.g. "50K-100K/mo"),
  "threatLevel": "low"|"medium"|"high",
  "keyDifferentiator": string,
  "contentGaps": string (topics they miss that you can own),
  "shareOfVoice": string (estimated market presence),
  "opportunityToWin": string (plain English: how to beat them)
}]`
        );
        let compArray: any[] = [];
        try { compArray = JSON.parse(content); } catch {}
        const ids: number[] = [];
        for (const c of compArray) {
          const id = await createCompetitor({
            projectId: input.projectId,
            name: c.name,
            websiteUrl: c.websiteUrl,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            positioning: c.positioning,
            channels: c.channels,
            estimatedTraffic: c.estimatedTraffic,
            threatLevel: c.threatLevel,
            analysisJson: JSON.stringify(c),
          });
          ids.push(id);
        }
        return { competitors: compArray };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCompetitor(input.id);
        return { success: true };
      }),
  }),

  // ─── Content Studio ────────────────────────────────────────────────────────
  content: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number(), type: z.string().optional() }))
      .query(({ input }) => getContentItems(input.projectId, input.type)),

    generate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["blog", "social", "linkedin"]),
        platform: z.string().optional(),
        topic: z.string(),
        tone: z.string().optional(),
        targetAudience: z.string().optional(),
        keywords: z.string().optional(),
        businessContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `content_${input.type}_${input.platform}_${input.topic}`;
        const typePrompts: Record<string, string> = {
          blog: `Write a comprehensive, SEO-optimised blog post about: "${input.topic}"
Apply E-E-A-T principles. Include:
- Compelling headline (H1) with primary keyword
- Meta description (150-160 chars)
- Introduction with hook
- 4-6 sections with H2 subheadings
- Practical tips and examples
- Call-to-action
- Suggested internal/external links
- Word count: 800-1200 words
- Tone: ${input.tone || "professional but approachable"}
- Target audience: ${input.targetAudience || "business professionals"}
- Include keywords naturally: ${input.keywords || ""}
Return JSON: {title, metaDescription, body, hashtags, suggestedImages, readingTime, seoScore}`,

          social: `Create an engaging ${input.platform || "social media"} post about: "${input.topic}"
Platform best practices for ${input.platform || "social"}:
- LinkedIn: professional, insight-driven, 150-300 words, 3-5 hashtags
- Facebook: conversational, 40-80 words, 1-2 hashtags, question or CTA
- Instagram: visual-first, 125-150 words, 10-15 hashtags, emoji-friendly
- Twitter/X: punchy, under 280 chars, 1-2 hashtags
- WhatsApp: personal, conversational, 50-100 words, no hashtags
Tone: ${input.tone || "engaging"}
Business context: ${input.businessContext || ""}
Return JSON: {title, body, hashtags, bestPostingTime, engagementTips, callToAction}`,

          linkedin: `Create a LinkedIn personal branding post to establish thought leadership about: "${input.topic}"
Apply LinkedIn SSI best practices:
- Start with a strong hook (first line must stop the scroll)
- Share a personal insight or contrarian view
- Use the "Problem → Insight → Solution → CTA" structure
- Include 3-5 relevant hashtags
- 150-300 words optimal
- Professional yet human tone
- End with a question to drive comments
Business context: ${input.businessContext || ""}
Return JSON: {title, body, hashtags, ssiTips, bestPostingTime, engagementPrediction}`,
        };

        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "content", topicKey,
          `Generate ${input.type} content about ${input.topic}`,
          MARKETING_SYSTEM_PROMPT,
          typePrompts[input.type]
        );
        let parsed: any = {};
        try { parsed = JSON.parse(content); } catch { parsed = { title: input.topic, body: content, hashtags: "" }; }
        const id = await createContentItem({
          projectId: input.projectId,
          type: input.type,
          platform: input.platform,
          title: parsed.title || input.topic,
          body: parsed.body || content,
          hashtags: parsed.hashtags || "",
          status: "draft",
          aiGenerated: 1,
        });
        return { id, content: parsed };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        body: z.string().optional(),
        hashtags: z.string().optional(),
        status: z.enum(["draft", "scheduled", "published"]).optional(),
        scheduledAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateContentItem(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContentItem(input.id);
        return { success: true };
      }),
  }),

  // ─── Social Accounts ───────────────────────────────────────────────────────
  socialAccounts: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(({ ctx, input }) => getSocialAccounts(ctx.user.id, input.projectId)),

    connect: protectedProcedure
      .input(z.object({
        platform: z.enum(["linkedin", "facebook", "instagram", "twitter", "whatsapp", "quora", "google"]),
        accountName: z.string(),
        accessToken: z.string().optional(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Real credential validation — ping the platform API before saving
        const validation = await validateSocialCredentials(
          input.platform,
          input.accessToken,
          input.apiKey,
          input.apiSecret
        );
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.error || "Invalid credentials — please check your token or API key",
          });
        }
        // Use the verified account name from the API if available
        const verifiedName = validation.accountInfo || input.accountName;
        await upsertSocialAccount({
          ...input,
          accountName: verifiedName,
          userId: ctx.user.id,
          status: "connected",
        });
        return { success: true, accountInfo: verifiedName };
      }),

    disconnect: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSocialAccount(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Leads CRM ─────────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getLeads(input.projectId)),

    stats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getLeadStats(input.projectId)),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
        stage: z.enum(["new", "qualified", "proposal", "closed_won", "closed_lost"]).optional(),
        estimatedValue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createLead(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
        stage: z.enum(["new", "qualified", "proposal", "closed_won", "closed_lost"]).optional(),
        estimatedValue: z.string().optional(),
        actualRevenue: z.string().optional(),
        notes: z.string().optional(),
        closedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.stage === "closed_won" || data.stage === "closed_lost") {
          (data as any).closedAt = new Date();
        }
        await updateLead(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLead(input.id);
        return { success: true };
      }),

    generateStrategy: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        businessDescription: z.string(),
        targetAudience: z.string().optional(),
        budget: z.string().optional(),
        currency: z.string().optional(),
        currencySymbol: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `lead_strategy_${input.businessDescription}`;
        return aiWithKnowledge(
          ctx.user.id, input.projectId, "lead_strategy", topicKey,
          `Lead generation strategy for ${input.businessDescription}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a guaranteed lead generation strategy for:
Business: ${input.businessDescription}
Target Audience: ${input.targetAudience || "To be defined"}
Monthly Budget: ${input.currencySymbol || "$"}${input.budget || "1000"} (Currency: ${input.currency || "USD"})

Include:
1. SEO-first approach: content clusters, local SEO, featured snippets
2. WhatsApp lead capture: opt-in strategy, nurture sequences
3. LinkedIn outreach: connection strategy, InMail templates
4. Google Ads: search intent targeting, landing page recommendations
5. Facebook/Instagram: lead generation ads, retargeting sequences
6. Quora: answer strategy for thought leadership leads
7. Lead magnet ideas: what to offer for email/WhatsApp capture
8. Lead scoring model: how to prioritise leads
9. Nurture sequence: 7-email/WhatsApp follow-up sequence
10. Conversion benchmarks: what's realistic for this industry
11. CLV calculation guidance
12. Attribution model recommendation

Make it actionable with specific steps a non-marketer can follow.`
        );
      }),
  }),

  // ─── Campaigns ─────────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getCampaigns(input.projectId)),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        platform: z.string().optional(),
        objective: z.string().optional(),
        budget: z.string().optional(),
        isRetargeting: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCampaign(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        platform: z.string().optional(),
        objective: z.string().optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        conversions: z.number().optional(),
        status: z.enum(["planned", "active", "paused", "completed"]).optional(),
        retargetingStrategy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCampaign(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCampaign(input.id);
        return { success: true };
      }),

    generateRetargeting: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        campaignId: z.number(),
        businessDescription: z.string(),
        platform: z.string(),
        objective: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `retargeting_${input.platform}_${input.businessDescription}`;
        const strategy = await aiWithKnowledge(
          ctx.user.id, input.projectId, "retargeting", topicKey,
          `Retargeting strategy for ${input.platform}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a comprehensive retargeting strategy for:
Platform: ${input.platform}
Business: ${input.businessDescription}
Campaign Objective: ${input.objective || "Conversions"}

Include:
1. Audience segments to retarget (website visitors, video viewers, email list, lookalikes)
2. Ad creative recommendations for each segment
3. Frequency capping recommendations
4. Exclusion lists (recent purchasers, etc.)
5. Sequential retargeting story (ad 1 → ad 2 → ad 3)
6. Budget allocation across segments
7. Expected CTR and conversion rate benchmarks
8. A/B test ideas
9. WhatsApp retargeting integration (if applicable)
10. Attribution window recommendation`
        );
        await updateCampaign(input.campaignId, { retargetingStrategy: strategy, isRetargeting: 1 });
        return { strategy };
      }),
  }),

  // ─── SEO Tools ─────────────────────────────────────────────────────────────
  seo: router({
    audits: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getSeoAudits(input.projectId)),

    backlinks: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getBacklinks(input.projectId)),

    runAudit: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        pageUrl: z.string(),
        pageContent: z.string().optional(),
        targetKeyword: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `seo_audit_${input.pageUrl}_${input.targetKeyword}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "seo", topicKey,
          `SEO audit for ${input.pageUrl}`,
          MARKETING_SYSTEM_PROMPT,
          `Perform a comprehensive on-page SEO audit for:
URL: ${input.pageUrl}
Target Keyword: ${input.targetKeyword || "Not specified"}
Page Content Preview: ${input.pageContent?.substring(0, 500) || "Not provided"}

Apply Google's E-E-A-T framework and Core Web Vitals guidelines. Return JSON:
{
  "overallScore": number (0-100),
  "grade": string (A/B/C/D/F),
  "recommendations": [
    {
      "category": string (Title/Meta/Content/Technical/Links/Speed/Mobile),
      "priority": "critical"|"high"|"medium"|"low",
      "issue": string,
      "recommendation": string (plain English, actionable),
      "impact": string (what improvement to expect),
      "howToFix": string (step-by-step instructions)
    }
  ],
  "quickWins": array of strings,
  "estimatedTrafficIncrease": string,
  "coreWebVitalsRecommendations": string,
  "eatSignals": string,
  "schemaMarkupSuggestions": string,
  "internalLinkingOpportunities": string
}`
        );
        let parsed: any = { overallScore: 70, recommendations: [] };
        try { parsed = JSON.parse(content); } catch {}
        const id = await createSeoAudit({
          projectId: input.projectId,
          pageUrl: input.pageUrl,
          score: parsed.overallScore || 70,
          recommendationsJson: content,
        });
        return { id, audit: parsed };
      }),

    addBacklink: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        sourceUrl: z.string(),
        targetUrl: z.string().optional(),
        anchorText: z.string().optional(),
        domainAuthority: z.number().optional(),
        status: z.enum(["active", "lost", "pending"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createBacklink(input);
        return { id };
      }),

    deleteBacklink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBacklink(input.id);
        return { success: true };
      }),

    getBacklinkStrategy: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        businessDescription: z.string(),
        industry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `backlink_strategy_${input.businessDescription}_${input.industry}`;
        return aiWithKnowledge(
          ctx.user.id, input.projectId, "backlinks", topicKey,
          `Backlink strategy for ${input.businessDescription}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a comprehensive backlink acquisition strategy for:
Business: ${input.businessDescription}
Industry: ${input.industry || "General"}

Include:
1. Top 10 types of backlinks to pursue (guest posts, directories, PR, etc.)
2. Specific websites/publications to target
3. Outreach email templates
4. Content assets that naturally attract links (linkable assets)
5. Competitor backlink gap analysis approach
6. Local citation building strategy
7. Toxic link identification and disavow guidance
8. Domain Authority targets by month
9. Link velocity recommendations (how many per month)
10. Quick wins: easy backlinks to get in the first 30 days`
        );
      }),
  }),

  // ─── WhatsApp Campaigns ────────────────────────────────────────────────────
  whatsapp: router({
    generateCampaign: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        campaignGoal: z.string(),
        targetAudience: z.string().optional(),
        businessDescription: z.string().optional(),
        tone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `whatsapp_campaign_${input.campaignGoal}`;
        return aiWithKnowledge(
          ctx.user.id, input.projectId, "whatsapp", topicKey,
          `WhatsApp campaign for ${input.campaignGoal}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a complete WhatsApp Business campaign for:
Goal: ${input.campaignGoal}
Target Audience: ${input.targetAudience || "Existing customers and prospects"}
Business: ${input.businessDescription || ""}
Tone: ${input.tone || "Friendly and professional"}

Return a complete campaign plan including:
1. Campaign overview and objectives
2. Opt-in strategy (how to build your WhatsApp list legally)
3. Message templates (5-7 templates for different stages):
   - Welcome message
   - Value-add message (tip/insight)
   - Promotional message
   - Re-engagement message
   - Follow-up sequence
4. Broadcast schedule (best days/times to send)
5. Audience segmentation strategy
6. Interactive elements (polls, quick replies, CTAs)
7. Expected open rate (WhatsApp: 98% vs email: 20%)
8. Compliance guidelines (GDPR, opt-out handling)
9. Integration with CRM pipeline
10. Success metrics to track`
        );
      }),
  }),

  // ─── Knowledge Base ────────────────────────────────────────────────────────
  knowledge: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(({ ctx, input }) => getKnowledgeEntries(ctx.user.id, input.projectId)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteKnowledge(input.id, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), content: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await updateKnowledgeContent(input.id, ctx.user.id, input.content);
        return { success: true };
      }),

    ask: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        question: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const category = input.category || "qa";
        const topicKey = input.question.toLowerCase().trim().substring(0, 200);
        const answer = await aiWithKnowledge(
          ctx.user.id,
          input.projectId || null,
          category,
          topicKey,
          input.question,
          MARKETING_SYSTEM_PROMPT,
          `Answer this marketing question for a business owner with no marketing background. Use plain English, no jargon. Be specific and actionable.

Question: ${input.question}

Provide:
1. Direct answer (2-3 sentences)
2. Why this matters for their business
3. Step-by-step action plan (3-5 steps)
4. Expected results/timeline
5. Common mistakes to avoid`
        );
        return { answer };
      }),
  }),

  // ─── Client Portal ───────────────────────────────────────────────────────────
  clientPortal: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getClientPortalsByProject(input.projectId)),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        clientName: z.string(),
        clientEmail: z.string().optional(),
        permissions: z.object({
          viewPipeline: z.boolean().default(true),
          editLeads: z.boolean().default(true),
          viewPlan: z.boolean().default(false),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { nanoid } = await import("nanoid");
        const token = nanoid(32);
        const id = await createClientPortalAccess({
          projectId: input.projectId,
          userId: ctx.user.id,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          accessToken: token,
          permissions: JSON.stringify(input.permissions || { viewPipeline: true, editLeads: true, viewPlan: false }),
          isActive: 1,
        });
        return { id, token, portalUrl: `/portal/${token}` };
      }),

    revoke: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await revokeClientPortal(input.id);
        return { success: true };
      }),

    // Public endpoint — no auth, uses token
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const portal = await getClientPortalByToken(input.token);
        if (!portal) throw new Error("Invalid or expired portal link");
        return portal;
      }),

    getLeadsForClient: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const portal = await getClientPortalByToken(input.token);
        if (!portal) throw new Error("Invalid portal");
        return getLeads(portal.projectId);
      }),

    updateLeadAsClient: publicProcedure
      .input(z.object({
        token: z.string(),
        leadId: z.number(),
        stage: z.enum(["new", "qualified", "proposal", "closed_won", "closed_lost"]).optional(),
        notes: z.string().optional(),
        actorName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const portal = await getClientPortalByToken(input.token);
        if (!portal) throw new Error("Invalid portal");
        const perms = JSON.parse(portal.permissions || "{}");
        if (!perms.editLeads) throw new Error("Not permitted");
        const { leadId, stage, notes, actorName } = input;
        if (stage) {
          await updateLead(leadId, { stage, ...(stage === "closed_won" || stage === "closed_lost" ? { closedAt: new Date() } : {}) });
          await addLeadActivity({ leadId, projectId: portal.projectId, actorType: "client", actorName: actorName || portal.clientName, action: "stage_changed", detail: `Stage changed to ${stage}` });
        }
        if (notes) {
          await updateLead(leadId, { notes });
          await addLeadActivity({ leadId, projectId: portal.projectId, actorType: "client", actorName: actorName || portal.clientName, action: "note_added", detail: notes });
        }
        return { success: true };
      }),

    getLeadActivities: publicProcedure
      .input(z.object({ token: z.string(), leadId: z.number() }))
      .query(async ({ input }) => {
        const portal = await getClientPortalByToken(input.token);
        if (!portal) throw new Error("Invalid portal");
        return getLeadActivities(input.leadId);
      }),
  }),

  // ─── Lead Scraper ──────────────────────────────────────────────────────────
  leadScraper: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => getLeadScrapeJobs(input.projectId)),

    run: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        targetIndustry: z.string().optional(),
        targetLocation: z.string().optional(),
        targetCompanySize: z.string().optional(),
        targetJobTitles: z.string().optional(),
        targetKeywords: z.string().optional(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const jobId = await createLeadScrapeJob({ ...input, userId: ctx.user.id, status: "running" });
        // AI-powered lead discovery
        const topicKey = `lead_scrape_${input.targetIndustry}_${input.targetLocation}_${input.targetJobTitles}`;
        try {
          const content = await aiWithKnowledge(
            ctx.user.id, input.projectId, "lead_scrape", topicKey,
            `Find leads: ${input.targetIndustry} in ${input.targetLocation}`,
            MARKETING_SYSTEM_PROMPT,
            `You are a B2B sales strategist. Generate 15-20 AI-created prospect profiles that represent the ideal customer archetype for this target profile. These are illustrative examples to help the user understand who to target and how to approach them — not real people.

Target Profile:
Industry: ${input.targetIndustry || "Any"}
Location: ${input.targetLocation || "Any"}
Company Size: ${input.targetCompanySize || "Any"}
Job Titles to Target: ${input.targetJobTitles || "Decision makers"}
Keywords/Niche: ${input.targetKeywords || ""}
Additional Context: ${input.additionalContext || ""}

Return a JSON array of prospect profiles. Make each profile realistic and specific to the target market:
[
  {
    "name": "Full Name",
    "email": "work@company.com",
    "phone": "+1-555-0100",
    "company": "Company Name",
    "jobTitle": "Job Title",
    "industry": "Industry",
    "location": "City, Country",
    "companySize": "50-200 employees",
    "linkedinUrl": "https://linkedin.com/in/...",
    "source": "AI Lead Discovery",
    "estimatedValue": "5000",
    "whyGoodFit": "Plain English reason why this is a good lead",
    "approachStrategy": "How to approach this specific lead",
    "painPoints": "Likely pain points this lead has"
  }
]

Make the data realistic for the target market. Include a mix of warm and cold leads.`
          );
          let leads: any[] = [];
          try { leads = JSON.parse(content); } catch {}
          await updateLeadScrapeJob(jobId, {
            status: "completed",
            resultsJson: JSON.stringify(leads),
            totalFound: leads.length,
            completedAt: new Date(),
          });
          return { jobId, leads, total: leads.length };
        } catch (err) {
          await updateLeadScrapeJob(jobId, { status: "failed" });
          throw err;
        }
      }),

    importLeads: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        jobId: z.number(),
        leadIndices: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const job = await getLeadScrapeJob(input.jobId);
        if (!job || !job.resultsJson) throw new Error("Job not found");
        const allLeads: any[] = JSON.parse(job.resultsJson);
        const toImport = input.leadIndices.map(i => allLeads[i]).filter(Boolean);
        let imported = 0;
        for (const l of toImport) {
          await createLead({
            projectId: input.projectId,
            name: l.name,
            email: l.email,
            phone: l.phone,
            company: l.company,
            source: l.source || "AI Lead Discovery",
            stage: "new",
            estimatedValue: l.estimatedValue,
            notes: `Job Title: ${l.jobTitle || ""}\nWhy Good Fit: ${l.whyGoodFit || ""}\nApproach: ${l.approachStrategy || ""}\nPain Points: ${l.painPoints || ""}`,
          });
          imported++;
        }
        await updateLeadScrapeJob(input.jobId, { totalImported: (job.totalImported || 0) + imported });
        return { imported };
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    consolidated: protectedProcedure.query(({ ctx }) => getConsolidatedStats(ctx.user.id)),

    leadTrend: protectedProcedure
      .input(z.object({ months: z.number().min(1).max(24).default(6) }))
      .query(({ ctx, input }) => getLeadMonthlyTrend(ctx.user.id, input.months)),

    projectStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const [leadStats, campaigns, content, keywords, backlinks] = await Promise.all([
          getLeadStats(input.projectId),
          getCampaigns(input.projectId),
          getContentItems(input.projectId),
          getKeywords(input.projectId),
          getBacklinks(input.projectId),
        ]);
        const totalBudget = campaigns.reduce((s, c) => s + Number(c.budget || 0), 0);
        const totalSpent = campaigns.reduce((s, c) => s + Number(c.spent || 0), 0);
        const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
        const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
        const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
        const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
        const cpc = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : "0";
        return {
          leads: leadStats,
          campaigns: { total: campaigns.length, totalBudget, totalSpent, totalImpressions, totalClicks, totalConversions, ctr, cpc },
          content: { total: content.length, published: content.filter((c) => c.status === "published").length, scheduled: content.filter((c) => c.status === "scheduled").length },
          seo: { keywords: keywords.length, backlinks: backlinks.length, avgDifficulty: keywords.length > 0 ? Math.round(keywords.reduce((s, k) => s + (k.difficulty || 0), 0) / keywords.length) : 0 },
        };
      }),
  }),

  // ─── API Keys ────────────────────────────────────────────────────────────────

  // ─── Global Settings ──────────────────────────────────────────────────────────
  globalSettings: router({
    get: protectedProcedure
      .input(z.object({
        keys: z.array(z.string()),
      }))
      .query(({ ctx, input }) => getGlobalSettings(ctx.user.id, input.keys)),

    save: protectedProcedure
      .input(z.object({
        settings: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        await setGlobalSettings(ctx.user.id, input.settings);
        return { success: true };
      }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────────
  admin: router({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllUsers();
    }),

    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return updateUserRole(input.userId, input.role);
      }),

    usageStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getUsageStats(ctx.user.id);
    }),
  }),

  apiKeys: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ ctx, input }) => getProjectApiKeys(input.projectId, ctx.user.id)),

    save: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        service: z.string(),
        keyName: z.string(),
        keyValue: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await upsertProjectApiKey({ ...input, userId: ctx.user.id });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProjectApiKey(input.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
