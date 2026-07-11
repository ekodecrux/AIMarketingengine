export type PlatformType = "linkedin" | "facebook" | "instagram" | "twitter" | "whatsapp" | "quora" | "google";
export type LeadStage = "new" | "qualified" | "proposal" | "closed_won" | "closed_lost";
export type ContentType = "blog" | "social" | "linkedin";
export type CampaignStatus = "planned" | "active" | "paused" | "completed";
export type ProjectStatus = "active" | "paused" | "archived";

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X / Twitter",
  whatsapp: "WhatsApp",
  quora: "Quora",
  google: "Google Ads",
};

export const PLATFORM_COLORS: Record<PlatformType, string> = {
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  instagram: "#E1306C",
  twitter: "#1DA1F2",
  whatsapp: "#25D366",
  quora: "#B92B27",
  google: "#4285F4",
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New Lead",
  qualified: "Qualified",
  proposal: "Proposal Sent",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  new: "badge-new",
  qualified: "badge-qualified",
  proposal: "badge-proposal",
  closed_won: "badge-won",
  closed_lost: "badge-lost",
};

export const INDUSTRIES = [
  "Technology & SaaS",
  "E-commerce & Retail",
  "Healthcare & Wellness",
  "Finance & Fintech",
  "Real Estate",
  "Education & EdTech",
  "Food & Beverage",
  "Travel & Hospitality",
  "Professional Services",
  "Manufacturing",
  "Media & Entertainment",
  "Non-profit",
  "Other",
];

export const MARKETING_GOALS = [
  "Generate more leads",
  "Increase brand awareness",
  "Drive website traffic",
  "Boost online sales",
  "Improve customer retention",
  "Launch a new product",
  "Enter a new market",
  "Build thought leadership",
];

export const GLOSSARY: Record<string, string> = {
  SEO: "Search Engine Optimisation — getting your website to appear higher in Google search results without paying for ads.",
  CTR: "Click-Through Rate — the percentage of people who click your ad or link after seeing it. Higher is better.",
  CPC: "Cost Per Click — how much you pay each time someone clicks your ad.",
  ROI: "Return on Investment — how much money you make back for every dollar you spend on marketing.",
  TOFU: "Top of Funnel — content for people who don't know you yet. Think blog posts and social media.",
  MOFU: "Middle of Funnel — content for people considering your product. Think case studies and webinars.",
  BOFU: "Bottom of Funnel — content for people ready to buy. Think demos, pricing pages, and testimonials.",
  CLV: "Customer Lifetime Value — the total revenue you expect from one customer over their entire relationship with you.",
  "E-E-A-T": "Experience, Expertise, Authoritativeness, Trustworthiness — Google's quality signals for ranking content.",
  "Domain Authority": "A score (0-100) that predicts how well a website will rank in search engines. Higher is better.",
  Backlink: "A link from another website to yours. More high-quality backlinks = higher Google rankings.",
  Retargeting: "Showing ads to people who already visited your website but didn't buy.",
  "Conversion Rate": "The percentage of visitors who take the action you want (buy, sign up, call you).",
  Impression: "One view of your ad or content. Doesn't mean anyone clicked — just that they saw it.",
  "Lead Magnet": "A free resource (guide, checklist, webinar) you offer in exchange for someone's contact details.",
};
