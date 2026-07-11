import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Search, TrendingUp, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

export default function Keywords() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [seedKeywords, setSeedKeywords] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string>("");

  const { data: keywords, isLoading, refetch } = trpc.keywords.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: project } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });

  const analyze = trpc.keywords.analyze.useMutation({
    onSuccess: (data: any) => {
      setAnalysisResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      refetch();
      toast.success("Keyword analysis complete!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteKeyword = trpc.keywords.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Keyword removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  const getDifficultyColor = (difficulty: number | null) => {
    const d = difficulty || 0;
    if (d < 30) return "text-emerald-400 bg-emerald-500/10";
    if (d < 60) return "text-amber-400 bg-amber-500/10";
    return "text-rose-400 bg-rose-500/10";
  };

  const getDifficultyLabel = (difficulty: number | null) => {
    const d = difficulty || 0;
    if (d < 30) return "Easy";
    if (d < 60) return "Medium";
    return "Hard";
  };

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Keyword Analysis</h1>
              <p className="text-muted-foreground text-sm mt-1">AI-powered keyword research with difficulty scoring and SEO opportunities</p>
            </div>
          </div>

          {/* Analyze form */}
          <div className="card-premium p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />AI Keyword Research
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Enter seed keywords and AI will generate a comprehensive keyword strategy with search volumes, difficulty scores, and content opportunities.</p>
            <div className="flex gap-3">
              <Input placeholder="e.g. digital marketing, SEO tools, content strategy"
                value={seedKeywords} onChange={e => setSeedKeywords(e.target.value)}
                className="bg-muted border-border flex-1" />
              <Button onClick={() => analyze.mutate({ projectId, seedKeywords, industry: project?.industry || undefined })}
                disabled={!seedKeywords || analyze.isPending} className="btn-glow gap-2 flex-shrink-0">
                {analyze.isPending ? <><Zap size={16} className="animate-spin" />Analysing...</> : <><Search size={16} />Analyse</>}
              </Button>
            </div>
          </div>

          {/* Analysis result */}
          {analysisResult && (
            <div className="card-premium p-5 animate-fade-in-up">
              <h3 className="font-semibold text-foreground mb-4">Analysis Results</h3>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <Streamdown>{analysisResult}</Streamdown>
              </div>
            </div>
          )}

          {/* Saved keywords */}
          {isLoading && <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>}

          {keywords && keywords.length > 0 && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Tracked Keywords ({keywords.length})</h3>
                <Badge variant="outline" className="text-xs">SEO-first strategy</Badge>
              </div>
              <div className="divide-y divide-border">
                {keywords.map(kw => (
                  <div key={kw.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                      {kw.intent && <p className="text-xs text-muted-foreground mt-0.5 capitalize">{kw.intent} intent</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {kw.searchVolume && (
                        <div className="text-center">
                          <p className="text-xs font-semibold text-foreground">{Number(kw.searchVolume).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">volume</p>
                        </div>
                      )}
                      {kw.difficulty && (
                        <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getDifficultyColor(kw.difficulty))}>
                          {getDifficultyLabel(kw.difficulty)} ({kw.difficulty})
                        </div>
                      )}
                      {kw.cpc && (
                        <div className="text-center">
                          <p className="text-xs font-semibold text-emerald-400">${kw.cpc}</p>
                          <p className="text-xs text-muted-foreground">CPC</p>
                        </div>
                      )}
                      <button onClick={() => deleteKeyword.mutate({ id: Number(kw.id) })}
                        className="text-muted-foreground hover:text-rose-400 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && (!keywords || keywords.length === 0) && !analysisResult && (
            <div className="card-premium p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
                <Target size={22} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">No Keywords Yet</h3>
              <p className="text-muted-foreground text-sm">Enter seed keywords above to generate a comprehensive keyword strategy</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
