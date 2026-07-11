import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useState } from "react";
import {
  Users, CheckCircle2, Clock, XCircle, DollarSign, MessageSquare,
  TrendingUp, Building2, Phone, Mail, ArrowRight, Activity,
  Target, BarChart3, Sparkles, Calendar, User
} from "lucide-react";
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
  proposal: "Proposal Sent", negotiation: "Negotiation",
  closed_won: "Closed Won", closed_lost: "Closed Lost",
};

const KANBAN_STAGES = ["new", "qualified", "proposal", "negotiation", "closed_won"];

const NEXT_STAGE: Record<string, string> = {
  new: "qualified",
  qualified: "proposal",
  proposal: "negotiation",
  negotiation: "closed_won",
};

const VALID_STAGES = ["new", "qualified", "proposal", "closed_won", "closed_lost"] as const;
type ValidStage = typeof VALID_STAGES[number];

export default function ClientPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [note, setNote] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const { data: portal, isLoading: portalLoading, error } = trpc.clientPortal.getByToken.useQuery(
    { token }, { enabled: !!token }
  );
  const { data: leads = [], isLoading: leadsLoading, refetch } = trpc.clientPortal.getLeadsForClient.useQuery(
    { token }, { enabled: !!token }
  );
  const { data: activities = [] } = trpc.clientPortal.getLeadActivities.useQuery(
    { token, leadId: selectedLead?.id ?? 0 },
    { enabled: !!token && !!selectedLead?.id }
  );

  const updateStage = trpc.clientPortal.updateLeadAsClient.useMutation({
    onSuccess: () => { toast.success("Lead stage updated"); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  const addNoteMutation = trpc.clientPortal.updateLeadAsClient.useMutation({
    onSuccess: () => { toast.success("Note added"); setNote(""); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to add note"),
  });

  if (portalLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles size={22} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Portal Not Found</h2>
          <p className="text-muted-foreground text-sm">This link may have expired or is invalid. Please contact your marketing team for a new link.</p>
        </div>
      </div>
    );
  }

  const leadsArr = leads as any[];
  const totalValue = leadsArr.reduce((s: number, l: any) => s + (Number(l.dealValue) || 0), 0);
  const wonLeads = leadsArr.filter((l: any) => l.stage === "closed_won");
  const wonValue = wonLeads.reduce((s: number, l: any) => s + (Number(l.dealValue) || 0), 0);
  const convRate = leadsArr.length > 0 ? Math.round((wonLeads.length / leadsArr.length) * 100) : 0;
  const activeLeads = leadsArr.filter((l: any) => !["closed_won", "closed_lost"].includes(l.stage)).length;

  const byStage = (stage: string) => leadsArr.filter((l: any) => l.stage === stage);

  const handleMoveStage = (leadId: number, stage: string) => {
    if (!VALID_STAGES.includes(stage as ValidStage)) return;
    updateStage.mutate({ token, leadId, stage: stage as ValidStage });
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-foreground">
      {/* Top nav */}
      <header className="border-b border-border/40 bg-[#0d0d1a]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Nexus AI</p>
              <p className="text-[10px] text-muted-foreground">Client Portal — {portal.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
              <User size={10} className="mr-1" />{portal.clientEmail || portal.clientName}
            </Badge>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setView("kanban")}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", view === "kanban" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
              >Kanban</button>
              <button
                onClick={() => setView("list")}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
              >List</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Your Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your leads, update stages, and monitor your revenue progress in real time.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: leadsArr.length, icon: <Users size={18} />, color: "text-sky-400", bg: "bg-sky-500/10" },
            { label: "Active Leads", value: activeLeads, icon: <Activity size={18} />, color: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "Pipeline Value", value: `₹${totalValue.toLocaleString()}`, icon: <DollarSign size={18} />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Conversion Rate", value: `${convRate}%`, icon: <TrendingUp size={18} />, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(stat => (
            <div key={stat.label} className="card-premium p-4">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3 ${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        {view === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {KANBAN_STAGES.map(stage => {
                const stageLeads = byStage(stage);
                const stageValue = stageLeads.reduce((s: number, l: any) => s + (Number(l.dealValue) || 0), 0);
                return (
                  <div key={stage} className="w-72 flex flex-col gap-3">
                    {/* Column header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[stage])}>{STAGE_LABELS[stage]}</Badge>
                        <span className="text-xs text-muted-foreground bg-white/5 rounded-full px-2 py-0.5">{stageLeads.length}</span>
                      </div>
                      {stageValue > 0 && <span className="text-xs text-muted-foreground">₹{stageValue.toLocaleString()}</span>}
                    </div>
                    {/* Cards */}
                    <div className="space-y-2 min-h-[120px]">
                      {stageLeads.map((lead: any) => (
                        <div
                          key={lead.id}
                          className="card-premium p-3 cursor-pointer hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {(lead.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground leading-tight truncate">{lead.name || "Unnamed Lead"}</p>
                              {lead.company && <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>}
                            </div>
                          </div>
                          {lead.dealValue && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <DollarSign size={10} />₹{Number(lead.dealValue).toLocaleString()}
                            </div>
                          )}
                          {lead.source && (
                            <p className="text-[10px] text-muted-foreground mt-1">via {lead.source}</p>
                          )}
                          {/* Move forward button */}
                          {NEXT_STAGE[stage] && VALID_STAGES.includes(NEXT_STAGE[stage] as ValidStage) && (
                            <button
                              className="mt-2 w-full text-[10px] text-primary/60 hover:text-primary flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={e => {
                                e.stopPropagation();
                                handleMoveStage(lead.id, NEXT_STAGE[stage]);
                              }}
                            >
                              Move to {STAGE_LABELS[NEXT_STAGE[stage]]} <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                      {stageLeads.length === 0 && (
                        <div className="border border-dashed border-border/30 rounded-xl p-4 text-center">
                          <p className="text-[11px] text-muted-foreground">No leads here yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <div className="card-premium overflow-hidden">
            {leadsLoading ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Lead", "Company", "Stage", "Value", "Source", "Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsArr.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-border/30 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                            {(lead.name || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-xs">{lead.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{lead.company || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px]", STAGE_COLORS[lead.stage] || "")}>{STAGE_LABELS[lead.stage] || lead.stage}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-emerald-400 font-medium">{lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{lead.source || "—"}</td>
                      <td className="px-4 py-3">
                        {NEXT_STAGE[lead.stage] && VALID_STAGES.includes(NEXT_STAGE[lead.stage] as ValidStage) && (
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1"
                            onClick={e => { e.stopPropagation(); handleMoveStage(lead.id, NEXT_STAGE[lead.stage]); }}>
                            → {STAGE_LABELS[NEXT_STAGE[lead.stage]]}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!leadsLoading && leadsArr.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">No leads in your pipeline yet.</div>
            )}
          </div>
        )}
      </div>

      {/* Lead detail dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg bg-[#0d0d1a] border-border/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                {(selectedLead?.name || "?")[0].toUpperCase()}
              </div>
              {selectedLead?.name || "Lead Detail"}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Building2 size={13} />, label: "Company", value: selectedLead.company },
                  { icon: <Mail size={13} />, label: "Email", value: selectedLead.email },
                  { icon: <Phone size={13} />, label: "Phone", value: selectedLead.phone },
                  { icon: <Target size={13} />, label: "Source", value: selectedLead.source },
                  { icon: <DollarSign size={13} />, label: "Deal Value", value: selectedLead.dealValue ? `₹${Number(selectedLead.dealValue).toLocaleString()}` : null },
                  { icon: <BarChart3 size={13} />, label: "Stage", value: STAGE_LABELS[selectedLead.stage] },
                ].filter(i => i.value).map(item => (
                  <div key={item.label} className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      {item.icon}<span className="text-[10px]">{item.label}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Stage progression */}
              <div>
                <p className="text-xs font-medium text-foreground mb-2">Move to Stage</p>
                <div className="flex flex-wrap gap-2">
                  {VALID_STAGES.filter(s => s !== selectedLead.stage).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        handleMoveStage(selectedLead.id, s);
                        setSelectedLead({ ...selectedLead, stage: s });
                      }}
                      className={cn("text-[11px] px-2.5 py-1 rounded-full border transition-colors hover:opacity-80 cursor-pointer", STAGE_COLORS[s])}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Notes</p>
                  <p className="text-xs text-foreground">{selectedLead.notes}</p>
                </div>
              )}

              {/* Activity log */}
              {(activities as any[]).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <Activity size={12} />Activity Log
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(activities as any[]).map((act: any) => (
                      <div key={act.id} className="flex items-start gap-2 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                        <div>
                          <span className="text-foreground">{act.description || act.detail}</span>
                          <span className="text-muted-foreground ml-1.5">{new Date(act.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add note */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare size={12} />Add a Note
                </p>
                <Textarea
                  placeholder="Add a note about this lead..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="text-xs min-h-[70px] resize-none"
                />
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => addNoteMutation.mutate({ token, leadId: selectedLead.id, notes: note })}
                  disabled={!note.trim() || addNoteMutation.isPending}
                >
                  <MessageSquare size={13} />
                  {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
