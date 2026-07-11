import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, MessageCircle, Copy } from "lucide-react";
import { Streamdown } from "streamdown";

const TONES = ["Friendly", "Professional", "Urgent", "Promotional", "Informational", "Conversational"];

export default function WhatsApp() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const [form, setForm] = useState({ campaignGoal: "", targetAudience: "", businessDescription: "", tone: "Friendly" });
  const [result, setResult] = useState<string>("");

  const { data: project } = trpc.projects.get.useQuery({ id: projectId }, { enabled: !!projectId });
  useEffect(() => { if (project) setForm(f => ({ ...f, businessDescription: project.description || f.businessDescription })); }, [project]);

  const generate = trpc.whatsapp.generateCampaign.useMutation({
    onSuccess: (data: any) => {
      setResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      toast.success("WhatsApp campaign generated!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-2xl">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
              <MessageCircle size={24} className="text-emerald-400" />WhatsApp Campaigns
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Generate complete WhatsApp Business campaign scripts, message sequences, and broadcast strategies</p>
          </div>

          <div className="card-premium p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <Sparkles size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">AI Campaign Generator</p>
                <p className="text-xs text-muted-foreground">Get a complete campaign with message templates, sequences, and timing strategy</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Campaign Goal *</label>
              <Input placeholder="e.g. Promote new product launch, Re-engage inactive customers, Drive webinar sign-ups"
                value={form.campaignGoal} onChange={e => setForm(f => ({ ...f, campaignGoal: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Target Audience</label>
              <Input placeholder="e.g. Existing customers, Warm leads, Newsletter subscribers"
                value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Business Context</label>
              <Textarea placeholder="Brief description of your business and offer..."
                value={form.businessDescription} onChange={e => setForm(f => ({ ...f, businessDescription: e.target.value }))} className="bg-muted border-border" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message Tone</label>
              <Select value={form.tone} onValueChange={v => setForm(f => ({ ...f, tone: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full btn-glow gap-2" onClick={() => generate.mutate({ projectId, ...form })} disabled={!form.campaignGoal || generate.isPending}>
              {generate.isPending ? <><Zap size={16} className="animate-spin" />Generating Campaign...</> : <><Sparkles size={16} />Generate WhatsApp Campaign</>}
            </Button>
          </div>

          {result && (
            <div className="card-premium p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Campaign Strategy & Message Templates</h3>
                <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied!"); }}>
                  <Copy size={12} />Copy All
                </Button>
              </div>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <Streamdown>{result}</Streamdown>
              </div>
            </div>
          )}

          {!result && (
            <div className="card-premium p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto">
                <MessageCircle size={22} className="text-emerald-400" />
              </div>
              <h3 className="font-semibold text-foreground">WhatsApp Business Campaigns</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">Generate complete campaign strategies with message sequences, broadcast templates, opt-in flows, and follow-up automation scripts — all tailored to your business.</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {["Message Templates", "Broadcast Sequences", "Opt-in Flows"].map(f => (
                  <div key={f} className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-foreground">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
