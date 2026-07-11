import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Brain, Sparkles, Zap, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

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

  const { data: entries, isLoading, refetch } = trpc.knowledge.list.useQuery({ projectId }, { enabled: !!projectId });

  const ask = trpc.knowledge.ask.useMutation({
    onSuccess: (data: any) => {
      setAnswer(typeof data === "string" ? data : data.answer || JSON.stringify(data));
      refetch();
      toast.success("Answer generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

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

          {/* Knowledge history */}
          {isLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}

          {entries && entries.length > 0 && (
            <div className="card-premium overflow-hidden">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <h3 className="font-semibold text-foreground">Knowledge History ({entries.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {entries.map(entry => (
                  <div key={entry.id} className="px-4 py-3">
                    <button className="w-full text-left flex items-start justify-between gap-3"
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{entry.question || entry.topicKey}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs capitalize">{entry.category}</Badge>
                          <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {expandedEntry === entry.id ? <ChevronUp size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />}
                    </button>
                    {expandedEntry === entry.id && entry.content && (
                      <div className="mt-3 pl-0 prose prose-invert max-w-none text-xs leading-relaxed text-muted-foreground">
                        <Streamdown>{`${entry.content.substring(0, 800)}${entry.content.length > 800 ? "..." : ""}`}</Streamdown>
                      </div>
                    )}
                  </div>
                ))}
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
    </AppLayout>
  );
}
