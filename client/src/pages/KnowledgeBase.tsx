import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState, useMemo } from "react";
import { Brain, Sparkles, Zap, BookOpen, ChevronDown, ChevronUp, Trash2, Edit3, CheckCircle2, X, TrendingUp, Filter, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  plan:          { label: "Marketing Plan",     color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  keyword:       { label: "Keywords",           color: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  competitor:    { label: "Competitor Analysis", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  content:       { label: "Content",            color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  lead_strategy: { label: "Lead Strategy",      color: "bg-pink-500/15 text-pink-400 border-pink-500/20" },
  retargeting:   { label: "Retargeting",        color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  seo:           { label: "SEO",                color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  backlinks:     { label: "Backlinks",          color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" },
  whatsapp:      { label: "WhatsApp",           color: "bg-green-500/15 text-green-400 border-green-500/20" },
  qa:            { label: "Q&A",                color: "bg-rose-500/15 text-rose-400 border-rose-500/20" },
  lead_scrape:   { label: "Lead Prospecting",   color: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  profile:       { label: "Business Profile",   color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};
function catInfo(cat: string) {
  return CATEGORY_LABELS[cat] || { label: cat, color: "bg-muted text-muted-foreground border-border" };
}

const SUGGESTED_QUESTIONS = [
  "What is the best SEO strategy for my business?",
  "How should I allocate my marketing budget?",
  "What content should I create for LinkedIn?",
  "How do I improve my Google Ads quality score?",
  "What are the best practices for email marketing?",
  "How do I build a lead generation funnel?",
  "What KPIs should I track for my campaigns?",
  "How can I improve my website conversion rate?",
];

export default function KnowledgeBase() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editEntry, setEditEntry] = useState<{ id: number; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: entries, isLoading, refetch } = trpc.knowledge.list.useQuery({ projectId }, { enabled: !!projectId });

  const ask = trpc.knowledge.ask.useMutation({
    onSuccess: (data: any) => {
      setAnswer(typeof data === "string" ? data : data.answer || JSON.stringify(data));
      refetch();
      toast.success("Answer generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEntry = trpc.knowledge.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Entry deleted — AI will regenerate next time"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateEntry = trpc.knowledge.update.useMutation({
    onSuccess: () => { refetch(); setEditEntry(null); toast.success("Entry updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => {
      const matchCat = filterCategory === "all" || e.category === filterCategory;
      const q = search.toLowerCase();
      const matchSearch = !q || e.topicKey.toLowerCase().includes(q) || (e.question || "").toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [entries, search, filterCategory]);

  const allCategories = useMemo(() => Array.from(new Set((entries || []).map(e => e.category))).sort(), [entries]);
  const totalHits = (entries || []).reduce((s, e) => s + (e.hitCount || 0), 0);

  const handleAsk = (q?: string) => {
    const q2 = q || question;
    if (!q2.trim()) return;
    setQuestion(q2);
    setAnswer("");
    ask.mutate({ projectId, question: q2 });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-16">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <Brain size={24} className="text-primary" />Knowledge Base
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Context-aware AI marketing advisor — learns from your business and improves with every interaction</p>
          </div>

          {/* AI Q&A */}
          <div className="card-premium p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ask Your AI Marketing Advisor</p>
                <p className="text-xs text-muted-foreground">Powered by industry best practices + your business context</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Ask anything about marketing, strategy, campaigns..." value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                className="bg-muted border-border flex-1" />
              <Button onClick={() => handleAsk()} disabled={!question.trim() || ask.isPending} className="btn-glow gap-2 flex-shrink-0">
                {ask.isPending ? <><Zap size={16} className="animate-spin" />Thinking...</> : <><Brain size={16} />Ask</>}
              </Button>
            </div>

            {/* Suggested questions */}
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} onClick={() => handleAsk(q)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current answer */}
          {(answer || ask.isPending) && (
            <div className="card-premium p-5 animate-fade-in-up border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">AI Response</p>
              </div>
              {ask.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <Streamdown>{answer}</Streamdown>
                </div>
              )}
            </div>
          )}

          {/* RAG stats */}
          {entries && entries.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card-premium p-3 text-center">
                <p className="text-xl font-bold text-violet-400">{entries.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Stored Entries</p>
              </div>
              <div className="card-premium p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">{totalHits}</p>
                <p className="text-xs text-muted-foreground mt-0.5">AI Calls Saved</p>
              </div>
              <div className="card-premium p-3 text-center">
                <p className="text-xl font-bold text-sky-400">{allCategories.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Categories</p>
              </div>
            </div>
          )}

          {/* RAG explanation */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
            <Zap size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Project-scoped RAG:</strong> Every AI output for this project is stored here. Future requests matching the same topic return the cached answer instantly — no AI call needed. Delete an entry to force a fresh AI generation. Edit to refine the cached answer.
            </p>
          </div>

          {/* Knowledge history */}
          {isLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}

          {entries && entries.length > 0 && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <BookOpen size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground">Knowledge Entries ({filteredEntries.length}/{entries.length})</h3>
                <div className="ml-auto flex gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-xs w-40 bg-muted border-border" />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-7 text-xs w-36">
                      <Filter size={11} className="mr-1 text-muted-foreground" />
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{catInfo(cat).label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => refetch()}>
                    <RefreshCw size={11} />Refresh
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="px-4 py-3">
                    <button className="w-full text-left flex items-start justify-between gap-3"
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs", catInfo(entry.category).color)}>{catInfo(entry.category).label}</Badge>
                          {(entry.hitCount || 0) > 0 && (
                            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 bg-emerald-500/10 gap-1">
                              <TrendingUp size={9} />{entry.hitCount} hit{entry.hitCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground ml-auto">{new Date(entry.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1 truncate">{entry.question || entry.topicKey}</p>
                      </div>
                      {expandedEntry === entry.id ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 mt-1" />}
                    </button>
                    {expandedEntry === entry.id && (
                      <>
                        {entry.content && (
                          <div className="mt-3 prose prose-invert max-w-none text-xs leading-relaxed text-muted-foreground">
                            <Streamdown>{`${entry.content.substring(0, 800)}${entry.content.length > 800 ? "..." : ""}`}</Streamdown>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-border">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                            onClick={e => { e.stopPropagation(); setEditEntry({ id: entry.id, content: entry.content }); setEditContent(entry.content); }}>
                            <Edit3 size={11} />Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={e => { e.stopPropagation(); deleteEntry.mutate({ id: entry.id }); }}
                            disabled={deleteEntry.isPending}>
                            <Trash2 size={11} />Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {filteredEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No entries match your filter</p>
                )}
              </div>
            </div>
          )}

          {!isLoading && (!entries || entries.length === 0) && !answer && (
            <div className="card-premium p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
                <Brain size={22} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Your AI Marketing Brain</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">Ask any marketing question above. The AI learns from your business context and builds a knowledge base that improves over time — acting as your always-on marketing expert.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      {editEntry && (
        <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 size={16} className="text-primary" />Edit Knowledge Entry
              </DialogTitle>
              <p className="text-xs text-muted-foreground">Changes take effect immediately — this cached answer will be returned for future matching requests in this project.</p>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-56 bg-muted border-border font-mono text-xs resize-none"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditEntry(null)} className="flex-1 gap-1.5">
                <X size={14} />Cancel
              </Button>
              <Button className="flex-1 gap-1.5 btn-glow" disabled={updateEntry.isPending}
                onClick={() => updateEntry.mutate({ id: editEntry.id, content: editContent })}>
                <CheckCircle2 size={14} />{updateEntry.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
