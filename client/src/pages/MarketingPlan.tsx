import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Target, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

export default function MarketingPlan() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ objective: "Generate more leads", budget: "2000", timeframe: "6 months", targetAudience: "", currentChannels: "" });

  const { data: plans, isLoading, refetch } = trpc.marketingPlans.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });

  const generatePlan = trpc.marketingPlans.generate.useMutation({
    onSuccess: () => { toast.success("Marketing plan generated!"); refetch(); setShowForm(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const latestPlan = plans?.[0];

  // Pre-fill from project
  useEffect(() => {
    if (project) {
      setForm(f => ({
        ...f,
        objective: project.goal || f.objective,
        budget: project.monthlyBudget || f.budget,
      }));
    }
  }, [project]);

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">AI Marketing Plan</h1>
              <p className="text-muted-foreground text-sm mt-1">SEO-first strategy with full channel breakdown and budget allocation</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="btn-glow gap-2">
              <Sparkles size={16} />{latestPlan ? "Regenerate Plan" : "Generate Plan"}
            </Button>
          </div>

          {!latestPlan && !isLoading && (
            <div className="card-premium p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl">No Marketing Plan Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Primary Channel", value: "SEO", sub: "Highest long-term ROI", icon: <Target size={18} />, color: "bg-violet-500/15 text-violet-400" },
                  { label: "Monthly Budget", value: latestPlan.totalBudget ? `$${latestPlan.totalBudget}` : "Not set", sub: "Optimally allocated", icon: <DollarSign size={18} />, color: "bg-emerald-500/15 text-emerald-400" },
                  { label: "Expected Leads", value: "15–30/mo", sub: "Based on industry avg", icon: <TrendingUp size={18} />, color: "bg-sky-500/15 text-sky-400" },
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

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Full Marketing Strategy</h3>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Generated {new Date(latestPlan.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <Streamdown>{latestPlan.planJson || "No content available"}</Streamdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

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
              <label className="text-sm font-medium text-foreground mb-1.5 block">Monthly Budget (USD)</label>
              <Input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 2000" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Timeframe</label>
              <Input value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} placeholder="e.g. 6 months" className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Target Audience (optional)</label>
              <Textarea value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="Who are your ideal customers?" className="bg-muted border-border" rows={2} />
            </div>
            <Button className="w-full btn-glow gap-2" onClick={() => generatePlan.mutate({ projectId, ...form, industry: project?.industry || undefined })} disabled={generatePlan.isPending}>
              {generatePlan.isPending ? <><Zap size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Generate Plan</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
