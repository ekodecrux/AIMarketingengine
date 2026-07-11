import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useState } from "react";
import { Users, CheckCircle2, Clock, XCircle, DollarSign, MessageSquare, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  contacted: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  qualified: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  proposal: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  negotiation: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  closed_won: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  closed_lost: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const STAGE_LABELS: Record<string, string> = {
  new: "New Lead", contacted: "Contacted", qualified: "Qualified",
  proposal: "Proposal Sent", negotiation: "Negotiation", closed_won: "Closed Won", closed_lost: "Closed Lost",
};

const STAGES = ["new", "qualified", "proposal", "closed_won", "closed_lost"];

export default function ClientPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [note, setNote] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");

  const { data: portal, isLoading: portalLoading, error } = trpc.clientPortal.getByToken.useQuery({ token }, { enabled: !!token });
  const { data: leads, isLoading: leadsLoading, refetch } = trpc.clientPortal.getLeadsForClient.useQuery({ token }, { enabled: !!token });
  const { data: activities } = trpc.clientPortal.getLeadActivities.useQuery({ token, leadId: selectedLead?.id }, { enabled: !!token && !!selectedLead?.id });

  const updateStage = trpc.clientPortal.updateLeadAsClient.useMutation({
    onSuccess: () => { refetch(); toast.success("Lead stage updated!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const addNote = trpc.clientPortal.updateLeadAsClient.useMutation({
    onSuccess: () => { setNote(""); refetch(); toast.success("Note added!"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (portalLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap size={20} className="text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm">Loading your portal...</p>
      </div>
    </div>
  );

  if (error || !portal) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <XCircle size={40} className="text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Portal Not Found</h2>
        <p className="text-muted-foreground text-sm">This portal link is invalid or has been revoked.</p>
      </div>
    </div>
  );

  const permissions = typeof portal.permissions === "string" ? JSON.parse(portal.permissions) : portal.permissions || {};
  const filteredLeads = (leads || []).filter((l: any) => filterStage === "all" || l.stage === filterStage);
  const wonLeads = (leads || []).filter((l: any) => l.stage === "closed_won");
  const totalRevenue = wonLeads.reduce((s: number, l: any) => s + Number(l.dealValue || 0), 0);
  const conversionRate = leads?.length ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Client Portal</p>
            <p className="text-xs text-muted-foreground">{portal.clientName}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20">
          <CheckCircle2 size={10} className="mr-1" />Active
        </Badge>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: leads?.length || 0, icon: <Users size={16} />, color: "text-primary" },
            { label: "Closed Won", value: wonLeads.length, icon: <CheckCircle2 size={16} />, color: "text-emerald-400" },
            { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign size={16} />, color: "text-amber-400" },
            { label: "Conversion", value: `${conversionRate}%`, icon: <TrendingUp size={16} />, color: "text-sky-400" },
          ].map(m => (
            <div key={m.label} className="card-premium p-4">
              <div className={cn("mb-2", m.color)}>{m.icon}</div>
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Stage filter */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterStage("all")}
            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", filterStage === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
            All ({leads?.length || 0})
          </button>
          {STAGES.map((s: string) => {
            const count = (leads || []).filter((l: any) => l.stage === s).length || 0;
            if (!count) return null;
            return (
              <button key={s} onClick={() => setFilterStage(s)}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border", filterStage === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
                {STAGE_LABELS[s]} ({count})
              </button>
            );
          })}
        </div>

        {/* Leads */}
        {leadsLoading && <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}

        {!leadsLoading && filteredLeads.length === 0 && (
          <div className="card-premium p-10 text-center">
            <Users size={24} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No leads in this stage</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredLeads.map((lead: any) => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)}
              className="card-premium p-4 w-full text-left hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                    <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[lead.stage] || "bg-muted text-muted-foreground")}>
                      {STAGE_LABELS[lead.stage] || lead.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {lead.company && <span>{lead.company}</span>}
                    {lead.email && <span>{lead.email}</span>}
                    {lead.source && <span>via {lead.source}</span>}
                  </div>
                </div>
                {lead.dealValue && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-400">${Number(lead.dealValue).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">deal value</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLead.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedLead.company && <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium text-foreground">{selectedLead.company}</p></div>}
                {selectedLead.email && <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium text-foreground">{selectedLead.email}</p></div>}
                {selectedLead.phone && <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-foreground">{selectedLead.phone}</p></div>}
                {selectedLead.dealValue && <div><p className="text-xs text-muted-foreground">Deal Value</p><p className="font-bold text-emerald-400">${Number(selectedLead.dealValue).toLocaleString()}</p></div>}
              </div>

              {permissions.editLeads && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Update Stage</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(s => (
                      <button key={s}                 onClick={() => updateStage.mutate({ token, leadId: selectedLead.id, stage: s as any })}
                        className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-all", selectedLead.stage === s ? STAGE_COLORS[s] : "bg-muted text-muted-foreground border-border hover:border-primary/30")}>
                        {STAGE_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              {activities && activities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Activity Log</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activities.map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2 text-xs">
                        <Clock size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-foreground">{act.description}</p>
                          <p className="text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add note */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Add Note</p>
                <Textarea placeholder="Add a note or update about this lead..." value={note}
                  onChange={e => setNote(e.target.value)} className="bg-muted border-border" rows={2} />
                <Button size="sm" className="mt-2 gap-2" disabled={!note.trim() || addNote.isPending}
                  onClick={() => addNote.mutate({ token, leadId: selectedLead.id, notes: note })}>
                  {addNote.isPending ? <><Zap size={12} className="animate-spin" />Adding...</> : <><MessageSquare size={12} />Add Note</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
