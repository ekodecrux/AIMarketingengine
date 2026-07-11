import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Trash2, BarChart3 } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Competitors() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [form, setForm] = useState({ businessDescription: "", industry: "", websiteUrl: "" });
  const [analysisResult, setAnalysisResult] = useState<string>("");

  const { data: competitors, isLoading, refetch } = trpc.competitors.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });

  useEffect(() => {
    if (project) setForm(f => ({ ...f, industry: project.industry || f.industry, businessDescription: project.description || f.businessDescription, websiteUrl: project.websiteUrl || f.websiteUrl }));
  }, [project]);

  const analyze = trpc.competitors.analyze.useMutation({
    onSuccess: (data: any) => {
      setAnalysisResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      refetch();
      toast.success("Competitor analysis complete!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCompetitor = trpc.competitors.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Competitor removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-16">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Competitor Analysis</h1>
            <p className="text-muted-foreground text-sm mt-1">AI-powered competitive landscape analysis and positioning strategy</p>
          </div>

          <div className="card-premium p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />Run Competitor Analysis
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Business Description</label>
                <Textarea placeholder="Describe your business and what you do..." value={form.businessDescription}
                  onChange={e => setForm(f => ({ ...f, businessDescription: e.target.value }))}
                  className="bg-muted border-border" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Industry</label>
                  <Input placeholder="e.g. SaaS, Retail" value={form.industry}
                    onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Website (optional)</label>
                  <Input placeholder="https://yoursite.com" value={form.websiteUrl}
                    onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} className="bg-muted border-border" />
                </div>
              </div>
              <Button onClick={() => analyze.mutate({ projectId, ...form })} disabled={!form.businessDescription || analyze.isPending} className="btn-glow gap-2">
                {analyze.isPending ? <><Zap size={16} className="animate-spin" />Analysing...</> : <><BarChart3 size={16} />Analyse Competitors</>}
              </Button>
            </div>
          </div>

          {analysisResult && (
            <div className="card-premium p-5 animate-fade-in-up">
              <h3 className="font-semibold text-foreground mb-4">Competitive Landscape Analysis</h3>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <Streamdown>{analysisResult}</Streamdown>
              </div>
            </div>
          )}

          {isLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>}

          {competitors && competitors.length > 0 && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Tracked Competitors ({competitors.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {competitors.map(comp => (
                  <div key={comp.id} className="flex items-start gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{comp.name}</p>
                        {comp.websiteUrl && (
                          <a href={comp.websiteUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline">{comp.websiteUrl}</a>
                        )}
                      </div>
                      {comp.strengths && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{comp.strengths}</p>}
                    </div>
                    <button onClick={() => deleteCompetitor.mutate({ id: comp.id })}
                      className="text-muted-foreground hover:text-rose-400 transition-colors p-1 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
