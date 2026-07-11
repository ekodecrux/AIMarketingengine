import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, FileText, Share2, Linkedin, Plus, Copy, Trash2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

const CONTENT_TYPES = [
  { value: "blog", label: "Blog Post", icon: <FileText size={16} />, desc: "SEO-optimised long-form content" },
  { value: "social", label: "Social Post", icon: <Share2 size={16} />, desc: "Engaging posts for all platforms" },
  { value: "linkedin", label: "LinkedIn Article", icon: <Linkedin size={16} />, desc: "Personal branding & thought leadership" },
];

const TONES = ["Professional", "Friendly", "Authoritative", "Conversational", "Inspirational", "Educational", "Persuasive"];
const PLATFORMS = ["LinkedIn", "Facebook", "Instagram", "Twitter/X", "WhatsApp", "Quora"];

export default function ContentStudio() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [form, setForm] = useState({
    type: "blog" as "blog" | "social" | "linkedin",
    topic: "", tone: "Professional", platform: "LinkedIn",
    targetAudience: "", keywords: "", businessContext: "",
  });
  const [generatedContent, setGeneratedContent] = useState<string>("");
  // content field is 'body' in schema
  const [activeTab, setActiveTab] = useState("all");

  const { data: content, isLoading, refetch } = trpc.content.list.useQuery(
    { projectId, type: activeTab === "all" ? undefined : activeTab },
    { enabled: !!projectId }
  );

  const generate = trpc.content.generate.useMutation({
    onSuccess: (data: any) => {
      setGeneratedContent(typeof data === "string" ? data : data.body || data.content || JSON.stringify(data));
      refetch();
      toast.success("Content generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateContent = trpc.content.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Content updated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteContent = trpc.content.delete.useMutation({
    onSuccess: () => { refetch(); setSelectedContent(null); toast.success("Content deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const getTypeIcon = (type: string) => {
    if (type === "blog") return <FileText size={14} />;
    if (type === "linkedin") return <Linkedin size={14} />;
    return <Share2 size={14} />;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      blog: "bg-violet-500/15 text-violet-400 border-violet-500/20",
      social: "bg-sky-500/15 text-sky-400 border-sky-500/20",
      linkedin: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Content Studio</h1>
              <p className="text-muted-foreground text-sm mt-1">AI-powered content creation for blogs, social media, and LinkedIn personal branding</p>
            </div>
            <Button onClick={() => { setGeneratedContent(""); setShowGenerate(true); }} className="btn-glow gap-2">
              <Plus size={16} />Create Content
            </Button>
          </div>

          {/* Content type tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="social">Social Posts</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>}

              {!isLoading && (!content || content.length === 0) && (
                <div className="card-premium p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
                    <Sparkles size={22} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">No Content Yet</h3>
                  <p className="text-muted-foreground text-sm">Click "Create Content" to generate AI-powered blog posts, social media content, and LinkedIn articles</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {content?.map(item => (
                  <button key={item.id} onClick={() => setSelectedContent(item)}
                    className="card-premium p-4 text-left hover:border-primary/30 transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", getTypeBadge(item.type))}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <Badge variant="outline" className={cn("text-xs flex-shrink-0", getTypeBadge(item.type))}>{item.type}</Badge>
                          {item.status === "published" && <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 flex-shrink-0">Published</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.body?.substring(0, 150)}...</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />AI Content Generator
            </DialogTitle>
          </DialogHeader>

          {!generatedContent ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES.map(ct => (
                    <button key={ct.value} onClick={() => setForm(f => ({ ...f, type: ct.value as any }))}
                      className={cn("p-3 rounded-xl border text-left transition-all", form.type === ct.value ? "border-primary/50 bg-primary/10" : "border-border bg-muted hover:border-primary/20")}>
                      <div className={cn("mb-1.5", form.type === ct.value ? "text-primary" : "text-muted-foreground")}>{ct.icon}</div>
                      <p className="text-xs font-semibold text-foreground">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Topic / Title *</label>
                <Input placeholder="e.g. 10 Ways to Grow Your Business with SEO" value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tone</label>
                  <Select value={form.tone} onValueChange={v => setForm(f => ({ ...f, tone: v }))}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.type === "social" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
                    <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Target Audience (optional)</label>
                <Input placeholder="Who is this content for?" value={form.targetAudience}
                  onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Keywords to Include (optional)</label>
                <Input placeholder="e.g. SEO, digital marketing, lead generation" value={form.keywords}
                  onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} className="bg-muted border-border" />
              </div>
              <Button className="w-full btn-glow gap-2" onClick={() => generate.mutate({ projectId, ...form })} disabled={!form.topic || generate.isPending}>
                {generate.isPending ? <><Zap size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Generate Content</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Generated Content</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success("Copied!"); }}>
                    <Copy size={12} />Copy
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setGeneratedContent("")}>Edit Prompt</Button>
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <Streamdown>{generatedContent}</Streamdown>
                </div>
              </div>
              <Button className="w-full gap-2" variant="outline" onClick={() => { setShowGenerate(false); setGeneratedContent(""); refetch(); }}>
                Done — View in Library
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Content Detail Dialog */}
      {selectedContent && (
        <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedContent.type)}{selectedContent.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="flex gap-2">
                <Badge variant="outline" className={cn("text-xs", getTypeBadge(selectedContent.type))}>{selectedContent.type}</Badge>
                <Badge variant="outline" className={cn("text-xs", selectedContent.status === "published" ? "text-emerald-400 border-emerald-500/30" : "text-muted-foreground")}>{selectedContent.status}</Badge>
              </div>
              <div className="bg-muted rounded-xl p-4 max-h-80 overflow-y-auto">
                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                  <Streamdown>{selectedContent.body || ""}</Streamdown>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5"                   onClick={() => { navigator.clipboard.writeText(selectedContent.body || ""); toast.success("Copied!"); }}>
                  <Copy size={14} />Copy
                </Button>
                {selectedContent.status !== "published" && (
                  <Button size="sm" className="gap-1.5 btn-glow" onClick={() => updateContent.mutate({ id: selectedContent.id, status: "published" })}>
                    <Globe size={14} />Mark Published
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10 ml-auto" onClick={() => deleteContent.mutate({ id: selectedContent.id })}>
                  <Trash2 size={14} />Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
