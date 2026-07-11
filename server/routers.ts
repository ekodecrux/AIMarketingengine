import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
      }))
      .mutation(async ({ ctx, input }) => {
        const { goals, targetAudience, location, ...rest } = input;
        const id = await createProject({
          ...rest,
          goal: goals?.join(", ") || input.goal,
          userId: ctx.user.id,
        });
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
        const topicKey = `profile_extract_${input.url}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "profile", topicKey,
          `Extract business profile from ${input.url}`,
          MARKETING_SYSTEM_PROMPT,
          `Analyze this business website URL and extract a comprehensive business profile: ${input.url}
          
Return a JSON object with these fields:
- companyName: string
- industry: string  
- description: string (2-3 sentences about what they do)
- targetAudience: string (who are their ideal customers)
- valueProposition: string (what makes them unique)
- products: string (main products/services)
- toneOfVoice: string (professional/casual/technical/friendly)
- location: string (if detectable)
- marketingOpportunities: string (3-5 key opportunities you see)
- suggestedChannels: string (best marketing channels for this business)`,
          {
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
          }
        );
        let parsed: any = {};
        try { parsed = JSON.parse(content); } catch {}
        await upsertBusinessProfile({
          projectId: input.projectId,
          ...parsed,
          extractionSource: "website",
          sourceUrl: input.url,
          rawExtraction: content,
        });
        return parsed;
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
      }))
      .mutation(async ({ ctx, input }) => {
        const topicKey = `marketing_plan_${input.objective}_${input.budget}_${input.timeframe}`;
        const content = await aiWithKnowledge(
          ctx.user.id, input.projectId, "plan", topicKey,
          `Generate marketing plan for ${input.objective}`,
          MARKETING_SYSTEM_PROMPT,
          `Create a comprehensive, actionable marketing plan with these details:
- Business Objective: ${input.objective}
- Monthly Budget: $${input.budget}
- Timeframe: ${input.timeframe}
- Industry: ${input.industry || "General"}
- Target Audience: ${input.targetAudience || "To be defined"}
- Current Channels: ${input.currentChannels || "None"}

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
        let planObj: any = {};
        try { planObj = JSON.parse(content); } catch {}
        const id = await createMarketingPlan({
          projectId: input.projectId,
          title: `Marketing Plan — ${input.objective}`,
          objective: input.objective,
          totalBudget: input.budget as any,
          timeframe: input.timeframe,
          planJson: content,
          status: "draft",
        });
        return { id, plan: planObj, raw: content };
      }),

    activate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateMarketingPlan(input.id, { status: "active" });
        return { success: true };
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
        await upsertSocialAccount({ ...input, userId: ctx.user.id, status: "connected" });
        return { success: true };
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
Monthly Budget: $${input.budget || "1000"}

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
            `You are a B2B lead generation expert. Generate a list of 15-20 realistic, high-quality potential leads based on this target profile:

Industry: ${input.targetIndustry || "Any"}
Location: ${input.targetLocation || "Any"}
Company Size: ${input.targetCompanySize || "Any"}
Job Titles to Target: ${input.targetJobTitles || "Decision makers"}
Keywords/Niche: ${input.targetKeywords || ""}
Additional Context: ${input.additionalContext || ""}

Return a JSON array of leads. For each lead, generate realistic but fictional data that matches the profile:
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
});

export type AppRouter = typeof appRouter;
