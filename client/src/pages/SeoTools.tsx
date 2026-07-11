import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Zap, Link2, Search, TrendingUp, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

export default function SeoTools() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [auditForm, setAuditForm] = useState({ pageUrl: "", targetKeyword: "", pageContent: "" });
  const [auditResult, setAuditResult] = useState<string>("");
  const [backlinkForm, setBacklinkForm] = useState({ sourceUrl: "", targetUrl: "", anchorText: "", domainAuthority: "" });

  const { data: audits, isLoading: auditsLoading, refetch: refetchAudits } = trpc.seo.audits.useQuery({ projectId }, { enabled: !!projectId });
  const { data: backlinks, isLoading: backlinksLoading, refetch: refetchBacklinks } = trpc.seo.backlinks.useQuery({ projectId }, { enabled: !!projectId });

  const runAudit = trpc.seo.runAudit.useMutation({
    onSuccess: (data: any) => {
      setAuditResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      refetchAudits();
      toast.success("SEO audit complete!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addBacklink = trpc.seo.addBacklink.useMutation({
    onSuccess: () => { refetchBacklinks(); setBacklinkForm({ sourceUrl: "", targetUrl: "", anchorText: "", domainAuthority: "" }); toast.success("Backlink added!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">SEO Tools</h1>
            <p className="text-muted-foreground text-sm mt-1">On-page SEO audits, backlink tracking, and E-E-A-T optimisation — your primary growth channel</p>
          </div>

          <Tabs defaultValue="audit">
            <TabsList className="bg-muted">
              <TabsTrigger value="audit">Page Audits</TabsTrigger>
              <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
            </TabsList>

            <TabsContent value="audit" className="mt-4 space-y-4">
              <div className="card-premium p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Search size={16} className="text-primary" />Run SEO Audit
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Page URL *</label>
                      <Input placeholder="https://yoursite.com/blog/post" value={auditForm.pageUrl}
                        onChange={e => setAuditForm(f => ({ ...f, pageUrl: e.target.value }))} className="bg-muted border-border" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Keyword</label>
                      <Input placeholder="e.g. digital marketing tips" value={auditForm.targetKeyword}
                        onChange={e => setAuditForm(f => ({ ...f, targetKeyword: e.target.value }))} className="bg-muted border-border" />
                    </div>
                  </div>
                  <Button onClick={() => runAudit.mutate({ projectId, ...auditForm })} disabled={!auditForm.pageUrl || runAudit.isPending} className="btn-glow gap-2">
                    {runAudit.isPending ? <><Zap size={16} className="animate-spin" />Auditing...</> : <><Search size={16} />Run Audit</>}
                  </Button>
                </div>
              </div>

              {auditResult && (
                <div className="card-premium p-5 animate-fade-in-up">
                  <h3 className="font-semibold text-foreground mb-4">Audit Results</h3>
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                    <Streamdown>{auditResult}</Streamdown>
                  </div>
                </div>
              )}

              {auditsLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}

              {audits && audits.length > 0 && (
                <div className="card-premium overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Audit History</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {audits.map(audit => (
                      <div key={audit.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{audit.pageUrl}</p>

                        </div>
                        {audit.score && (
                          <div className="text-center">
                            <p className={cn("text-lg font-bold", getScoreColor(audit.score))}>{audit.score}</p>
                            <p className="text-xs text-muted-foreground">score</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground flex-shrink-0">{new Date(audit.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="backlinks" className="mt-4 space-y-4">
              <div className="card-premium p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Link2 size={16} className="text-primary" />Add Backlink
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Source URL (linking site) *</label>
                      <Input placeholder="https://referringsite.com/article" value={backlinkForm.sourceUrl}
                        onChange={e => setBacklinkForm(f => ({ ...f, sourceUrl: e.target.value }))} className="bg-muted border-border" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Target URL (your page) *</label>
                      <Input placeholder="https://yoursite.com/page" value={backlinkForm.targetUrl}
                        onChange={e => setBacklinkForm(f => ({ ...f, targetUrl: e.target.value }))} className="bg-muted border-border" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Anchor Text</label>
                      <Input placeholder="e.g. digital marketing guide" value={backlinkForm.anchorText}
                        onChange={e => setBacklinkForm(f => ({ ...f, anchorText: e.target.value }))} className="bg-muted border-border" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Domain Authority (0-100)</label>
                      <Input type="number" placeholder="e.g. 45" value={backlinkForm.domainAuthority}
                        onChange={e => setBacklinkForm(f => ({ ...f, domainAuthority: e.target.value }))} className="bg-muted border-border" />
                    </div>
                  </div>
                  <Button                     onClick={() => addBacklink.mutate({ projectId, ...backlinkForm, domainAuthority: backlinkForm.domainAuthority ? Number(backlinkForm.domainAuthority) : undefined })}
                    disabled={!backlinkForm.sourceUrl || !backlinkForm.targetUrl || addBacklink.isPending} className="btn-glow gap-2">
                    {addBacklink.isPending ? <><Zap size={16} className="animate-spin" />Adding...</> : <><Plus size={16} />Add Backlink</>}
                  </Button>
                </div>
              </div>

              {backlinksLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>}

              {backlinks && backlinks.length > 0 && (
                <div className="card-premium overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Tracked Backlinks ({backlinks.length})</h3>
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20">
                      {backlinks.filter(b => b.status === "active").length} active
                    </Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {backlinks.map(bl => (
                      <div key={bl.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <a href={bl.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline truncate block">{bl.sourceUrl}</a>
                          {bl.anchorText && <p className="text-xs text-muted-foreground">Anchor: "{bl.anchorText}"</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {bl.domainAuthority && (
                            <div className="text-center">
                              <p className={cn("text-sm font-bold", Number(bl.domainAuthority) >= 50 ? "text-emerald-400" : "text-amber-400")}>{bl.domainAuthority}</p>
                              <p className="text-xs text-muted-foreground">DA</p>
                            </div>
                          )}
                          {bl.status === "active" ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-amber-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!backlinksLoading && (!backlinks || backlinks.length === 0) && (
                <div className="card-premium p-10 text-center space-y-3">
                  <Link2 size={24} className="text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">No backlinks tracked yet. Add your first backlink above.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
