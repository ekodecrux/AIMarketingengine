import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Backlink,
  BusinessProfile,
  Campaign,
  ClientPortalAccess,
  Competitor,
  ContentItem,
  InsertUser,
  Keyword,
  KnowledgeEntry,
  Lead,
  LeadActivity,
  LeadScrapeJob,
  MarketingPlan,
  Project,
  SeoAudit,
  SocialAccount,
  backlinks,
  businessProfiles,
  campaigns,
  clientPortalAccess,
  competitors,
  contentItems,
  keywords,
  knowledgeEntries,
  leadActivities,
  leadScrapeJobs,
  leads,
  marketingPlans,
  projects,
  seoAudits,
  socialAccounts,
  users,
  projectApiKeys,
  ProjectApiKey,
  InsertProjectApiKey,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmailAndPassword(email: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.passwordHash, passwordHash)))
    .limit(1);
  return result[0];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
  return result[0];
}

export async function createProject(data: typeof projects.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(projects).values(data);
  return (result[0] as any).insertId;
}

export async function updateProject(id: number, userId: number, data: Partial<typeof projects.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// ─── Business Profiles ────────────────────────────────────────────────────────

export async function getBusinessProfile(projectId: number): Promise<BusinessProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.projectId, projectId)).limit(1);
  return result[0];
}

export async function upsertBusinessProfile(data: typeof businessProfiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getBusinessProfile(data.projectId);
  if (existing) {
    await db.update(businessProfiles).set(data).where(eq(businessProfiles.projectId, data.projectId));
  } else {
    await db.insert(businessProfiles).values(data);
  }
}

// ─── Marketing Plans ──────────────────────────────────────────────────────────

export async function getMarketingPlans(projectId: number): Promise<MarketingPlan[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketingPlans).where(eq(marketingPlans.projectId, projectId)).orderBy(desc(marketingPlans.createdAt));
}

export async function createMarketingPlan(data: typeof marketingPlans.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(marketingPlans).values(data);
  return (result[0] as any).insertId;
}

export async function updateMarketingPlan(id: number, data: Partial<typeof marketingPlans.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(marketingPlans).set(data).where(eq(marketingPlans.id, id));
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

export async function getKeywords(projectId: number): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(keywords).where(eq(keywords.projectId, projectId)).orderBy(keywords.difficulty);
}

export async function createKeywords(data: (typeof keywords.$inferInsert)[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.length === 0) return;
  await db.insert(keywords).values(data);
}

export async function deleteKeyword(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(keywords).where(eq(keywords.id, id));
}

// ─── Competitors ──────────────────────────────────────────────────────────────

export async function getCompetitors(projectId: number): Promise<Competitor[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(competitors).where(eq(competitors.projectId, projectId)).orderBy(desc(competitors.createdAt));
}

export async function createCompetitor(data: typeof competitors.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(competitors).values(data);
  return (result[0] as any).insertId;
}

export async function deleteCompetitor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(competitors).where(eq(competitors.id, id));
}

// ─── Content Items ────────────────────────────────────────────────────────────

export async function getContentItems(projectId: number, type?: string): Promise<ContentItem[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = type
    ? and(eq(contentItems.projectId, projectId), eq(contentItems.type, type as any))
    : eq(contentItems.projectId, projectId);
  return db.select().from(contentItems).where(conditions).orderBy(desc(contentItems.createdAt));
}

export async function createContentItem(data: typeof contentItems.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contentItems).values(data);
  return (result[0] as any).insertId;
}

export async function updateContentItem(id: number, data: Partial<typeof contentItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contentItems).set(data).where(eq(contentItems.id, id));
}

export async function deleteContentItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contentItems).where(eq(contentItems.id, id));
}

// ─── Social Accounts ──────────────────────────────────────────────────────────

export async function getSocialAccounts(userId: number, projectId?: number): Promise<SocialAccount[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = projectId
    ? and(eq(socialAccounts.userId, userId), eq(socialAccounts.projectId, projectId))
    : eq(socialAccounts.userId, userId);
  return db.select().from(socialAccounts).where(conditions);
}

export async function upsertSocialAccount(data: typeof socialAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(socialAccounts)
    .where(and(eq(socialAccounts.userId, data.userId!), eq(socialAccounts.platform, data.platform)))
    .limit(1);
  if (existing[0]) {
    await db.update(socialAccounts).set(data).where(eq(socialAccounts.id, existing[0].id));
  } else {
    await db.insert(socialAccounts).values(data);
  }
}

export async function deleteSocialAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(socialAccounts).where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)));
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads(projectId: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.projectId, projectId)).orderBy(desc(leads.createdAt));
}

export async function createLead(data: typeof leads.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leads).values(data);
  return (result[0] as any).insertId;
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(leads).where(eq(leads.id, id));
}

export async function getLeadStats(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const all = await db.select().from(leads).where(eq(leads.projectId, projectId));
  const total = all.length;
  const byStage = { new: 0, qualified: 0, proposal: 0, closed_won: 0, closed_lost: 0 };
  let totalRevenue = 0;
  let totalPipeline = 0;
  all.forEach((l) => {
    byStage[l.stage] = (byStage[l.stage] || 0) + 1;
    if (l.stage === "closed_won" && l.actualRevenue) totalRevenue += Number(l.actualRevenue);
    if (l.estimatedValue) totalPipeline += Number(l.estimatedValue);
  });
  const conversionRate = total > 0 ? Math.round((byStage.closed_won / total) * 100) : 0;
  return { total, byStage, totalRevenue, totalPipeline, conversionRate };
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export async function getCampaigns(projectId: number): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.projectId, projectId)).orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(data: typeof campaigns.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(campaigns).values(data);
  return (result[0] as any).insertId;
}

export async function updateCampaign(id: number, data: Partial<typeof campaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ─── Backlinks ────────────────────────────────────────────────────────────────

export async function getBacklinks(projectId: number): Promise<Backlink[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(backlinks).where(eq(backlinks.projectId, projectId)).orderBy(desc(backlinks.domainAuthority));
}

export async function createBacklink(data: typeof backlinks.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(backlinks).values(data);
  return (result[0] as any).insertId;
}

export async function deleteBacklink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(backlinks).where(eq(backlinks.id, id));
}

// ─── SEO Audits ───────────────────────────────────────────────────────────────

export async function getSeoAudits(projectId: number): Promise<SeoAudit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seoAudits).where(eq(seoAudits.projectId, projectId)).orderBy(desc(seoAudits.createdAt));
}

export async function createSeoAudit(data: typeof seoAudits.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(seoAudits).values(data);
  return (result[0] as any).insertId;
}

// ─── Knowledge Base (RAG) ─────────────────────────────────────────────────────

export async function findKnowledge(userId: number, projectId: number | null, category: string, topicKey: string): Promise<KnowledgeEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // Normalize the topic key for fuzzy matching
  const normalized = topicKey.toLowerCase().trim().substring(0, 200);
  const conditions = projectId
    ? and(eq(knowledgeEntries.userId, userId), eq(knowledgeEntries.projectId, projectId), eq(knowledgeEntries.category, category))
    : and(eq(knowledgeEntries.userId, userId), eq(knowledgeEntries.category, category));
  const results = await db.select().from(knowledgeEntries).where(conditions).orderBy(desc(knowledgeEntries.hitCount));
  // Simple keyword overlap matching
  const match = results.find((r) => {
    const rKey = r.topicKey.toLowerCase();
    const words = normalized.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = words.filter((w) => rKey.includes(w)).length;
    return matchCount >= Math.max(1, Math.floor(words.length * 0.4));
  });
  if (match) {
    // Increment hit count
    await db.update(knowledgeEntries).set({ hitCount: (match.hitCount || 0) + 1 }).where(eq(knowledgeEntries.id, match.id));
  }
  return match;
}

export async function saveKnowledge(data: typeof knowledgeEntries.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(knowledgeEntries).values(data);
}

export async function getKnowledgeEntries(userId: number, projectId?: number): Promise<KnowledgeEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = projectId
    ? and(eq(knowledgeEntries.userId, userId), eq(knowledgeEntries.projectId, projectId))
    : eq(knowledgeEntries.userId, userId);
  return db.select().from(knowledgeEntries).where(conditions).orderBy(desc(knowledgeEntries.createdAt));
}

// ─── Consolidated Dashboard ───────────────────────────────────────────────────

export async function getConsolidatedStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
  const projectIds = userProjects.map((p) => p.id);
  if (projectIds.length === 0) return { projects: 0, leads: 0, revenue: 0, campaigns: 0, content: 0, pipeline: 0, conversionRate: 0 };

  let totalLeads = 0, totalRevenue = 0, totalPipeline = 0, closedWon = 0;
  let totalCampaigns = 0, totalContent = 0;

  for (const pid of projectIds) {
    const pLeads = await db.select().from(leads).where(eq(leads.projectId, pid));
    totalLeads += pLeads.length;
    pLeads.forEach((l) => {
      if (l.stage === "closed_won" && l.actualRevenue) totalRevenue += Number(l.actualRevenue);
      if (l.estimatedValue) totalPipeline += Number(l.estimatedValue);
      if (l.stage === "closed_won") closedWon++;
    });
    const pCampaigns = await db.select().from(campaigns).where(eq(campaigns.projectId, pid));
    totalCampaigns += pCampaigns.length;
    const pContent = await db.select().from(contentItems).where(eq(contentItems.projectId, pid));
    totalContent += pContent.length;
  }

  return {
    projects: userProjects.length,
    leads: totalLeads,
    revenue: totalRevenue,
    pipeline: totalPipeline,
    campaigns: totalCampaigns,
    content: totalContent,
    conversionRate: totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0,
  };
}

// ─── Monthly Lead & Revenue Trend ───────────────────────────────────────────

export async function getLeadMonthlyTrend(userId: number, months = 6) {
  const db = await getDb();
  if (!db) return [];
  const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
  const projectIds = userProjects.map((p) => p.id);
  if (projectIds.length === 0) return [];

  // Collect all leads across all projects
  const allLeads: Lead[] = [];
  for (const pid of projectIds) {
    const pLeads = await db.select().from(leads).where(eq(leads.projectId, pid));
    allLeads.push(...pLeads);
  }

  // Build monthly buckets for the last N months
  const now = new Date();
  const buckets: { month: string; leads: number; revenue: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleString("en-US", { month: "short" }),
      leads: 0,
      revenue: 0,
    });
  }

  for (const lead of allLeads) {
    // Leads counted by creation month
    const created = new Date(lead.createdAt);
    const diffCreated = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    if (diffCreated >= 0 && diffCreated < months) {
      buckets[months - 1 - diffCreated].leads += 1;
    }
    // Revenue counted by close month (closedAt), not creation month
    if (lead.stage === "closed_won" && lead.actualRevenue && lead.closedAt) {
      const closed = new Date(lead.closedAt);
      const diffClosed = (now.getFullYear() - closed.getFullYear()) * 12 + (now.getMonth() - closed.getMonth());
      if (diffClosed >= 0 && diffClosed < months) {
        buckets[months - 1 - diffClosed].revenue += Number(lead.actualRevenue);
      }
    }
  }

  return buckets;
}

// ─── Knowledge / Usage Stats ─────────────────────────────────────────────────

export async function getUsageStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalAiCalls: 0, totalKnowledgeEntries: 0, byCategory: {} };
  const entries = await db.select().from(knowledgeEntries).where(eq(knowledgeEntries.userId, userId));
  const byCategory: Record<string, number> = {};
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }
  return {
    totalAiCalls: entries.length,
    totalKnowledgeEntries: entries.length,
    byCategory,
  };
}

// ─── User Management (admin) ─────────────────────────────────────────────────

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

// ─── Global Settings ─────────────────────────────────────────────────────────

export async function getGlobalSetting(userId: number, key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { globalSettings } = await import("../drizzle/schema");
  const rows = await db.select().from(globalSettings)
    .where(and(eq(globalSettings.userId, userId), eq(globalSettings.settingKey, key)))
    .limit(1);
  return rows[0]?.settingValue ?? null;
}

export async function setGlobalSetting(userId: number, key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { globalSettings } = await import("../drizzle/schema");
  await db.insert(globalSettings).values({ userId, settingKey: key, settingValue: value })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

export async function getGlobalSettings(userId: number, keys: string[]): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const { globalSettings } = await import("../drizzle/schema");
  const rows = await db.select().from(globalSettings)
    .where(and(eq(globalSettings.userId, userId), inArray(globalSettings.settingKey, keys)));
  return Object.fromEntries(rows.map(r => [r.settingKey, r.settingValue ?? ""]));
}

export async function setGlobalSettings(userId: number, settings: Record<string, string>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { globalSettings } = await import("../drizzle/schema");
  for (const [key, value] of Object.entries(settings)) {
    await db.insert(globalSettings).values({ userId, settingKey: key, settingValue: value })
      .onDuplicateKeyUpdate({ set: { settingValue: value } });
  }
}

// ─── Client Portal ────────────────────────────────────────────────────────────

export async function createClientPortalAccess(data: typeof clientPortalAccess.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clientPortalAccess).values(data);
  return (result[0] as any).insertId;
}

export async function getClientPortalByToken(token: string): Promise<ClientPortalAccess | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientPortalAccess)
    .where(and(eq(clientPortalAccess.accessToken, token), eq(clientPortalAccess.isActive, 1)))
    .limit(1);
  if (result[0]) {
    await db.update(clientPortalAccess).set({ lastAccessedAt: new Date() }).where(eq(clientPortalAccess.id, result[0].id));
  }
  return result[0];
}

export async function getClientPortalsByProject(projectId: number): Promise<ClientPortalAccess[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientPortalAccess).where(eq(clientPortalAccess.projectId, projectId)).orderBy(desc(clientPortalAccess.createdAt));
}

export async function revokeClientPortal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clientPortalAccess).set({ isActive: 0 }).where(eq(clientPortalAccess.id, id));
}

// ─── Lead Activities ──────────────────────────────────────────────────────────

export async function addLeadActivity(data: typeof leadActivities.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(leadActivities).values(data);
}

export async function getLeadActivities(leadId: number): Promise<LeadActivity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadActivities).where(eq(leadActivities.leadId, leadId)).orderBy(desc(leadActivities.createdAt));
}

// ─── Lead Scrape Jobs ─────────────────────────────────────────────────────────

export async function createLeadScrapeJob(data: typeof leadScrapeJobs.$inferInsert): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leadScrapeJobs).values(data);
  return (result[0] as any).insertId;
}

export async function updateLeadScrapeJob(id: number, data: Partial<typeof leadScrapeJobs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leadScrapeJobs).set(data).where(eq(leadScrapeJobs.id, id));
}

export async function getLeadScrapeJobs(projectId: number): Promise<LeadScrapeJob[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadScrapeJobs).where(eq(leadScrapeJobs.projectId, projectId)).orderBy(desc(leadScrapeJobs.createdAt));
}

export async function getLeadScrapeJob(id: number): Promise<LeadScrapeJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leadScrapeJobs).where(eq(leadScrapeJobs.id, id)).limit(1);
  return result[0];
}

// ─── Project API Keys ──────────────────────────────────────────────────────────
export async function getProjectApiKeys(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectApiKeys).where(and(eq(projectApiKeys.projectId, projectId), eq(projectApiKeys.userId, userId)));
}

export async function upsertProjectApiKey(data: { projectId: number; userId: number; service: string; keyName: string; keyValue: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(projectApiKeys)
    .where(and(eq(projectApiKeys.projectId, data.projectId), eq(projectApiKeys.userId, data.userId), eq(projectApiKeys.service, data.service), eq(projectApiKeys.keyName, data.keyName)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(projectApiKeys).set({ keyValue: data.keyValue, isActive: 1 })
      .where(eq(projectApiKeys.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(projectApiKeys).values({ ...data, isActive: 1 });
  return (result as any).insertId as number;
}

export async function deleteProjectApiKey(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(projectApiKeys).where(eq(projectApiKeys.id, id));
}
