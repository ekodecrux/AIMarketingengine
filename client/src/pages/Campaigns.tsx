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
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Plus, Target, TrendingUp, DollarSign, MousePointer, Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Google Ads", "Facebook", "Instagram", "LinkedIn", "Twitter/X", "WhatsApp", "Quora"];
const OBJECTIVES = ["Brand Awareness", "Lead Generation", "Website Traffic", "Conversions", "App Installs", "Engagement", "Retargeting"];
const STATUSES = ["draft", "active", "paused", "completed"];

export default function Campaigns() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [form, setForm] = useState({ name: "", platform: "Google Ads", objective: "Lead Generation", budget: "", isRetargeting: 0 });

  const { data: campaigns, isLoading, refetch } = trpc.campaigns.list.useQuery({ projectId }, { enabled: !!projectId });

  const create = trpc.campaigns.create.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); setForm({ name: "", platform: "Google Ads", objective: "Lead Generation", budget: "", isRetargeting: 0 }); toast.success("Campaign created!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = trpc.campaigns.update.useMutation({
    onSuccess: () => { refetch(); setSelectedCampaign(null); toast.success("Campaign updated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      draft: "text-muted-foreground bg-muted border-border",
      completed: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    };
    return colors[status] || "text-muted-foreground bg-muted border-border";
  };

  const totalBudget = campaigns?.reduce((s, c) => s + Number(c.budget || 0), 0) || 0;
  const totalSpent = campaigns?.reduce((s, c) => s + Number(c.spent || 0), 0) || 0;
  const totalImpressions = campaigns?.reduce((s, c) => s + (c.impressions || 0), 0) || 0;
  const totalClicks = campaigns?.reduce((s, c) => s + (c.clicks || 0), 0) || 0;

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Campaigns</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage paid campaigns across all platforms with budget tracking and performance metrics</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="btn-glow gap-2">
              <Plus size={16} />New Campaign
            </Button>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Budget", value: `$${totalBudget.toLocaleString()}`, icon: <DollarSign size={16} />, color: "text-primary" },
              { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: <TrendingUp size={16} />, color: "text-amber-400" },
              { label: "Impressions", value: totalImpressions.toLocaleString(), icon: <Eye size={16} />, color: "text-sky-400" },
              { label: "Clicks", value: totalClicks.toLocaleString(), icon: <MousePointer size={16} />, color: "text-emerald-400" },
            ].map(m => (
              <div key={m.label} className="card-premium p-4">
                <div className={cn("mb-2", m.color)}>{m.icon}</div>
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {isLoading && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>}

          {!isLoading && (!campaigns || campaigns.length === 0) && (
            <div className="card-premium p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
                <Target size={22} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">No Campaigns Yet</h3>
              <p className="text-muted-foreground text-sm">Create your first paid campaign to start tracking performance and ROI</p>
            </div>
          )}

          <div className="space-y-3">
            {campaigns?.map(campaign => (
              <button key={campaign.id} onClick={() => setSelectedCampaign(campaign)}
                className="card-premium p-4 w-full text-left hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(campaign.status))}>{campaign.status}</Badge>
                      {campaign.isRetargeting ? <Badge variant="outline" className="text-xs text-violet-400 border-violet-500/20">Retargeting</Badge> : null}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{campaign.platform}</span>
                      <span>•</span>
                      <span>{campaign.objective}</span>
                      {campaign.budget && <><span>•</span><span>Budget: ${Number(campaign.budget).toLocaleString()}</span></>}
                    </div>
                  </div>
                  <div className="flex gap-4 text-right flex-shrink-0">
                    {campaign.impressions ? (
                      <div>
                        <p className="text-sm font-semibold text-foreground">{campaign.impressions.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">impressions</p>
                      </div>
                    ) : null}
                    {campaign.clicks ? (
                      <div>
                        <p className="text-sm font-semibold text-foreground">{campaign.clicks.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                      </div>
                    ) : null}
                    {campaign.conversions ? (
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">{campaign.conversions}</p>
                        <p className="text-xs text-muted-foreground">conversions</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target size={18} className="text-primary" />New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Campaign Name *</label>
              <Input placeholder="e.g. Q3 Lead Gen - Google" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Objective</label>
                <Select value={form.objective} onValueChange={v => setForm(f => ({ ...f, objective: v }))}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJECTIVES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Budget ($)</label>
              <Input type="number" placeholder="e.g. 1000" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="retargeting" checked={form.isRetargeting === 1}
                onChange={e => setForm(f => ({ ...f, isRetargeting: e.target.checked ? 1 : 0 }))} className="rounded" />
              <label htmlFor="retargeting" className="text-sm text-foreground">This is a retargeting campaign</label>
            </div>
            <Button className="w-full btn-glow gap-2" onClick={() => create.mutate({ projectId, ...form })} disabled={!form.name || create.isPending}>
              {create.isPending ? <><Zap size={16} className="animate-spin" />Creating...</> : <>Create Campaign</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Campaign Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Impressions", key: "impressions", type: "number" },
                  { label: "Clicks", key: "clicks", type: "number" },
                  { label: "Conversions", key: "conversions", type: "number" },
                  { label: "Spent ($)", key: "spent", type: "text" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                    <Input type={f.type} defaultValue={selectedCampaign[f.key] || ""}
                      id={`update-${f.key}`} className="bg-muted border-border" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <Select defaultValue={selectedCampaign.status} onValueChange={v => update.mutate({ id: selectedCampaign.id, status: v as any })}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full btn-glow" onClick={() => {
                const getVal = (key: string) => (document.getElementById(`update-${key}`) as HTMLInputElement)?.value;
                update.mutate({
                  id: selectedCampaign.id,
                  impressions: Number(getVal("impressions")) || undefined,
                  clicks: Number(getVal("clicks")) || undefined,
                  conversions: Number(getVal("conversions")) || undefined,
                  spent: getVal("spent") || undefined,
                });
              }} disabled={update.isPending}>
                {update.isPending ? "Saving..." : "Save Updates"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
