import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  ArrowUpRight, BarChart3, Briefcase, ChevronRight,
  DollarSign, FileText, Layers, Plus, Sparkles,
  Target, TrendingUp, Users, Zap, Bot
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LEAD_STAGE_LABELS } from "../../../shared/types";

const CHART_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

// No mock data — trend is loaded from DB via trpc.dashboard.leadTrend

function MetricCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: number;
}) {
  return (
    <div className="metric-card animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10")}>
            <ArrowUpRight size={12} className={trend < 0 ? "rotate-180" : ""} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const { activeProjectId, setActiveProjectId, currencySymbol } = useProject();
  const [, navigate] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.consolidated.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: projectStats } = trpc.dashboard.projectStats.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId }
  );
  const { data: leadTrend = [] } = trpc.dashboard.leadTrend.useQuery(
    { months: 6 },
    { enabled: isAuthenticated }
  );

  if (loading) return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center">
        <Zap size={24} className="text-primary animate-pulse" />
      </div>
    </AppLayout>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to continue</p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/login">Demo Login</Link>
            </Button>
            <Button variant="outline" onClick={() => startLogin()}>Manus OAuth</Button>
          </div>
        </div>
      </div>
    );
  }

  const stageData = projectStats?.leads?.byStage
    ? Object.entries(projectStats.leads.byStage).map(([k, v]) => ({
        name: LEAD_STAGE_LABELS[k as keyof typeof LEAD_STAGE_LABELS] || k,
        value: v as number,
      })).filter(d => d.value > 0)
    : [];

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Marketing Intelligence Hub</h1>
              <p className="text-muted-foreground text-sm mt-1">Your consolidated view across all projects</p>
            </div>
            <Link href="/projects/new">
              <Button className="btn-glow gap-2"><Plus size={16} />New Project</Button>
            </Link>
          </div>

          {!projectsLoading && (!projects || projects.length === 0) && (
            <div className="card-premium p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl">Welcome to Nexus AI</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first project to start generating AI marketing plans, tracking leads, and growing your business.
              </p>
              <Link href="/projects/new">
                <Button className="btn-glow gap-2 mt-2"><Plus size={16} />Create Your First Project</Button>
              </Link>
            </div>
          )}

          {stats && (() => {
            // Compute real MoM trends from leadTrend data
            const momLeads = leadTrend.length >= 2
              ? (() => { const p = leadTrend[leadTrend.length - 2]?.leads || 0; const c = leadTrend[leadTrend.length - 1]?.leads || 0; return p > 0 ? Math.round(((c - p) / p) * 100) : undefined; })()
              : undefined;
            const momRevenue = leadTrend.length >= 2
              ? (() => { const p = leadTrend[leadTrend.length - 2]?.revenue || 0; const c = leadTrend[leadTrend.length - 1]?.revenue || 0; return p > 0 ? Math.round(((c - p) / p) * 100) : undefined; })()
              : undefined;
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <MetricCard label="Total Projects" value={stats.projects ?? 0} icon={<Layers size={18} />} color="bg-violet-500/15 text-violet-400" />
                <MetricCard label="Total Leads" value={stats.leads ?? 0} sub="Across all projects" icon={<Users size={18} />} color="bg-sky-500/15 text-sky-400" trend={momLeads} />
                <MetricCard label="Revenue Closed" value={`${currencySymbol}${Number(stats.revenue ?? 0).toLocaleString()}`} sub="Closed won deals" icon={<DollarSign size={18} />} color="bg-emerald-500/15 text-emerald-400" trend={momRevenue} />
                <MetricCard label="Conversion Rate" value={`${stats.conversionRate ?? 0}%`} sub="Lead to close" icon={<Target size={18} />} color="bg-amber-500/15 text-amber-400" />
              </div>
            );
          })()}
          {statsLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-premium p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-foreground">Lead & Revenue Trend</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 6 months performance</p>
                </div>
                {leadTrend.length >= 2 && (() => {
                  const prev = leadTrend[leadTrend.length - 2]?.leads || 0;
                  const curr = leadTrend[leadTrend.length - 1]?.leads || 0;
                  const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
                  return (
                    <Badge variant="outline" className={pct >= 0 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-rose-400 border-rose-500/30 bg-rose-500/10"}>
                      <ArrowUpRight size={12} className={`mr-1 ${pct < 0 ? "rotate-180" : ""}`} />{pct >= 0 ? "+" : ""}{pct}% leads
                    </Badge>
                  );
                })()}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={leadTrend}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 265)" />
                  <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.02 265)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "oklch(0.55 0.02 265)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "oklch(0.55 0.02 265)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.13 0.018 265)", border: "1px solid oklch(0.22 0.02 265)", borderRadius: "8px" }} labelStyle={{ color: "oklch(0.97 0.005 265)" }} />
                  <Area yAxisId="left" type="monotone" dataKey="leads" stroke="#7c3aed" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Your Projects</h3>
                <Link href="/projects/new">
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7"><Plus size={12} /> New</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {projectsLoading && [1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
                {projects?.map((p) => (
                  <button key={p.id} onClick={() => { setActiveProjectId(p.id); navigate(`/projects/${p.id}/plan`); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (p.color || "#6366f1") + "25" }}>
                      <Briefcase size={14} style={{ color: p.color || "#6366f1" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.industry || "No industry set"}</p>
                    </div>
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", p.status === "active" ? "bg-emerald-400" : "bg-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeProjectId && projectStats && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Active Project Overview</h2>
                <Badge variant="outline" className="text-xs">{projects?.find(p => p.id === activeProjectId)?.name}</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                <MetricCard label="Pipeline Value" value={`${currencySymbol}${Number(projectStats.leads?.totalPipeline || 0).toLocaleString()}`} icon={<TrendingUp size={18} />} color="bg-violet-500/15 text-violet-400" />
                <MetricCard label="Active Campaigns" value={projectStats.campaigns?.total || 0} sub={`${currencySymbol}${Number(projectStats.campaigns?.totalSpent || 0).toLocaleString()} spent`} icon={<BarChart3 size={18} />} color="bg-sky-500/15 text-sky-400" />
                <MetricCard label="Content Pieces" value={projectStats.content?.total || 0} sub={`${projectStats.content?.published || 0} published`} icon={<FileText size={18} />} color="bg-amber-500/15 text-amber-400" />
                <MetricCard label="Keywords Tracked" value={projectStats.seo?.keywords || 0} sub={`${projectStats.seo?.backlinks || 0} backlinks`} icon={<Target size={18} />} color="bg-emerald-500/15 text-emerald-400" />
              </div>
              {stageData.length > 0 && (
                <div className="card-premium p-5">
                  <h3 className="font-semibold text-foreground mb-4">Lead Pipeline Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {stageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "oklch(0.13 0.018 265)", border: "1px solid oklch(0.22 0.02 265)", borderRadius: "8px" }} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          <div className="card-premium p-5">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Generate Marketing Plan", icon: <Sparkles size={16} />, href: activeProjectId ? `/projects/${activeProjectId}/plan` : "/projects/new", color: "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25" },
                { label: "Add a Lead", icon: <Users size={16} />, href: activeProjectId ? `/projects/${activeProjectId}/leads` : "/projects/new", color: "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25" },
                { label: "Create Content", icon: <FileText size={16} />, href: activeProjectId ? `/projects/${activeProjectId}/content` : "/projects/new", color: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" },
                { label: "WhatsApp Campaign", icon: <Bot size={16} />, href: activeProjectId ? `/projects/${activeProjectId}/whatsapp` : "/projects/new", color: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" },
              ].map(action => (
                <Link key={action.label} href={action.href}>
                  <button className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium", action.color)}>
                    {action.icon}<span>{action.label}</span><ChevronRight size={14} className="ml-auto" />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
