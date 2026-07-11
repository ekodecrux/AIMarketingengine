/**
 * socialValidator.ts
 * Real credential validation for each social platform.
 * Each validator makes a lightweight API call to verify the token/key is valid.
 * Returns { valid: boolean; accountInfo?: string; error?: string }
 */

export interface ValidationResult {
  valid: boolean;
  accountInfo?: string; // e.g. "John Doe (LinkedIn)" or "Page: My Business"
  error?: string;
}

const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────
// Uses the /v2/userinfo endpoint (OpenID Connect) which works for any valid OAuth2 token
async function validateLinkedIn(accessToken: string): Promise<ValidationResult> {
  try {
    const res = await fetchWithTimeout("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { valid: false, error: `LinkedIn API returned ${res.status}: ${body.slice(0, 120)}` };
    }
    const data: any = await res.json();
    const name = data.name || data.localizedFirstName || "LinkedIn User";
    return { valid: true, accountInfo: name };
  } catch (err: any) {
    return { valid: false, error: `LinkedIn validation failed: ${err.message}` };
  }
}

// ─── Facebook / Instagram ─────────────────────────────────────────────────────
// Uses Meta's token debug endpoint — works for both Facebook and Instagram tokens
async function validateMeta(accessToken: string, appId?: string, appSecret?: string): Promise<ValidationResult> {
  try {
    // If app credentials provided, use the debug_token endpoint for full validation
    if (appId && appSecret) {
      const appToken = `${appId}|${appSecret}`;
      const res = await fetchWithTimeout(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`
      );
      if (!res.ok) return { valid: false, error: `Meta API returned ${res.status}` };
      const data: any = await res.json();
      if (!data.data?.is_valid) {
        return { valid: false, error: data.data?.error?.message || "Token is not valid" };
      }
      return { valid: true, accountInfo: data.data.app || "Meta Account" };
    }

    // Fallback: use /me endpoint with just the access token
    const res = await fetchWithTimeout(
      `https://graph.facebook.com/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      return { valid: false, error: body?.error?.message || `Meta API returned ${res.status}` };
    }
    const data: any = await res.json();
    return { valid: true, accountInfo: data.name || "Meta Account" };
  } catch (err: any) {
    return { valid: false, error: `Meta validation failed: ${err.message}` };
  }
}

// ─── Google ───────────────────────────────────────────────────────────────────
// Uses Google's tokeninfo endpoint
async function validateGoogle(accessToken: string): Promise<ValidationResult> {
  try {
    const res = await fetchWithTimeout(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      return { valid: false, error: body?.error_description || `Google API returned ${res.status}` };
    }
    const data: any = await res.json();
    if (data.error) return { valid: false, error: data.error_description || data.error };
    return { valid: true, accountInfo: data.email || "Google Account" };
  } catch (err: any) {
    return { valid: false, error: `Google validation failed: ${err.message}` };
  }
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────
// Uses Twitter API v2 /users/me endpoint
async function validateTwitter(accessToken: string): Promise<ValidationResult> {
  try {
    const res = await fetchWithTimeout("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      return { valid: false, error: body?.detail || body?.title || `Twitter API returned ${res.status}` };
    }
    const data: any = await res.json();
    return { valid: true, accountInfo: `@${data.data?.username || "twitter_user"}` };
  } catch (err: any) {
    return { valid: false, error: `Twitter validation failed: ${err.message}` };
  }
}

// ─── WhatsApp (Meta Business API) ────────────────────────────────────────────
// Uses the same Meta /me endpoint — WhatsApp Business tokens are Meta tokens
async function validateWhatsApp(accessToken: string): Promise<ValidationResult> {
  try {
    const res = await fetchWithTimeout(
      `https://graph.facebook.com/me?access_token=${encodeURIComponent(accessToken)}`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as any;
      return { valid: false, error: body?.error?.message || `WhatsApp API returned ${res.status}` };
    }
    const data: any = await res.json();
    return { valid: true, accountInfo: data.name || "WhatsApp Business Account" };
  } catch (err: any) {
    return { valid: false, error: `WhatsApp validation failed: ${err.message}` };
  }
}

// ─── Quora ────────────────────────────────────────────────────────────────────
// Quora Ads API — validate using the /me endpoint
async function validateQuora(apiKey: string): Promise<ValidationResult> {
  try {
    const res = await fetchWithTimeout("https://api.quora.com/ads/v0/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return { valid: false, error: `Quora API returned ${res.status} — check your API key` };
    }
    const data: any = await res.json();
    return { valid: true, accountInfo: data.email || "Quora Ads Account" };
  } catch (err: any) {
    return { valid: false, error: `Quora validation failed: ${err.message}` };
  }
}

// ─── Main dispatcher ─────────────────────────────────────────────────────────
export async function validateSocialCredentials(
  platform: string,
  accessToken?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<ValidationResult> {
  const token = accessToken || apiKey || "";

  if (!token) {
    return { valid: false, error: "No credentials provided" };
  }

  switch (platform) {
    case "linkedin":
      return validateLinkedIn(token);
    case "facebook":
      return validateMeta(token, apiKey, apiSecret);
    case "instagram":
      // Instagram uses Meta's Graph API — same validation
      return validateMeta(token, apiKey, apiSecret);
    case "google":
      return validateGoogle(token);
    case "twitter":
      return validateTwitter(token);
    case "whatsapp":
      return validateWhatsApp(token);
    case "quora":
      return validateQuora(token);
    default:
      return { valid: false, error: `Unknown platform: ${platform}` };
  }
}
