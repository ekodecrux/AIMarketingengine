import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Settings,
  Brain,
  Bell,
  Shield,
  Globe,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  UserCog,
} from "lucide-react";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)", description: "Best quality, balanced speed" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Faster, cost-efficient" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Excellent reasoning" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Long context window" },
];

const SETTING_KEYS = [
  "ai_model", "ai_temperature", "rag_enabled", "auto_save_knowledge",
  "email_notifications", "lead_alerts", "campaign_reports", "weekly_digest",
  "default_currency", "timezone", "language",
];

export default function GlobalSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Local state mirrors DB values
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [autoSaveKnowledge, setAutoSaveKnowledge] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [campaignReports, setCampaignReports] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("en");

  // Admin panel state
  const [showUsers, setShowUsers] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  // Load settings from DB
  const { data: settingsData, isLoading: settingsLoading } = trpc.globalSettings.get.useQuery(
    { keys: SETTING_KEYS },
    { enabled: !!user }
  );

  // Admin queries
  const { data: allUsers, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.listUsers.useQuery(
    undefined,
    { enabled: isAdmin && showUsers }
  );
  const { data: usageStats, isLoading: usageLoading, refetch: refetchUsage } = trpc.admin.usageStats.useQuery(
    undefined,
    { enabled: isAdmin && showUsage }
  );

  const updateRole = trpc.admin.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });

  const saveSettings = trpc.globalSettings.save.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (e) => toast.error(`Failed to save: ${e.message}`),
  });

  // Populate state from DB on load
  useEffect(() => {
    if (!settingsData) return;
    if (settingsData.ai_model) setSelectedModel(settingsData.ai_model);
    if (settingsData.ai_temperature) setAiTemperature(parseFloat(settingsData.ai_temperature));
    if (settingsData.rag_enabled !== undefined) setRagEnabled(settingsData.rag_enabled === "true");
    if (settingsData.auto_save_knowledge !== undefined) setAutoSaveKnowledge(settingsData.auto_save_knowledge === "true");
    if (settingsData.email_notifications !== undefined) setEmailNotifications(settingsData.email_notifications === "true");
    if (settingsData.lead_alerts !== undefined) setLeadAlerts(settingsData.lead_alerts === "true");
    if (settingsData.campaign_reports !== undefined) setCampaignReports(settingsData.campaign_reports === "true");
    if (settingsData.weekly_digest !== undefined) setWeeklyDigest(settingsData.weekly_digest === "true");
    if (settingsData.default_currency) setDefaultCurrency(settingsData.default_currency);
    if (settingsData.timezone) setTimezone(settingsData.timezone);
    if (settingsData.language) setLanguage(settingsData.language);
  }, [settingsData]);

  function handleSaveAI() {
    saveSettings.mutate({
      settings: {
        ai_model: selectedModel,
        ai_temperature: String(aiTemperature),
        rag_enabled: String(ragEnabled),
        auto_save_knowledge: String(autoSaveKnowledge),
      },
    });
  }

  function handleSaveNotifications() {
    saveSettings.mutate({
      settings: {
        email_notifications: String(emailNotifications),
        lead_alerts: String(leadAlerts),
        campaign_reports: String(campaignReports),
        weekly_digest: String(weeklyDigest),
      },
    });
  }

  function handleSavePlatform() {
    saveSettings.mutate({
      settings: {
        default_currency: defaultCurrency,
        timezone,
        language,
      },
    });
  }

  if (settingsLoading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-muted-foreground text-sm">Configure AI models, notifications, and platform preferences</p>
          </div>
        </div>

        {/* AI Configuration */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <CardTitle className="text-lg">AI Configuration</CardTitle>
            </div>
            <CardDescription>Choose the AI model and behaviour for all generated content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground text-xs ml-2">— {m.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperature: <span className="text-violet-400 font-mono">{aiTemperature.toFixed(1)}</span></Label>
              <Slider
                min={0} max={1} step={0.1}
                value={[aiTemperature]}
                onValueChange={([v]) => setAiTemperature(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 — Precise</span>
                <span>1.0 — Creative</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Knowledge Base (RAG)</p>
                <p className="text-xs text-muted-foreground">Reuse previous AI answers to save tokens</p>
              </div>
              <Switch checked={ragEnabled} onCheckedChange={setRagEnabled} />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Auto-save AI Responses</p>
                <p className="text-xs text-muted-foreground">Automatically store AI answers in knowledge base</p>
              </div>
              <Switch checked={autoSaveKnowledge} onCheckedChange={setAutoSaveKnowledge} />
            </div>

            <Button onClick={handleSaveAI} disabled={saveSettings.isPending} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saveSettings.isPending ? "Saving..." : "Save AI Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Control which alerts and reports you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "email_notifications", label: "Email Notifications", desc: "Receive updates via email", value: emailNotifications, set: setEmailNotifications },
              { key: "lead_alerts", label: "New Lead Alerts", desc: "Notify when a new lead is added", value: leadAlerts, set: setLeadAlerts },
              { key: "campaign_reports", label: "Campaign Reports", desc: "Weekly campaign performance summaries", value: campaignReports, set: setCampaignReports },
              { key: "weekly_digest", label: "Weekly Digest", desc: "Summary of all activity across projects", value: weeklyDigest, set: setWeeklyDigest },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.set} />
              </div>
            ))}
            <Button onClick={handleSaveNotifications} disabled={saveSettings.isPending} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saveSettings.isPending ? "Saving..." : "Save Notifications"}
            </Button>
          </CardContent>
        </Card>

        {/* Platform Defaults */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-lg">Platform Defaults</CardTitle>
            </div>
            <CardDescription>Default currency, timezone, and language for all projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                    <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                    <SelectItem value="SGD">SGD — Singapore Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSavePlatform} disabled={saveSettings.isPending} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {saveSettings.isPending ? "Saving..." : "Save Platform Defaults"}
            </Button>
          </CardContent>
        </Card>

        {/* Admin Panel (admin only) */}
        {isAdmin && (
          <>
            {/* User Management */}
            <Card className="border-violet-500/20">
              <CardHeader className="pb-3">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setShowUsers(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400" />
                    <CardTitle className="text-lg">User Management</CardTitle>
                    <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs">Admin</Badge>
                  </div>
                  {showUsers ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                <CardDescription>View and manage all platform users and their roles</CardDescription>
              </CardHeader>
              {showUsers && (
                <CardContent>
                  <div className="flex justify-end mb-3">
                    <Button size="sm" variant="outline" onClick={() => refetchUsers()} className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />Refresh
                    </Button>
                  </div>
                  {usersLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {allUsers?.map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <Select
                            value={u.role}
                            onValueChange={(role) => updateRole.mutate({ userId: u.id, role: role as "admin" | "user" })}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                      {!allUsers?.length && (
                        <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Usage Analytics */}
            <Card className="border-cyan-500/20">
              <CardHeader className="pb-3">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setShowUsage(v => !v)}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <CardTitle className="text-lg">Usage Analytics</CardTitle>
                    <Badge className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30 text-xs">Admin</Badge>
                  </div>
                  {showUsage ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                <CardDescription>AI call counts and knowledge base usage across the platform</CardDescription>
              </CardHeader>
              {showUsage && (
                <CardContent>
                  <div className="flex justify-end mb-3">
                    <Button size="sm" variant="outline" onClick={() => refetchUsage()} className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />Refresh
                    </Button>
                  </div>
                  {usageLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                  ) : usageStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                          <p className="text-2xl font-bold text-cyan-400">{usageStats.totalAiCalls}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total AI Calls</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                          <p className="text-2xl font-bold text-violet-400">{usageStats.totalKnowledgeEntries}</p>
                          <p className="text-xs text-muted-foreground mt-1">Knowledge Entries</p>
                        </div>
                      </div>
                      {Object.keys(usageStats.byCategory).length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">By Category</p>
                          <div className="space-y-1.5">
                            {Object.entries(usageStats.byCategory)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg bg-muted/30">
                                  <span className="text-muted-foreground capitalize">{cat.replace(/_/g, " ")}</span>
                                  <Badge variant="outline" className="text-xs">{count as number}</Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No usage data yet</p>
                  )}
                </CardContent>
              )}
            </Card>
          </>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-pink-400" />
              <CardTitle className="text-lg">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium">{user?.name || "User"}</p>
                <p className="text-muted-foreground text-sm">{user?.email || "No email"}</p>
              </div>
              <Badge className="ml-auto capitalize">{user?.role || "user"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
