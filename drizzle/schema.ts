import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Projects: one per business/client, fully isolated workspaces */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  industry: varchar("industry", { length: 255 }),
  goal: text("goal"),
  monthlyBudget: decimal("monthlyBudget", { precision: 12, scale: 2 }),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  status: mysqlEnum("status", ["active", "paused", "archived"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/** Business profile extracted via AI from website or manual inputs */
export const businessProfiles = mysqlTable("businessProfiles", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  description: text("description"),
  targetAudience: text("targetAudience"),
  valueProposition: text("valueProposition"),
  products: text("products"),
  toneOfVoice: varchar("toneOfVoice", { length: 255 }),
  location: varchar("location", { length: 255 }),
  extractionSource: mysqlEnum("extractionSource", ["website", "manual", "hybrid"])
    .default("manual")
    .notNull(),
    sourceUrl: varchar("sourceUrl", { length: 500 }),
  rawExtraction: text("rawExtraction"),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessProfile = typeof businessProfiles.$inferSelect;

/** AI generated marketing plans */
export const marketingPlans = mysqlTable("marketingPlans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  objective: text("objective"),
  totalBudget: decimal("totalBudget", { precision: 12, scale: 2 }),
  timeframe: varchar("timeframe", { length: 64 }),
  planJson: text("planJson"), // full structured plan (strategy, channels, budget allocation, milestones)
  status: mysqlEnum("status", ["draft", "active", "completed"])
    .default("draft")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketingPlan = typeof marketingPlans.$inferSelect;

/** Keyword research results */
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  searchVolume: varchar("searchVolume", { length: 64 }),
  difficulty: int("difficulty"), // 0-100
  intent: mysqlEnum("intent", [
    "informational",
    "navigational",
    "commercial",
    "transactional",
  ]).default("informational"),
  cpc: varchar("cpc", { length: 32 }),
  opportunity: text("opportunity"),
  currentRank: int("currentRank"),
  targetRank: int("targetRank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Keyword = typeof keywords.$inferSelect;

/** Competitor analysis entries */
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  positioning: text("positioning"),
  channels: text("channels"),
  estimatedTraffic: varchar("estimatedTraffic", { length: 64 }),
  threatLevel: mysqlEnum("threatLevel", ["low", "medium", "high"]).default("medium"),
  analysisJson: text("analysisJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;

/** Content items: blogs, social posts, LinkedIn branding */
export const contentItems = mysqlTable("contentItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("type", ["blog", "social", "linkedin"]).notNull(),
  platform: varchar("platform", { length: 64 }), // linkedin, facebook, instagram, twitter, website
  title: varchar("title", { length: 500 }),
  body: text("body"),
  hashtags: text("hashtags"),
  status: mysqlEnum("status", ["draft", "scheduled", "published"])
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  aiGenerated: int("aiGenerated").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentItem = typeof contentItems.$inferSelect;

/** Connected social media accounts with credentials */
export const socialAccounts = mysqlTable("socialAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  platform: mysqlEnum("platform", [
    "linkedin",
    "facebook",
    "instagram",
    "twitter",
    "whatsapp",
    "quora",
    "google",
  ]).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  accessToken: text("accessToken"),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  status: mysqlEnum("status", ["connected", "disconnected", "error"])
    .default("connected")
    .notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;

/** Leads with CRM pipeline stages and revenue tracking */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  source: varchar("source", { length: 128 }), // seo, social, paid, referral, other
  stage: mysqlEnum("stage", [
    "new",
    "qualified",
    "proposal",
    "closed_won",
    "closed_lost",
  ])
    .default("new")
    .notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  actualRevenue: decimal("actualRevenue", { precision: 12, scale: 2 }),
  notes: text("notes"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;

/** Paid campaigns with metrics and retargeting */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 64 }), // google, facebook, instagram, linkedin, twitter
  objective: varchar("objective", { length: 255 }),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  conversions: int("conversions").default(0),
  isRetargeting: int("isRetargeting").default(0),
  retargetingStrategy: text("retargetingStrategy"),
  status: mysqlEnum("status", ["planned", "active", "paused", "completed"])
    .default("planned")
    .notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;

/** Backlinks tracking */
export const backlinks = mysqlTable("backlinks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 500 }).notNull(),
  targetUrl: varchar("targetUrl", { length: 500 }),
  anchorText: varchar("anchorText", { length: 255 }),
  domainAuthority: int("domainAuthority"),
  status: mysqlEnum("status", ["active", "lost", "pending"])
    .default("active")
    .notNull(),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
});

export type Backlink = typeof backlinks.$inferSelect;

/** SEO audits / on-page recommendations */
export const seoAudits = mysqlTable("seoAudits", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  pageUrl: varchar("pageUrl", { length: 500 }),
  score: int("score"),
  recommendationsJson: text("recommendationsJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeoAudit = typeof seoAudits.$inferSelect;

/**
 * Knowledge base entries (RAG-style).
 * Every AI output is stored as knowledge; future queries are answered
 * from the knowledge base first (context-aware retrieval), with AI as fallback.
 */
export const knowledgeEntries = mysqlTable("knowledgeEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  category: varchar("category", { length: 128 }).notNull(), // plan, keyword, competitor, content, seo, retargeting, profile, qa
  topicKey: varchar("topicKey", { length: 500 }).notNull(), // normalized query/topic used for retrieval matching
  question: text("question"),
  content: text("content").notNull(),
  source: mysqlEnum("source", ["ai", "knowledge", "manual"]).default("ai").notNull(),
  hitCount: int("hitCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;

/** Client portal access tokens — gives clients a branded view of their project */
export const clientPortalAccess = mysqlTable("clientPortalAccess", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(), // admin who created this
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  accessToken: varchar("accessToken", { length: 128 }).notNull().unique(),
  permissions: text("permissions"), // JSON: {viewPipeline, editLeads, viewPlan}
  isActive: int("isActive").default(1),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientPortalAccess = typeof clientPortalAccess.$inferSelect;

/** Lead activity log — tracks every action on a lead */
export const leadActivities = mysqlTable("leadActivities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  projectId: int("projectId").notNull(),
  actorType: mysqlEnum("actorType", ["admin", "client"]).default("admin").notNull(),
  actorName: varchar("actorName", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(), // stage_changed, note_added, contacted, etc.
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadActivity = typeof leadActivities.$inferSelect;

/** AI lead scrape jobs */
export const leadScrapeJobs = mysqlTable("leadScrapeJobs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  targetIndustry: varchar("targetIndustry", { length: 255 }),
  targetLocation: varchar("targetLocation", { length: 255 }),
  targetCompanySize: varchar("targetCompanySize", { length: 128 }),
  targetJobTitles: text("targetJobTitles"),
  targetKeywords: text("targetKeywords"),
  additionalContext: text("additionalContext"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  resultsJson: text("resultsJson"), // array of discovered leads
  totalFound: int("totalFound").default(0),
  totalImported: int("totalImported").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type LeadScrapeJob = typeof leadScrapeJobs.$inferSelect;

/** Per-project integration API keys (Google Analytics, SendGrid, etc.) */
export const projectApiKeys = mysqlTable("projectApiKeys", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  service: varchar("service", { length: 64 }).notNull(), // e.g. "google_analytics", "sendgrid", "mailchimp"
  keyName: varchar("keyName", { length: 128 }).notNull(), // human label e.g. "Measurement ID"
  keyValue: text("keyValue").notNull(), // stored value (treat as sensitive)
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectApiKey = typeof projectApiKeys.$inferSelect;
export type InsertProjectApiKey = typeof projectApiKeys.$inferInsert;
