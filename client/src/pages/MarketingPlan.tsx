import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import {
  Sparkles, Zap, Target, DollarSign, TrendingUp, Calendar,
  CheckCircle2, AlertTriangle, Lightbulb, BarChart3, Search,
  MessageSquare, Globe, Users, ArrowRight, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePlan(raw: string | null | undefined): Record<string, any> | null {
  if (!raw) return null;
  // Strip all markdown code fences and leading/trailing whitespace
  let clean = raw.trim();
  // Remove ```json ... ``` or ``` ... ``` wrappers
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // If it starts with { or [ it's JSON - try parse directly
  if (clean.startsWith("{") || clean.startsWith("[")) {
    try { return JSON.parse(clean); } catch {}
  }
  // Try to extract JSON object from within the string
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  return null;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  seo: <Search size={14} />,
  "google ads": <Globe size={14} />,
  "facebook": <Users size={14} />,
  "instagram": <Users size={14} />,
  "linkedin": <Users size={14} />,
  "whatsapp": <MessageSquare size={14} />,
  "content": <BarChart3 size={14} />,
};

function channelIcon(name: string) {
  const key = name.toLowerCase();
  for (const k of Object.keys(CHANNEL_ICONS)) {
    if (key.includes(k)) return CHANNEL_ICONS[k];
  }
  return <Target size={14} />;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accent = "primary" }: { title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string }) {
  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-${accent}/15 flex items-center justify-center text-${accent}`}>{icon}</div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ChannelCard({ ch, symbol }: { ch: any; symbol: string }) {
  const pct = Number(ch.budget_percent || ch.budgetPercent || 0);
  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center text-primary">
            {channelIcon(ch.channel || "")}
          </div>
          <span className="font-medium text-sm text-foreground">{ch.channel}</span>
          {ch.channel?.toLowerCase().includes("seo") && (
            <Badge className="text-[10px] bg-violet-500/15 text-violet-400 border-violet-500/20 px-1.5 py-0">Primary</Badge>
          )}
        </div>
        <span className="text-xs font-semibold text-primary">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{symbol}{ch.monthly_budget || ch.monthlyBudget || "—"}/mo</span>
        <span className="text-emerald-400">{ch.expectedROI || ch.expected_roi || "—"} ROI</span>
      </div>
      {ch.tactics && (
        <p className="text-xs text-muted-foreground leading-relaxed">{
          Array.isArray(ch.tactics) ? ch.tactics.slice(0, 2).join(" · ") : ch.tactics
        }</p>
      )}
    </div>
  );
}

// ─── Smart Fallback Renderer ─────────────────────────────────────────────────
// Handles cases where parsePlan() still fails (e.g. truncated JSON from DB)
// Tries multiple strategies to extract and display plan content beautifully
function SmartPlanFallback({ raw, symbol }: { raw: string | null | undefined; symbol: string }) {
  if (!raw) return null;

  // Strategy 1: Try to extract any key-value pairs from the raw string
  // and render them as readable sections
  const sections: { title: string; content: string }[] = [];

  // Extract executiveSummary
  const summaryMatch = raw.match(/"executiveSummary"\s*:\s*"([^"]+)"/);
  if (summaryMatch) sections.push({ title: "Executive Summary", content: summaryMatch[1] });

  // Extract channels array items
  const channelMatches = Array.from(raw.matchAll(/"channel"\s*:\s*"([^"]+)"/g));
  const budgetMatches = Array.from(raw.matchAll(/"budget_percent"\s*:\s*(\d+)/g));
  const monthlyMatches = Array.from(raw.matchAll(/"monthly_budget"\s*:\s*"?([\d,]+)"?/g));

  // Extract quick wins
  const quickWinsMatch = raw.match(/"quickWins"\s*:\s*\[([^\]]+)\]/);
  if (quickWinsMatch) {
    const wins = Array.from(quickWinsMatch[1].matchAll(/"([^"]+)"/g)).map((m: RegExpExecArray) => m[1]);
    if (wins.length) sections.push({ title: "Quick Wins", content: wins.join("\n") });
  }

  return (
    <div className="space-y-5">
      {sections.map((s, i) => (
        <div key={i} className="card-premium p-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">{s.title}</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
        </div>
      ))}

      {channelMatches.length > 0 && (
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400"><BarChart3 size={16} /></div>
            <h3 className="font-semibold text-foreground">Channel Budget Allocation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {channelMatches.map((m, i) => {
              const pct = Number(budgetMatches[i]?.[1] || 0);
              const monthly = monthlyMatches[i]?.[1] || "—";
              return (
                <div key={i} className="bg-muted/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center text-primary">{channelIcon(m[1])}</div>
                      <span className="font-medium text-sm text-foreground">{m[1]}</span>
                      {m[1].toLowerCase().includes("seo") && <Badge className="text-[10px] bg-violet-500/15 text-violet-400 border-violet-500/20 px-1.5 py-0">Primary</Badge>}
                    </div>
                    <span className="text-xs font-semibold text-primary">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5 mb-2" />
                  <p className="text-xs text-muted-foreground">{symbol}{monthly}/mo</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sections.length === 0 && channelMatches.length === 0 && (
        <div className="card-premium p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Plan data is being processed. Please regenerate your plan to see the full formatted view.</p>
          <Badge variant="outline">Plan stored — click Regenerate Plan to refresh</Badge>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketingPlan() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId, currencySymbol } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ objective: "Generate more leads", budget: "2000", timeframe: "6 months", targetAudience: "", currentChannels: "" });

  const { data: plans, isLoading, refetch } = trpc.marketingPlans.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });
  const { data: biz } = trpc.businessProfile.get.useQuery({ projectId }, { enabled: !!projectId });

  const generatePlan = trpc.marketingPlans.generate.useMutation({
    onSuccess: () => { toast.success("Marketing plan generated!"); refetch(); setShowForm(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const latestPlan = plans?.[0];
  const parsed = parsePlan(latestPlan?.planJson);

  // Pre-fill from project + business profile
  useEffect(() => {
    if (project) setForm(f => ({ ...f, objective: project.goal || f.objective, budget: project.monthlyBudget || f.budget }));
  }, [project]);
  useEffect(() => {
    if (biz) setForm(f => ({ ...f, targetAudience: f.targetAudience || biz.targetAudience || "" }));
  }, [biz]);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-16">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">AI Marketing Plan</h1>
              <p className="text-muted-foreground text-sm mt-1">SEO-first strategy with full channel breakdown and budget allocation</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="btn-glow gap-2">
              <Sparkles size={16} />{latestPlan ? "Regenerate Plan" : "Generate Plan"}
            </Button>
          </div>

          {/* Empty state */}
          {!latestPlan && !isLoading && (
            <div className="card-premium p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl">No Marketing Plan Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Our AI will create a comprehensive, SEO-first marketing strategy tailored to your business goals and budget — in seconds.
              </p>
              <Button onClick={() => setShowForm(true)} className="btn-glow gap-2">
                <Sparkles size={16} />Generate My Marketing Plan
              </Button>
            </div>
          )}

          {isLoading && <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}

          {latestPlan && (
            <div className="space-y-6 animate-fade-in-up">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Primary Channel", value: "SEO", sub: "Highest long-term ROI", icon: <Target size={18} />, color: "bg-violet-500/15 text-violet-400" },
                  { label: "Monthly Budget", value: latestPlan.totalBudget ? `${currencySymbol}${latestPlan.totalBudget}` : "Not set", sub: "Optimally allocated", icon: <DollarSign size={18} />, color: "bg-emerald-500/15 text-emerald-400" },
                  { label: "Expected Leads", value: parsed?.kpis?.[0]?.target || "15–30/mo", sub: "Based on industry avg", icon: <TrendingUp size={18} />, color: "bg-sky-500/15 text-sky-400" },
                  { label: "Timeframe", value: latestPlan.timeframe || "6 months", sub: "To see results", icon: <Calendar size={18} />, color: "bg-amber-500/15 text-amber-400" },
                ].map(card => (
                  <div key={card.label} className="metric-card">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", card.color)}>{card.icon}</div>
                    <p className="text-lg font-bold text-foreground">{card.value}</p>
                    <p className="text-sm font-medium text-foreground">{card.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {parsed ? (
                <>
                  {/* Executive Summary */}
                  {parsed.executiveSummary && (
                    <div className="card-premium p-5 border-l-4 border-primary">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Executive Summary</p>
                      <p className="text-sm text-foreground leading-relaxed">{parsed.executiveSummary}</p>
                    </div>
                  )}

                  {/* Goals / OKRs */}
                  {parsed.goals?.length > 0 && (
                    <SectionCard title="Goals & OKRs" icon={<Target size={16} />}>
                      <div className="space-y-3">
                        {parsed.goals.map((g: any, i: number) => (
                          <div key={i} className="bg-muted/50 rounded-xl p-4 border border-border/50">
                            <p className="text-sm font-medium text-foreground mb-2">{g.objective}</p>
                            {g.keyResults?.map((kr: any, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
                                <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span>{kr.kr || kr} — <span className="text-foreground">{kr.target}</span> by {kr.timeframe}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Channel Budget Breakdown */}
                  {parsed.channels?.length > 0 && (
                    <SectionCard title="Channel Strategy & Budget Allocation" icon={<BarChart3 size={16} />} accent="emerald-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {parsed.channels.map((ch: any, i: number) => (
                          <ChannelCard key={i} ch={ch} symbol={currencySymbol} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* SEO Strategy */}
                  {parsed.seoStrategy && (
                    <SectionCard title="SEO Strategy" icon={<Search size={16} />} accent="violet-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsed.seoStrategy.primaryKeywords?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Primary Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                              {parsed.seoStrategy.primaryKeywords.slice(0, 8).map((kw: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {parsed.seoStrategy.expectedTimeToRank && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Expected Time to Rank</p>
                            <p className="text-sm text-foreground">{parsed.seoStrategy.expectedTimeToRank}</p>
                          </div>
                        )}
                        {parsed.seoStrategy.technicalSeo && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Technical SEO Actions</p>
                            <p className="text-sm text-foreground leading-relaxed">{
                              Array.isArray(parsed.seoStrategy.technicalSeo)
                                ? parsed.seoStrategy.technicalSeo.join(" · ")
                                : parsed.seoStrategy.technicalSeo
                            }</p>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  )}

                  {/* Quick Wins */}
                  {parsed.quickWins?.length > 0 && (
                    <SectionCard title="Quick Wins — Results in 30 Days" icon={<Zap size={16} />} accent="amber-500">
                      <div className="space-y-2">
                        {parsed.quickWins.map((win: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{win}</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Milestones */}
                  {parsed.milestones?.length > 0 && (
                    <SectionCard title="Execution Milestones" icon={<Clock size={16} />} accent="sky-500">
                      <div className="space-y-3">
                        {parsed.milestones.map((m: any, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-14 flex-shrink-0 text-center">
                              <span className="text-xs font-semibold text-primary bg-primary/15 px-2 py-1 rounded-md">{m.week || `M${i+1}`}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{m.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{m.expectedOutcome}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* KPIs */}
                  {parsed.kpis?.length > 0 && (
                    <SectionCard title="Key Performance Indicators" icon={<TrendingUp size={16} />} accent="emerald-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {parsed.kpis.map((kpi: any, i: number) => (
                          <div key={i} className="bg-muted/50 rounded-xl p-3 border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{kpi.metric}</span>
                              <span className="text-xs font-semibold text-primary">{kpi.target}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{kpi.plainEnglishExplanation || kpi.measurement}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Budget Breakdown */}
                  {parsed.budgetBreakdown && (
                    <SectionCard title="Budget Breakdown" icon={<DollarSign size={16} />} accent="emerald-500">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(parsed.budgetBreakdown).map(([key, val]: [string, any]) => (
                          <div key={key} className="bg-muted/50 rounded-xl p-3 border border-border/50 text-center">
                            <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                            <p className="text-sm font-bold text-foreground">{currencySymbol}{val}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Warning Signals */}
                  {parsed.warningSignals?.length > 0 && (
                    <SectionCard title="Warning Signals to Watch" icon={<AlertTriangle size={16} />} accent="amber-500">
                      <div className="space-y-2">
                        {parsed.warningSignals.map((w: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{w}</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* WhatsApp Strategy */}
                  {parsed.whatsappStrategy && (
                    <SectionCard title="WhatsApp Marketing Strategy" icon={<MessageSquare size={16} />} accent="emerald-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {parsed.whatsappStrategy.audienceSegments && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Audience Segments</p><p className="text-foreground">{parsed.whatsappStrategy.audienceSegments}</p></div>}
                        {parsed.whatsappStrategy.broadcastFrequency && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Broadcast Frequency</p><p className="text-foreground">{parsed.whatsappStrategy.broadcastFrequency}</p></div>}
                        {parsed.whatsappStrategy.expectedOpenRate && <div><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Expected Open Rate</p><p className="text-foreground text-emerald-400 font-semibold">{parsed.whatsappStrategy.expectedOpenRate}</p></div>}
                        {parsed.whatsappStrategy.messageTemplates?.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sample Message Templates</p>
                            <div className="space-y-2">
                              {parsed.whatsappStrategy.messageTemplates.slice(0, 2).map((t: string, i: number) => (
                                <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-xs text-foreground">{t}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1"><Lightbulb size={12} />Generated by Nexus AI using RACE framework + 70/20/10 budget rule</span>
                    <Badge variant="outline" className="text-xs">{new Date(latestPlan.createdAt).toLocaleDateString()}</Badge>
                  </div>
                </>
              ) : (
                /* Smart fallback: try to render any JSON structure gracefully */
                <SmartPlanFallback raw={latestPlan.planJson} symbol={currencySymbol} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Generate AI Marketing Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Primary Goal</label>
              <Input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="e.g. Generate more leads" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Monthly Budget ({currencySymbol})</label>
              <Input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 50000" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Timeframe</label>
              <Input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 6 months" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Target Audience (optional)</label>
              <Textarea value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="Who are your ideal customers?" className="bg-muted border-border" rows={2} />
            </div>
            {biz?.companyName && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
                <span className="text-primary font-medium">Using business profile:</span> {biz.companyName} · {biz.industry}
              </div>
            )}
            <Button className="w-full btn-glow gap-2" onClick={() => generatePlan.mutate({ projectId, ...form, industry: project?.industry || biz?.industry || undefined })} disabled={generatePlan.isPending}>
              {generatePlan.isPending ? <><Zap size={16} className="animate-spin" />Generating Plan...</> : <><Sparkles size={16} />Generate Plan</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
