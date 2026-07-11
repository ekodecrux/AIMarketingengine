import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Link2, CheckCircle2, XCircle, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-600", desc: "Professional networking & B2B marketing" },
  { id: "facebook", name: "Facebook", color: "bg-blue-500", desc: "Paid ads, pages & community groups" },
  { id: "instagram", name: "Instagram", color: "bg-pink-500", desc: "Visual content & Stories" },
  { id: "twitter", name: "X / Twitter", color: "bg-zinc-800", desc: "Real-time engagement & brand voice" },
  { id: "whatsapp", name: "WhatsApp Business", color: "bg-emerald-600", desc: "Direct messaging campaigns" },
  { id: "google", name: "Google Ads", color: "bg-amber-500", desc: "Search, Display & YouTube ads" },
  { id: "quora", name: "Quora", color: "bg-rose-600", desc: "Thought leadership & Q&A marketing" },
];

export default function Integrations() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [form, setForm] = useState({ accountName: "", accessToken: "", apiKey: "", apiSecret: "" });

  const { data: accounts, refetch } = trpc.socialAccounts.list.useQuery({});

  const connect = trpc.socialAccounts.connect.useMutation({
    onSuccess: () => { refetch(); setConnecting(null); setForm({ accountName: "", accessToken: "", apiKey: "", apiSecret: "" }); toast.success("Account connected!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnect = trpc.socialAccounts.disconnect.useMutation({
    onSuccess: () => { refetch(); toast.success("Account disconnected"); },
    onError: (e: any) => toast.error(e.message),
  });

  const getAccount = (platformId: string) => accounts?.find(a => a.platform === platformId);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-2xl">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Integrations</h1>
            <p className="text-muted-foreground text-sm mt-1">Connect your social media accounts and advertising platforms to publish content and run campaigns</p>
          </div>

          <div className="space-y-3">
            {PLATFORMS.map(platform => {
              const account = getAccount(platform.id);
              const isConnected = !!account;
              return (
                <div key={platform.id} className="card-premium p-4 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0", platform.color)}>
                    {platform.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                      {isConnected && <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20">Connected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.desc}</p>
                    {isConnected && account && <p className="text-xs text-primary mt-0.5">@{account.accountName}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    {isConnected ? (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-rose-400 hover:text-rose-400 hover:bg-rose-500/10"
                        onClick={() => disconnect.mutate({ id: account!.id })}>
                        <XCircle size={12} className="mr-1" />Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs h-7 gap-1" onClick={() => setConnecting(platform.id)}>
                        <Plus size={12} />Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-premium p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Link2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">How Integrations Work</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Connect your accounts by providing your API credentials or access tokens. These are stored securely and used to publish content, schedule posts, and sync campaign data directly from this platform. For OAuth-based platforms, you'll need to generate a long-lived access token from the platform's developer portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Dialog */}
      {connecting && (
        <Dialog open={!!connecting} onOpenChange={() => setConnecting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 size={18} className="text-primary" />
                Connect {PLATFORMS.find(p => p.id === connecting)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">Enter your account credentials. These are stored securely and used only for publishing and campaign management.</p>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Account Name / Handle *</label>
                <Input placeholder="e.g. @yourbrand or Your Brand Name" value={form.accountName}
                  onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Access Token</label>
                <Input type="password" placeholder="Long-lived access token from developer portal" value={form.accessToken}
                  onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">API Key</label>
                  <Input type="password" placeholder="API Key" value={form.apiKey}
                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className="bg-muted border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">API Secret</label>
                  <Input type="password" placeholder="API Secret" value={form.apiSecret}
                    onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))} className="bg-muted border-border" />
                </div>
              </div>
              <Button className="w-full btn-glow gap-2" disabled={!form.accountName || connect.isPending}
                onClick={() => connect.mutate({ platform: connecting as any, ...form })}>
                {connect.isPending ? <><Zap size={16} className="animate-spin" />Connecting...</> : <><CheckCircle2 size={16} />Connect Account</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
