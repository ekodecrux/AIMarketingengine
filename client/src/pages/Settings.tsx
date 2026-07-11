import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import {
  Key, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle,
  BarChart3, Mail, MessageSquare, Search, Globe, Zap, Plus, Info
} from "lucide-react";

const INTEGRATION_SERVICES = [
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    icon: <BarChart3 size={20} className="text-orange-400" />,
    color: "bg-orange-500/10 border-orange-500/20",
    description: "Track website traffic, user behaviour, and conversion events in real time.",
    fields: [
      { key: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", hint: "Found in GA4 Admin → Data Streams → Web Stream Details" },
      { key: "api_secret", label: "API Secret (optional)", placeholder: "Your Measurement Protocol API secret", hint: "For server-side event tracking. GA4 Admin → Data Streams → Measurement Protocol API secrets" },
    ],
  },
  {
    id: "google_search_console",
    name: "Google Search Console",
    icon: <Search size={20} className="text-blue-400" />,
    color: "bg-blue-500/10 border-blue-500/20",
    description: "Monitor keyword rankings, impressions, and click-through rates from Google Search.",
    fields: [
      { key: "site_url", label: "Site URL", placeholder: "https://yourdomain.com", hint: "The exact URL you verified in Search Console" },
      { key: "service_account_json", label: "Service Account JSON Key", placeholder: "Paste your service account JSON here", hint: "Create in Google Cloud Console → IAM → Service Accounts" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid (Email Campaigns)",
    icon: <Mail size={20} className="text-cyan-400" />,
    color: "bg-cyan-500/10 border-cyan-500/20",
    description: "Send transactional and marketing emails, track open rates and click rates.",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxxxxxxxxxxxxxxxxxxx", hint: "SendGrid Dashboard → Settings → API Keys → Create API Key" },
      { key: "from_email", label: "From Email Address", placeholder: "marketing@yourdomain.com", hint: "Must be a verified sender in SendGrid" },
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    icon: <Mail size={20} className="text-yellow-400" />,
    color: "bg-yellow-500/10 border-yellow-500/20",
    description: "Manage email lists, automate campaigns, and track audience engagement.",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1", hint: "Mailchimp Account → Profile → Extras → API Keys" },
      { key: "server_prefix", label: "Server Prefix", placeholder: "us1", hint: "The prefix at the end of your API key (e.g. us1, us6)" },
    ],
  },
  {
    id: "whatsapp_business",
    name: "WhatsApp Business API",
    icon: <MessageSquare size={20} className="text-green-400" />,
    color: "bg-green-500/10 border-green-500/20",
    description: "Send WhatsApp campaigns, broadcast messages, and automate lead nurturing.",
    fields: [
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "1234567890123456", hint: "Meta Business Suite → WhatsApp → API Setup → Phone Number ID" },
      { key: "access_token", label: "Permanent Access Token", placeholder: "EAAxxxxxxxxxxxxxxxx", hint: "Meta Business Suite → System Users → Generate Token" },
      { key: "waba_id", label: "WhatsApp Business Account ID", placeholder: "1234567890123456", hint: "Meta Business Suite → WhatsApp → API Setup → WhatsApp Business Account ID" },
    ],
  },
  {
    id: "facebook_ads",
    name: "Facebook / Meta Ads",
    icon: <Globe size={20} className="text-blue-500" />,
    color: "bg-blue-600/10 border-blue-600/20",
    description: "Run and monitor Facebook and Instagram paid ad campaigns.",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "EAAxxxxxxxxxxxxxxxx", hint: "Meta for Developers → Tools → Graph API Explorer → Generate Token" },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_1234567890", hint: "Facebook Ads Manager → Account Settings → Account ID (prefix with act_)" },
    ],
  },
  {
    id: "linkedin_ads",
    name: "LinkedIn Campaign Manager",
    icon: <Globe size={20} className="text-blue-400" />,
    color: "bg-sky-500/10 border-sky-500/20",
    description: "Manage LinkedIn sponsored content, lead gen forms, and InMail campaigns.",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "AQxxxxxxxxxxxxxxxx", hint: "LinkedIn Developer Portal → Auth → OAuth 2.0 Tools → Access Token" },
      { key: "account_id", label: "Ad Account ID", placeholder: "123456789", hint: "LinkedIn Campaign Manager → Account Assets → Account ID" },
    ],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: <Zap size={20} className="text-yellow-500" />,
    color: "bg-yellow-500/10 border-yellow-500/20",
    description: "Track Google Search, Display, and Shopping campaign performance.",
    fields: [
      { key: "developer_token", label: "Developer Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "Google Ads → Tools → API Centre → Developer Token" },
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890", hint: "Google Ads → Account Settings → Account ID" },
      { key: "refresh_token", label: "Refresh Token", placeholder: "1//xxxxxxxxxxxxxxxx", hint: "Generated via OAuth2 flow with your Google Ads credentials" },
    ],
  },
];

type KeyEntry = { id: number; service: string; keyName: string; keyValue: string; isActive: number };

export default function Settings() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const { data: keys = [], refetch } = trpc.apiKeys.list.useQuery({ projectId }, { enabled: !!projectId });
  const saveMutation = trpc.apiKeys.save.useMutation({ onSuccess: () => { toast.success("API key saved securely"); refetch(); } });
  const deleteMutation = trpc.apiKeys.delete.useMutation({ onSuccess: () => { toast.success("Key removed"); refetch(); } });

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [expandedService, setExpandedService] = useState<string | null>("google_analytics");

  const getStoredKey = (service: string, keyName: string): KeyEntry | undefined =>
    (keys as KeyEntry[]).find(k => k.service === service && k.keyName === keyName);

  const formKey = (service: string, field: string) => `${service}__${field}`;

  const handleSave = (service: string, fieldKey: string, label: string) => {
    const val = formValues[formKey(service, fieldKey)];
    if (!val?.trim()) { toast.error("Please enter a value before saving"); return; }
    saveMutation.mutate({ projectId, service, keyName: fieldKey, keyValue: val.trim() });
    setFormValues(prev => { const n = { ...prev }; delete n[formKey(service, fieldKey)]; return n; });
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this API key?")) deleteMutation.mutate({ id });
  };

  const getServiceStatus = (serviceId: string) => {
    const svc = INTEGRATION_SERVICES.find(s => s.id === serviceId);
    if (!svc) return "not_configured";
    const stored = (keys as KeyEntry[]).filter(k => k.service === serviceId);
    const required = svc.fields.filter(f => !f.label.toLowerCase().includes("optional"));
    if (stored.length === 0) return "not_configured";
    if (stored.length >= required.length) return "configured";
    return "partial";
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 pb-16 overflow-y-auto h-full">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Integration Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Securely connect your marketing tools and analytics platforms. Keys are stored encrypted per project.</p>
        </div>

        {/* Status overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INTEGRATION_SERVICES.slice(0, 4).map(svc => {
            const status = getServiceStatus(svc.id);
            return (
              <div key={svc.id} className="card-premium p-3 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setExpandedService(svc.id)}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${svc.color}`}>{svc.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{svc.name.split(" ")[0]}</p>
                  <Badge variant="outline" className={`text-[10px] mt-0.5 ${status === "configured" ? "text-emerald-400 border-emerald-500/30" : status === "partial" ? "text-yellow-400 border-yellow-500/30" : "text-muted-foreground"}`}>
                    {status === "configured" ? "✓ Connected" : status === "partial" ? "Partial" : "Not set"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service cards */}
        <div className="space-y-4">
          {INTEGRATION_SERVICES.map(svc => {
            const isExpanded = expandedService === svc.id;
            const status = getServiceStatus(svc.id);
            return (
              <div key={svc.id} className="card-premium overflow-hidden">
                {/* Service header */}
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedService(isExpanded ? null : svc.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${svc.color}`}>{svc.icon}</div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{svc.name}</p>
                        {status === "configured" && <CheckCircle2 size={14} className="text-emerald-400" />}
                        {status === "partial" && <AlertCircle size={14} className="text-yellow-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${status === "configured" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : status === "partial" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-muted-foreground"}`}>
                    {status === "configured" ? "Connected" : status === "partial" ? "Partial" : "Configure"}
                  </Badge>
                </button>

                {/* Expanded fields */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-4 space-y-4 bg-white/[0.01]">
                    {svc.fields.map(field => {
                      const stored = getStoredKey(svc.id, field.key);
                      const fk = formKey(svc.id, field.key);
                      const isVisible = showValues[fk];
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-foreground">{field.label}</label>
                            {stored && (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">Saved</span>
                                <button onClick={() => handleDelete(stored.id)} className="ml-1 text-red-400 hover:text-red-300 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={isVisible ? "text" : "password"}
                                placeholder={stored ? "••••••••••••••••" : field.placeholder}
                                value={formValues[fk] || ""}
                                onChange={e => setFormValues(prev => ({ ...prev, [fk]: e.target.value }))}
                                className="pr-10 text-sm font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowValues(prev => ({ ...prev, [fk]: !prev[fk] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSave(svc.id, field.key, field.label)}
                              disabled={!formValues[fk]?.trim() || saveMutation.isPending}
                              className="gap-1.5 shrink-0"
                            >
                              <Plus size={14} />Save
                            </Button>
                          </div>
                          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <Info size={11} className="mt-0.5 shrink-0" />
                            <span>{field.hint}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Security note */}
        <div className="card-premium p-4 flex items-start gap-3 border-primary/20 bg-primary/5">
          <Key size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Security Notice</p>
            <p className="text-xs text-muted-foreground mt-1">All API keys are stored encrypted in the database and are never exposed in API responses. Keys are scoped per project — each client's credentials are fully isolated. Never share your API keys publicly or commit them to version control.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
