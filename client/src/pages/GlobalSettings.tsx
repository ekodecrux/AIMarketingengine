import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Brain,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Zap,
  Users,
  Key,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)", description: "Best quality, balanced speed" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Faster, cost-efficient" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Excellent reasoning" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Long context window" },
];

export default function GlobalSettings() {
  const { user } = useAuth();

  // AI Settings
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [aiTemperature, setAiTemperature] = useState("0.7");
  const [ragEnabled, setRagEnabled] = useState(true);
  const [autoSaveKnowledge, setAutoSaveKnowledge] = useState(true);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [campaignReports, setCampaignReports] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Platform Settings
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("en");

  function handleSaveAI() {
    toast.success("AI settings saved successfully");
  }

  function handleSaveNotifications() {
    toast.success("Notification preferences updated");
  }

  function handleSavePlatform() {
    toast.success("Platform settings saved");
  }

  const isAdmin = user?.role === "admin";

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-slate-400 text-sm">Configure AI models, notifications, and platform preferences</p>
          </div>
          {isAdmin && (
            <Badge className="ml-auto bg-violet-600/20 text-violet-300 border-violet-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>

        {/* AI Configuration */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              <CardTitle className="text-white text-lg">AI Configuration</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Configure the AI model and knowledge base settings used across all projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300">Default AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {AI_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-white focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        <span className="text-slate-500 text-xs">— {m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Used for marketing plan generation, content creation, and AI chat</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">AI Creativity (Temperature: {aiTemperature})</Label>
              <Input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiTemperature}
                onChange={(e) => setAiTemperature(e.target.value)}
                className="bg-white/5 border-white/10 accent-violet-500 h-2 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-200 text-sm font-medium">Knowledge Base (RAG)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Use stored knowledge before calling AI — faster and cheaper</p>
                </div>
                <Switch checked={ragEnabled} onCheckedChange={setRagEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-200 text-sm font-medium">Auto-Save AI Responses</p>
                  <p className="text-slate-500 text-xs mt-0.5">Automatically save AI responses to knowledge base for reuse</p>
                </div>
                <Switch checked={autoSaveKnowledge} onCheckedChange={setAutoSaveKnowledge} />
              </div>
            </div>

            <Button onClick={handleSaveAI} className="bg-violet-600 hover:bg-violet-500 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save AI Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-white text-lg">Notifications</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Choose which events trigger email and in-app notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Receive notifications via email", value: emailNotifications, setter: setEmailNotifications },
              { label: "New Lead Alerts", desc: "Get notified when a new lead is captured", value: leadAlerts, setter: setLeadAlerts },
              { label: "Campaign Performance Reports", desc: "Weekly campaign performance summaries", value: campaignReports, setter: setCampaignReports },
              { label: "Weekly Digest", desc: "A weekly summary of all platform activity", value: weeklyDigest, setter: setWeeklyDigest },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
                <Switch checked={item.value} onCheckedChange={item.setter} />
              </div>
            ))}

            <Button onClick={handleSaveNotifications} className="bg-cyan-600 hover:bg-cyan-500 text-white mt-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Notification Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Platform Defaults */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-white text-lg">Platform Defaults</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Default settings applied to new projects (can be overridden per project)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Default Currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {["USD", "INR", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"].map((c) => (
                      <SelectItem key={c} value={c} className="text-white focus:bg-white/10">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {["Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"].map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-white focus:bg-white/10">{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="en" className="text-white focus:bg-white/10">English</SelectItem>
                    <SelectItem value="hi" className="text-white focus:bg-white/10">Hindi</SelectItem>
                    <SelectItem value="ar" className="text-white focus:bg-white/10">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSavePlatform} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Platform Defaults
            </Button>
          </CardContent>
        </Card>

        {/* Admin Panel (admin only) */}
        {isAdmin && (
          <Card className="bg-white/5 border-white/10 border-violet-500/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-400" />
                <CardTitle className="text-white text-lg">Admin Panel</CardTitle>
                <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs">Admin Only</Badge>
              </div>
              <CardDescription className="text-slate-400">
                Platform administration — user management, system health, and audit logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Users, label: "User Management", desc: "View and manage all platform users", color: "text-blue-400" },
                { icon: Database, label: "Database Health", desc: "Monitor database performance and connections", color: "text-emerald-400" },
                { icon: Key, label: "API Key Management", desc: "Manage platform-level API keys and integrations", color: "text-amber-400" },
                { icon: Zap, label: "Usage Analytics", desc: "AI token usage, API calls, and cost tracking", color: "text-cyan-400" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => toast.info(`${item.label} — coming soon`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 text-left group"
                >
                  <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                    <p className="text-slate-500 text-xs truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              <CardTitle className="text-white text-lg">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name || "User"}</p>
                <p className="text-slate-400 text-sm">{user?.email || "No email"}</p>
              </div>
              <Badge className="ml-auto bg-white/10 text-slate-300 border-white/10 capitalize">
                {user?.role || "user"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
