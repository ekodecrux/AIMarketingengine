import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { INDUSTRIES, MARKETING_GOALS } from "../../../shared/types";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = ["#7c3aed","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#06b6d4","#84cc16","#f97316"];
const STEPS = [
  { id: 1, label: "Project Info" },
  { id: 2, label: "Business Details" },
  { id: 3, label: "Goals & Budget" },
];

export default function ProjectSetup() {
  const [, navigate] = useLocation();
  const { setActiveProjectId } = useProject();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", color: PROJECT_COLORS[0], industry: "", websiteUrl: "",
    description: "", targetAudience: "", goals: [] as string[],
    monthlyBudget: "", location: "",
  });
  const [extracting, setExtracting] = useState(false);

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      setActiveProjectId(project.id);
      toast.success("Project created! Generating your AI marketing plan...");
      navigate(`/projects/${project.id}/plan`);
    },
    onError: (e) => toast.error(e.message),
  });

  const extractProfile = trpc.businessProfile.extractFromUrl.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, description: data.description || f.description, targetAudience: data.targetAudience || f.targetAudience, industry: data.industry || f.industry }));
      toast.success("Business profile extracted from your website!");
      setExtracting(false);
    },
    onError: () => { toast.error("Could not extract — please fill in manually"); setExtracting(false); },
  });

  const toggleGoal = (goal: string) => setForm(f => ({
    ...f, goals: f.goals.includes(goal) ? f.goals.filter(g => g !== goal) : [...f.goals, goal],
  }));

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Create New Project</h1>
            <p className="text-muted-foreground text-sm mt-1">Set up a new client or business workspace in minutes</p>
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {step > s.id ? <CheckCircle2 size={14} /> : <span className="w-4 text-center">{s.id}</span>}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className={cn("h-px w-8", step > s.id ? "bg-primary/50" : "bg-border")} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="card-premium p-6 space-y-5 animate-fade-in-up">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Project Name *</label>
                <Input placeholder="e.g. Acme Corp, My Bakery, Tech Startup" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Project Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={cn("w-8 h-8 rounded-full transition-all", form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110" : "hover:scale-105")}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(ind => (
                    <button key={ind} onClick={() => setForm(f => ({ ...f, industry: ind }))}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        form.industry === ind ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full btn-glow gap-2" onClick={() => setStep(2)} disabled={!form.name.trim()}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="card-premium p-6 space-y-5 animate-fade-in-up">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">AI Auto-Fill from Website</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Enter your website URL and AI will extract your business profile automatically.</p>
                <div className="flex gap-2">
                  <Input placeholder="https://yourwebsite.com" value={form.websiteUrl}
                    onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} className="bg-background border-border flex-1" />
                  <Button size="sm" onClick={() => { setExtracting(true); extractProfile.mutate({ url: form.websiteUrl, projectId: 0 }); }}
                    disabled={!form.websiteUrl || extracting} className="gap-2 flex-shrink-0">
                    {extracting ? <><Zap size={14} className="animate-spin" />Extracting...</> : <><Zap size={14} />Extract</>}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">What does your business do?</label>
                <Textarea placeholder="Describe your products/services in plain English..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-muted border-border" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Who are your ideal customers?</label>
                <Textarea placeholder="e.g. Small business owners aged 30-50 who want to grow online..."
                  value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                  className="bg-muted border-border" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Business Location / Market</label>
                <Input placeholder="e.g. New York, USA or Global" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button className="flex-1 btn-glow gap-2" onClick={() => setStep(3)}>Continue <ArrowRight size={16} /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card-premium p-6 space-y-5 animate-fade-in-up">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">What are your marketing goals?</label>
                <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {MARKETING_GOALS.map(goal => (
                    <button key={goal} onClick={() => toggleGoal(goal)}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        form.goals.includes(goal) ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted border-border text-muted-foreground hover:border-primary/30 hover:text-foreground")}>
                      {form.goals.includes(goal) && <CheckCircle2 size={12} className="inline mr-1" />}
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Monthly Marketing Budget (USD)</label>
                <Input type="number" placeholder="e.g. 2000" value={form.monthlyBudget}
                  onChange={e => setForm(f => ({ ...f, monthlyBudget: e.target.value }))} className="bg-muted border-border" />
                <p className="text-xs text-muted-foreground mt-1.5">The AI will suggest the optimal budget allocation for you</p>
              </div>
              {form.monthlyBudget && Number(form.monthlyBudget) > 0 && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Budget Preview</p>
                  {[
                    { label: "SEO & Content", pct: 30, color: "bg-violet-500" },
                    { label: "Google Ads", pct: 25, color: "bg-sky-500" },
                    { label: "Social Media Ads", pct: 25, color: "bg-pink-500" },
                    { label: "LinkedIn", pct: 12, color: "bg-blue-600" },
                    { label: "WhatsApp", pct: 8, color: "bg-emerald-500" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{item.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">
                        ${Math.round(Number(form.monthlyBudget) * item.pct / 100).toLocaleString()} ({item.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button className="flex-1 btn-glow gap-2" onClick={() => createProject.mutate({
                  name: form.name, color: form.color, industry: form.industry, websiteUrl: form.websiteUrl,
                  description: form.description, goals: form.goals, targetAudience: form.targetAudience,
                  monthlyBudget: form.monthlyBudget ? form.monthlyBudget : undefined, location: form.location,
                })} disabled={createProject.isPending}>
                  {createProject.isPending ? <><Zap size={16} className="animate-spin" />Creating...</> : <><Sparkles size={16} />Create & Generate Plan</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
