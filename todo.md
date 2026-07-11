# AI Marketing Platform TODO

## Backend
- [x] Database schema: projects, business profiles, marketing plans, keywords, competitors, content items, social accounts, leads, campaigns, backlinks, seo audits, knowledge base entries
- [x] Apply schema migration to database
- [x] DB query helpers in server/db.ts
- [x] Projects router: CRUD, project switching, isolated per-user data
- [x] Business profile extraction: from website URL (fetch + AI extract) or manual inputs
- [x] AI marketing plan generator: goal-based, SEO-primary, budget allocation across channels
- [x] Keyword analysis: AI-powered research with difficulty scoring
- [x] Competitor analysis: AI landscape breakdown per project
- [x] Content studio backend: AI blog posts, social posts, LinkedIn branding content; scheduling fields
- [x] Social accounts: store credentials per platform (LinkedIn, Facebook, Instagram, X, WhatsApp, Google, Quora), simulated/direct publish flow
- [x] Leads CRM: capture, pipeline stages (New, Qualified, Proposal, Closed Won, Closed Lost), revenue tracking
- [x] Campaigns: paid campaign CRUD, budget, metrics (impressions, clicks, conversions), retargeting strategy generation
- [x] SEO tools: on-page recommendations, backlink tracking, keyword ranking monitoring
- [x] Knowledge base (RAG-style): store AI outputs as knowledge, context-aware retrieval first, AI fallback on miss
- [x] Consolidated dashboard aggregation endpoints (cross-project KPIs)

## Frontend
- [x] Elegant premium design system (typography, palette, spacing, motion) in index.css
- [x] Landing page for logged-out users
- [x] Dashboard layout with sidebar navigation + project switcher
- [x] Consolidated dashboard: cross-project overview with charts and filters
- [x] Project creation & management UI
- [x] Business profile page (URL extraction + manual entry)
- [x] Marketing plan page (generate, view structured plan, budget allocation charts)
- [x] Keyword analysis page (table with difficulty scoring)
- [x] Competitor analysis page
- [x] Content studio (generate blog/social/LinkedIn content, schedule, publish status)
- [x] Social integrations settings page (connect accounts with credentials)
- [x] Leads CRM pipeline (kanban-style stages, revenue/ROI reporting)
- [x] Campaigns page (budget, metrics, retargeting)
- [x] SEO & backlinks page
- [x] Knowledge base page (browse stored knowledge, context-aware answers)

## Quality & Delivery
- [x] Vitest unit tests for core routers (17 tests passing)
- [x] End-to-end verification via preview screenshots
- [x] Save checkpoint and share preview with user
- [x] Push MVP to GitHub repo ekodecrux/AIMarketingengine
- [x] Push each subsequent change to GitHub (automated on each checkpoint)
- [x] Guide user to publish to permanent production URL

## Industry Best Practices Embedded in AI Engine
- [x] RACE framework (Reach, Act, Convert, Engage) in marketing plan generator
- [x] TOFU/MOFU/BOFU full-funnel content strategy in content studio
- [x] OKR-based goal setting with SMART KPI definitions in project setup
- [x] SEO E-E-A-T signals and Google helpful content guidelines in SEO audit
- [x] Core Web Vitals tracking recommendations in SEO tools
- [x] LinkedIn SSI (Social Selling Index) scoring guidance in LinkedIn branding
- [x] Paid campaign quality score and ad relevance recommendations
- [x] Multi-touch attribution modelling in revenue tracking
- [x] Customer Lifetime Value (CLV) tracking in leads CRM
- [x] Brand voice consistency guidance in content studio
- [x] A/B testing framework recommendations in campaigns
- [x] Industry conversion benchmarks in dashboard KPI context
- [x] Content calendar with optimal posting times per platform
- [x] Backlink domain authority scoring
- [x] Competitor gap analysis with share-of-voice metrics
- [x] Budget allocation using 70/20/10 rule

## WhatsApp & Extended Social Channels
- [x] Add WhatsApp to socialAccounts platform enum
- [x] WhatsApp campaign module: message templates, broadcast scheduling
- [x] Quora integration settings in social accounts
- [x] Google Ads integration settings in social accounts

## User-Friendly / Zero-Knowledge UX
- [x] Guided onboarding wizard: step-based setup
- [x] Plain-English explanations for every metric and term
- [x] AI assistant available on every page for contextual help
- [x] Smart suggestions: AI proactively recommends next best action

## Client Portal
- [x] DB: clientPortalAccess table (projectId, email, token, permissions)
- [x] Backend: generate client access token, validate client session
- [x] Client portal route /portal/:token — branded, isolated from admin
- [x] Client CRM pipeline view: kanban board, update stage, add notes
- [x] Client lead detail view: full lead info, activity log, next steps
- [x] Client dashboard: their pipeline value, conversion rate, revenue

## AI Lead Scraper (Admin)
- [x] DB: leadScrapeJobs table (projectId, targetProfile JSON, status, results)
- [x] Backend: AI-powered lead discovery from target profile description
- [x] Admin lead scraper UI: define target (industry, location, size, title, keywords)
- [x] Scrape results table: review, approve, import to CRM pipeline
- [x] Bulk import approved leads into leads table
- [x] Scrape job history and re-run capability

## Future Enhancements
- [ ] Email campaign integration
- [ ] Automated social media posting scheduler with real OAuth
- [ ] A/B testing framework UI
- [ ] Google Analytics real-time sync
- [ ] Real-time campaign performance sync via webhooks

## Bug Fixes
- [x] Marketing plan renders raw JSON instead of formatted sections
- [x] Business profile not showing after extraction (data not persisting/loading on return)
- [x] Mouse hover not working on interactive elements
- [x] Page scroll broken - cannot browse top to bottom on pages
- [x] Fix scroll broken on all pages (replace ScrollArea with native overflow-y-auto)
- [x] Fix hover states not working on interactive elements
- [x] Marketing plan: parse JSON and render as beautiful formatted sections (not raw JSON)
- [x] Business profile: auto-save after URL extraction, persist on navigation
- [x] All pages: state must persist when switching menus (no blank resets)
- [x] Keywords: auto-load business profile context for AI recommendations
- [x] Add currency selector (INR/USD/EUR/GBP/AED/SGD etc.) to Business Profile
- [x] Use configured currency symbol everywhere: dashboard, campaigns, leads, marketing plan, ROI
- [x] Fix currency not reflecting in Marketing Plan and all other pages after change in Business Profile
- [x] Fix currency not reflecting in Marketing Plan and all other pages after change in Business Profile
- [x] Fix Business Profile form resetting when navigating to other menu and coming back

## New Features (Round 2)
- [x] API Keys settings page: Google Analytics, SendGrid/email campaign keys stored securely in Integrations
- [x] Export Marketing Plan as PDF (beautifully formatted, downloadable)
- [x] Customer-facing CRM pipeline (client portal: full kanban board, lead stage updates, notes, conversion tracking)
- [x] CRM kanban: add search bar + filter by lead value, stage, source
- [ ] Marketing Plan PDF: company logo upload in Business Profile, embedded in PDF header (logo upload UI exists in BusinessProfile, S3 wiring pending)

## New Features (Round 3)
- [x] Demo login page (/login) with email/password form and Admin Demo / Client Demo quick-fill buttons
- [x] Local auth backend: auth.localLogin mutation with SHA-256 password hashing + JWT session cookie
- [x] Demo users in DB: admin@nexusai.demo / admin123 (admin), client@nexusai.demo / client123 (user)
- [x] Move Integrations from global /integrations to project-scoped /projects/:id/integrations
- [x] Global Settings page (/settings) for platform-level config: AI model, notifications, platform defaults, admin panel
- [x] Update AppLayout unauthenticated fallback to show Demo Login button
- [x] Update Home page with Demo Login button in nav and hero CTA
- [x] Update Dashboard unauthenticated fallback to show Demo Login button
- [x] globalSettings table created in DB for platform-level config

## Stub/Mock Elimination (Everything Real)
- [x] Business profile extraction: real HTTP fetch + multi-page scrape (homepage + about + services + contact) via websiteScraper.ts, accurate AI extraction from actual page content
- [x] Dashboard trend chart: replace mockLeadTrend with real DB-derived monthly aggregation of leads and closed revenue per month
- [x] GlobalSettings: wire AI model, notifications, platform defaults to DB via globalSettings table (load on mount, persist on save)
- [x] Lead Scraper: rename to "AI Lead Prospector", make UI honest (AI-generated prospects, not real scraped data), add clear disclaimer
- [x] Social Integrations: validate credentials with real API ping per platform on connect (LinkedIn /v2/userinfo, Meta /me + debug_token, Google tokeninfo, Twitter /users/me, WhatsApp /me, Quora /ads/v0/me)
- [x] Admin Panel: implement real User Management (list all users, change role) and Usage Analytics (AI call count from knowledge table)
- [x] Dashboard metric trend badges computed from real DB data (month-over-month calculation)

## RAG / Knowledge Base — Project-Scoped Storage
- [x] extractFromUrl (business profile): save AI extraction result to knowledge base scoped to projectId (RAG lookup first, save on cache miss)
- [x] All aiWithKnowledge calls: verified all 11 calls pass correct projectId — fully project-scoped
- [x] Knowledge Base UI: per-project page with category-colored badges, search, filter, stats (entries/hits/categories), delete, edit dialog
- [x] Knowledge base lookup: hitCount incremented on RAG hit, cached result returned (verified in db.ts findKnowledge)
- [x] Knowledge base link in project sidebar navigation (already present as /projects/:id/knowledge)
