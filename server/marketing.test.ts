import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared mock DB helpers ───────────────────────────────────────────────────
vi.mock("./db", () => ({
  getProjectsByUser: vi.fn().mockResolvedValue([
    { id: 1, name: "Test Project", userId: 1, goal: "Get more leads", monthlyBudget: "2000", industry: "SaaS", status: "active", createdAt: new Date(), updatedAt: new Date() },
  ]),
  getProjectById: vi.fn().mockResolvedValue(
    { id: 1, name: "Test Project", userId: 1, goal: "Get more leads", monthlyBudget: "2000", industry: "SaaS", status: "active", createdAt: new Date(), updatedAt: new Date() }
  ),
  createProject: vi.fn().mockResolvedValue(1),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  getBusinessProfile: vi.fn().mockResolvedValue(null),
  upsertBusinessProfile: vi.fn().mockResolvedValue(undefined),
  getMarketingPlans: vi.fn().mockResolvedValue([]),
  createMarketingPlan: vi.fn().mockResolvedValue(1),
  getKeywords: vi.fn().mockResolvedValue([]),
  createKeyword: vi.fn().mockResolvedValue(1),
  deleteKeyword: vi.fn().mockResolvedValue(undefined),
  getCompetitors: vi.fn().mockResolvedValue([]),
  createCompetitor: vi.fn().mockResolvedValue(1),
  deleteCompetitor: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  createLead: vi.fn().mockResolvedValue(1),
  updateLead: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  getLeadStats: vi.fn().mockResolvedValue({ total: 0, byStage: {}, totalRevenue: 0, conversionRate: 0 }),
  getCampaigns: vi.fn().mockResolvedValue([]),
  createCampaign: vi.fn().mockResolvedValue(1),
  updateCampaign: vi.fn().mockResolvedValue(undefined),
  getContentItems: vi.fn().mockResolvedValue([]),
  createContentItem: vi.fn().mockResolvedValue(1),
  updateContentItem: vi.fn().mockResolvedValue(undefined),
  getSeoAudits: vi.fn().mockResolvedValue([]),
  createSeoAudit: vi.fn().mockResolvedValue(1),
  getBacklinks: vi.fn().mockResolvedValue([]),
  createBacklink: vi.fn().mockResolvedValue(1),
  getSocialAccounts: vi.fn().mockResolvedValue([]),
  connectSocialAccount: vi.fn().mockResolvedValue(1),
  disconnectSocialAccount: vi.fn().mockResolvedValue(undefined),
  getKnowledgeEntries: vi.fn().mockResolvedValue([]),
  createKnowledgeEntry: vi.fn().mockResolvedValue(1),
  getClientPortalsByProject: vi.fn().mockResolvedValue([]),
  createClientPortalAccess: vi.fn().mockResolvedValue(1),
  revokeClientPortal: vi.fn().mockResolvedValue(undefined),
  getClientPortalByToken: vi.fn().mockResolvedValue(null),
  getLeadScraperJobs: vi.fn().mockResolvedValue([]),
  createLeadScraperJob: vi.fn().mockResolvedValue(1),
  updateLeadScraperJob: vi.fn().mockResolvedValue(undefined),
  getConsolidatedStats: vi.fn().mockResolvedValue({ totalProjects: 1, totalLeads: 0, totalRevenue: 0, totalCampaigns: 0, totalContent: 0, recentLeads: [] }),
  getProjectStats: vi.fn().mockResolvedValue({ totalLeads: 0, totalRevenue: 0, totalCampaigns: 0, totalContent: 0 }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Auth context factory ─────────────────────────────────────────────────────
function makeCtx(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeTruthy();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("projects.list", () => {
  it("returns projects for the authenticated user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].name).toBe("Test Project");
  });
});

describe("projects.get", () => {
  it("returns a project by id", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const project = await caller.projects.get({ id: 1 });
    expect(project).toBeTruthy();
    expect(project?.id).toBe(1);
    expect(project?.goal).toBe("Get more leads");
  });
});

describe("projects.create", () => {
  it("creates a new project and returns its id", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.create({ name: "New Project", goal: "Increase brand awareness", industry: "E-commerce" });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });
});

describe("leads.list", () => {
  it("returns leads for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const leads = await caller.leads.list({ projectId: 1 });
    expect(Array.isArray(leads)).toBe(true);
  });
});

describe("leads.create", () => {
  it("creates a lead and returns its id", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.leads.create({ projectId: 1, name: "John Doe", email: "john@example.com", source: "seo" });
    expect(result).toHaveProperty("id");
  });
});

describe("leads.stats", () => {
  it("returns lead statistics for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.leads.stats({ projectId: 1 });
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("totalRevenue");
    expect(stats).toHaveProperty("conversionRate");
  });
});

describe("keywords.list", () => {
  it("returns keywords for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const keywords = await caller.keywords.list({ projectId: 1 });
    expect(Array.isArray(keywords)).toBe(true);
  });
});

describe("campaigns.list", () => {
  it("returns campaigns for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const campaigns = await caller.campaigns.list({ projectId: 1 });
    expect(Array.isArray(campaigns)).toBe(true);
  });
});

describe("seo.audits", () => {
  it("returns SEO audits for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const audits = await caller.seo.audits({ projectId: 1 });
    expect(Array.isArray(audits)).toBe(true);
  });
});

describe("seo.backlinks", () => {
  it("returns backlinks for a project", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const backlinks = await caller.seo.backlinks({ projectId: 1 });
    expect(Array.isArray(backlinks)).toBe(true);
  });
});

describe("socialAccounts.list", () => {
  it("returns connected social accounts", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const accounts = await caller.socialAccounts.list({});
    expect(Array.isArray(accounts)).toBe(true);
  });
});

describe("dashboard.consolidated", () => {
  it("returns consolidated stats across all projects", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.consolidated();
    expect(stats).toHaveProperty("totalProjects");
    expect(stats).toHaveProperty("totalLeads");
    expect(stats).toHaveProperty("totalRevenue");
  });
});

describe("clientPortal.getByToken", () => {
  it("throws for an invalid token", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.clientPortal.getByToken({ token: "invalid-token-xyz" })).rejects.toThrow();
  });
});
