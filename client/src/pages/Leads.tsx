import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Plus, Users, DollarSign, Target, Bot, Link2, Trash2, ChevronRight, Sparkles, Zap, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STAGE_LABELS, LEAD_STAGE_COLORS, type LeadStage } from "../../../shared/types";

const STAGES: LeadStage[] = ["new", "qualified", "proposal", "closed_won", "closed_lost"];

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bg: string }> = {
  new: { label: "New Lead", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  qualified: { label: "Qualified", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  proposal: { label: "Proposal Sent", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  closed_won: { label: "Closed Won", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  closed_lost: { label: "Closed Lost", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
};

export default function Leads() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId, currencySymbol } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [showAddLead, setShowAddLead] = useState(false);
  const [showScraper, setShowScraper] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", source: "Manual", estimatedValue: "", notes: "" });
  const [scraperForm, setScraperForm] = useState({ targetIndustry: "", targetLocation: "", targetCompanySize: "", targetJobTitles: "", targetKeywords: "", additionalContext: "" });
  const [portalForm, setPortalForm] = useState({ clientName: "", clientEmail: "" });
  const [scrapeResults, setScrapeResults] = useState<any[]>([]);
  const [selectedScrapeLeads, setSelectedScrapeLeads] = useState<number[]>([]);

  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery({ projectId }, { enabled: !!projectId });
  const { data: stats } = trpc.leads.stats.useQuery({ projectId }, { enabled: !!projectId });
  const { data: portals, refetch: refetchPortals } = trpc.clientPortal.list.useQuery({ projectId }, { enabled: !!projectId });

  const utils = trpc.useUtils();

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => { toast.success("Lead added!"); refetch(); setShowAddLead(false); setNewLead({ name: "", email: "", phone: "", company: "", source: "Manual", estimatedValue: "", notes: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => { refetch(); toast.success("Lead updated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => { refetch(); setSelectedLead(null); toast.success("Lead deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const [scrapeJobId, setScrapeJobId] = useState<number>(0);
  const runScraper = trpc.leadScraper.run.useMutation({
    onSuccess: (data: any) => { setScrapeResults(data.leads || []); setScrapeJobId(data.jobId || 0); toast.success(`Found ${data.total} potential leads!`); },
    onError: (e: any) => toast.error(e.message),
  });

  const importLeads = trpc.leadScraper.importLeads.useMutation({
    onSuccess: (data: any) => { toast.success(`Imported ${data.imported} leads!`); refetch(); setShowScraper(false); setScrapeResults([]); setSelectedScrapeLeads([]); },
    onError: (e: any) => toast.error(e.message),
  });

  const createPortal = trpc.clientPortal.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Client portal created!");
      refetchPortals();
      const url = `${window.location.origin}/portal/${data.token}`;
      navigator.clipboard.writeText(url).then(() => toast.info("Portal link copied to clipboard!"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revokePortal = trpc.clientPortal.revoke.useMutation({
    onSuccess: () => { toast.success("Portal access revoked"); refetchPortals(); },
    onError: (e: any) => toast.error(e.message),
  });

  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = leads?.filter(l => l.stage === stage) || [];
    return acc;
  }, {} as Record<LeadStage, any[]>);

  const totalPipeline = leads?.filter(l => l.stage !== "closed_lost").reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0) || 0;
  const closedRevenue = leads?.filter(l => l.stage === "closed_won").reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0) || 0;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-16">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Leads & CRM Pipeline</h1>
              <p className="text-muted-foreground text-sm mt-1">Track every lead from first contact to closed deal</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowScraper(true)} className="gap-2">
                <Bot size={16} />AI Lead Finder
              </Button>
              <Button variant="outline" onClick={() => setShowPortal(true)} className="gap-2">
                <Link2 size={16} />Client Portal
              </Button>
              <Button onClick={() => setShowAddLead(true)} className="btn-glow gap-2">
                <Plus size={16} />Add Lead
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: leads?.length || 0, icon: <Users size={18} />, color: "bg-sky-500/15 text-sky-400" },
              { label: "Pipeline Value", value: `${currencySymbol}${totalPipeline.toLocaleString()}`, icon: <Target size={18} />, color: "bg-violet-500/15 text-violet-400" },
              { label: "Revenue Closed", value: `${currencySymbol}${closedRevenue.toLocaleString()}`, icon: <DollarSign size={18} />, color: "bg-emerald-500/15 text-emerald-400" },
              { label: "Conversion Rate", value: leads?.length ? `${Math.round((leadsByStage.closed_won.length / leads.length) * 100)}%` : "0%", icon: <Target size={18} />, color: "bg-amber-500/15 text-amber-400" },
            ].map(card => (
              <div key={card.label} className="metric-card">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", card.color)}>{card.icon}</div>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Kanban Pipeline */}
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map(s => <Skeleton key={s} className="h-64 w-56 rounded-xl flex-shrink-0" />)}
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {STAGES.map(stage => {
                  const config = STAGE_CONFIG[stage];
                  const stageLeads = leadsByStage[stage];
                  const stageValue = stageLeads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);
                  return (
                    <div key={stage} className="kanban-col w-56">
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", config.bg, config.color)}>
                          {config.label}
                        </div>
                        <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                      </div>
                      {stageValue > 0 && (
                        <p className="text-xs text-muted-foreground mb-2">${stageValue.toLocaleString()} value</p>
                      )}
                      <div className="space-y-2">
                        {stageLeads.map(lead => (
                          <button key={lead.id} onClick={() => setSelectedLead(lead)}
                            className="w-full bg-card border border-border rounded-lg p-3 text-left hover:border-primary/30 transition-all hover:shadow-md group">
                            <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                            {lead.company && <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.company}</p>}
                            {lead.estimatedValue && (
                              <p className="text-xs font-semibold text-emerald-400 mt-1.5">${Number(lead.estimatedValue).toLocaleString()}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{lead.source}</span>
                              <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-6 text-xs text-muted-foreground">No leads here</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus size={18} className="text-primary"/>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {[
              { label: "Full Name *", key: "name", placeholder: "John Smith" },
              { label: "Email", key: "email", placeholder: "john@company.com" },
              { label: "Phone", key: "phone", placeholder: "+1 555 0100" },
              { label: "Company", key: "company", placeholder: "Company Name" },
              { label: "Estimated Deal Value ($)", key: "estimatedValue", placeholder: "5000" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                <Input placeholder={f.placeholder} value={(newLead as any)[f.key]} onChange={e => setNewLead(prev => ({ ...prev, [f.key]: e.target.value }))} className="bg-muted border-border h-9" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source</label>
              <Select value={newLead.source} onValueChange={v => setNewLead(f => ({ ...f, source: v }))}>
                <SelectTrigger className="bg-muted border-border h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Manual","Website","LinkedIn","Facebook","Google Ads","WhatsApp","Referral","Cold Outreach","AI Lead Finder"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea placeholder="Any notes about this lead..." value={newLead.notes} onChange={e => setNewLead(f => ({ ...f, notes: e.target.value }))} className="bg-muted border-border" rows={2} />
            </div>
            <Button className="w-full btn-glow gap-2" onClick={() => createLead.mutate({ projectId, ...newLead })} disabled={!newLead.name || createLead.isPending}>
              {createLead.isPending ? <><Zap size={16} className="animate-spin"/>Adding...</> : <><Plus size={16}/>Add Lead</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedLead.name}</DialogTitle>
              {selectedLead.company && <p className="text-sm text-muted-foreground">{selectedLead.company}</p>}
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedLead.email && <div><span className="text-muted-foreground">Email: </span><span className="text-foreground">{selectedLead.email}</span></div>}
                {selectedLead.phone && <div><span className="text-muted-foreground">Phone: </span><span className="text-foreground">{selectedLead.phone}</span></div>}
                {selectedLead.estimatedValue && <div><span className="text-muted-foreground">Value: </span><span className="text-emerald-400 font-semibold">${Number(selectedLead.estimatedValue).toLocaleString()}</span></div>}
                <div><span className="text-muted-foreground">Source: </span><span className="text-foreground">{selectedLead.source}</span></div>
              </div>
              {selectedLead.notes && (
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">{selectedLead.notes}</div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Move to Stage</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(stage => (
                    <button key={stage} onClick={() => { updateLead.mutate({ id: selectedLead.id, stage }); setSelectedLead({ ...selectedLead, stage }); }}
                      className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        selectedLead.stage === stage ? `${STAGE_CONFIG[stage].bg} ${STAGE_CONFIG[stage].color}` : "bg-muted border-border text-muted-foreground hover:border-primary/30")}>
                      {STAGE_CONFIG[stage].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => deleteLead.mutate({ id: selectedLead.id })}>
                  <Trash2 size={14}/>Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Lead Scraper Dialog */}
      <Dialog open={showScraper} onOpenChange={setShowScraper}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bot size={18} className="text-primary"/>AI Lead Finder</DialogTitle>
            <p className="text-sm text-muted-foreground">Describe your ideal customer and AI will discover matching leads</p>
          </DialogHeader>
          {scrapeResults.length === 0 ? (
            <div className="space-y-4 pt-2">
              {[
                { label: "Target Industry", key: "targetIndustry", placeholder: "e.g. SaaS, Healthcare, Real Estate" },
                { label: "Target Location", key: "targetLocation", placeholder: "e.g. New York, USA or Global" },
                { label: "Company Size", key: "targetCompanySize", placeholder: "e.g. 10-50 employees, SME, Enterprise" },
                { label: "Job Titles to Target", key: "targetJobTitles", placeholder: "e.g. CEO, Marketing Director, Head of Sales" },
                { label: "Keywords / Niche", key: "targetKeywords", placeholder: "e.g. digital transformation, cloud migration" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                  <Input placeholder={f.placeholder} value={(scraperForm as any)[f.key]} onChange={e => setScraperForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="bg-muted border-border h-9" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Additional Context</label>
                <Textarea placeholder="Any other details about your ideal customer..." value={scraperForm.additionalContext} onChange={e => setScraperForm(f => ({ ...f, additionalContext: e.target.value }))} className="bg-muted border-border" rows={2} />
              </div>
              <Button className="w-full btn-glow gap-2" onClick={() => runScraper.mutate({ projectId, ...scraperForm })} disabled={runScraper.isPending}>
                {runScraper.isPending ? <><Zap size={16} className="animate-spin"/>Finding Leads...</> : <><Sparkles size={16}/>Find Leads with AI</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{scrapeResults.length} leads found — select to import</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedScrapeLeads(scrapeResults.map((_,i) => i))}>Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedScrapeLeads([])}>Clear</Button>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {scrapeResults.map((lead, i) => (
                  <div key={i} onClick={() => setSelectedScrapeLeads(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className={cn("p-3 rounded-lg border cursor-pointer transition-all", selectedScrapeLeads.includes(i) ? "border-primary/50 bg-primary/10" : "border-border bg-card hover:border-primary/20")}>
                    <div className="flex items-start gap-3">
                      <div className={cn("w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center", selectedScrapeLeads.includes(i) ? "bg-primary border-primary" : "border-muted-foreground")}>
                        {selectedScrapeLeads.includes(i) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{lead.name}</p>
                          <span className="text-xs text-muted-foreground">— {lead.jobTitle}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.company} · {lead.location}</p>
                        {lead.estimatedValue && <p className="text-xs text-emerald-400 mt-1">Est. value: ${Number(lead.estimatedValue).toLocaleString()}</p>}
                        {lead.whyGoodFit && <p className="text-xs text-muted-foreground mt-1 italic">{lead.whyGoodFit}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setScrapeResults([]); setSelectedScrapeLeads([]); }} className="flex-1">Back</Button>
                <Button className="flex-1 btn-glow gap-2" disabled={selectedScrapeLeads.length === 0 || importLeads.isPending}
                  onClick={() => importLeads.mutate({ projectId, jobId: scrapeJobId, leadIndices: selectedScrapeLeads })}>
                  {importLeads.isPending ? <><Zap size={16} className="animate-spin"/>Importing...</> : <>Import {selectedScrapeLeads.length} Leads</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Client Portal Dialog */}
      <Dialog open={showPortal} onOpenChange={setShowPortal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Link2 size={18} className="text-primary"/>Client Portal Access</DialogTitle>
            <p className="text-sm text-muted-foreground">Give clients a branded link to view and update their CRM pipeline</p>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Name</label>
                <Input placeholder="e.g. Acme Corp" value={portalForm.clientName} onChange={e => setPortalForm(f => ({ ...f, clientName: e.target.value }))} className="bg-muted border-border h-9" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Email (optional)</label>
                <Input placeholder="client@company.com" value={portalForm.clientEmail} onChange={e => setPortalForm(f => ({ ...f, clientEmail: e.target.value }))} className="bg-muted border-border h-9" />
              </div>
              <Button className="w-full btn-glow gap-2" disabled={!portalForm.clientName || createPortal.isPending}
                onClick={() => createPortal.mutate({ projectId, clientName: portalForm.clientName, clientEmail: portalForm.clientEmail || undefined })}>
                {createPortal.isPending ? <><Zap size={16} className="animate-spin"/>Creating...</> : <><Link2 size={16}/>Generate Portal Link</>}
              </Button>
            </div>
            {portals && portals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Portals</p>
                {portals.map(portal => (
                  <div key={portal.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{portal.clientName}</p>
                      {portal.clientEmail && <p className="text-xs text-muted-foreground">{portal.clientEmail}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                        const url = `${window.location.origin}/portal/${portal.accessToken}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied!");
                      }}>
                        <Copy size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(`/portal/${portal.accessToken}`, "_blank")}>
                        <ExternalLink size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-400 hover:text-rose-400" onClick={() => revokePortal.mutate({ id: portal.id })}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
