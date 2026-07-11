import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Save } from "lucide-react";

export default function BusinessProfile() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId } = useProject();
  useEffect(() => { if (projectId) setActiveProjectId(projectId); }, [projectId]);

  const { data: profile, refetch } = trpc.businessProfile.get.useQuery({ projectId }, { enabled: !!projectId });
  const [form, setForm] = useState({
    companyName: "", industry: "", description: "", targetAudience: "",
    valueProposition: "", products: "", toneOfVoice: "", location: "", sourceUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || "",
        industry: profile.industry || "",
        description: profile.description || "",
        targetAudience: profile.targetAudience || "",
        valueProposition: profile.valueProposition || "",
        products: profile.products || "",
        toneOfVoice: profile.toneOfVoice || "",
        location: profile.location || "",
        sourceUrl: profile.sourceUrl || "",
      });
    }
  }, [profile]);

  const save = trpc.businessProfile.save.useMutation({
    onSuccess: () => { toast.success("Profile saved!"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const extract = trpc.businessProfile.extractFromUrl.useMutation({
    onSuccess: (d: any) => {
      setForm(f => ({
        ...f,
        companyName: d.companyName || f.companyName,
        description: d.description || f.description,
        targetAudience: d.targetAudience || f.targetAudience,
        industry: d.industry || f.industry,
        valueProposition: d.valueProposition || f.valueProposition,
        products: d.products || f.products,
        toneOfVoice: d.toneOfVoice || f.toneOfVoice,
        location: d.location || f.location,
      }));
      toast.success("Business profile extracted from website!");
    },
    onError: () => toast.error("Could not extract — please fill in manually"),
  });

  return (
    <AppLayout>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Business Profile</h1>
              <p className="text-muted-foreground text-sm mt-1">Your business identity — used by AI for all content and plans</p>
            </div>
            <Button onClick={() => save.mutate({ projectId, ...form })} disabled={save.isPending} className="btn-glow gap-2">
              <Save size={16} />{save.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <div className="card-premium p-5 space-y-5">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Sparkles size={14} />AI Auto-Fill from Website
              </p>
              <p className="text-xs text-muted-foreground mb-3">Enter your website URL and AI will automatically extract your business profile.</p>
              <div className="flex gap-2">
                <Input placeholder="https://yourwebsite.com" value={form.sourceUrl}
                  onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                  className="bg-background border-border flex-1" />
                <Button size="sm" onClick={() => extract.mutate({ url: form.sourceUrl, projectId })}
                  disabled={!form.sourceUrl || extract.isPending} className="gap-2 flex-shrink-0">
                  {extract.isPending ? <><Zap size={14} className="animate-spin" />Extracting...</> : <><Zap size={14} />Extract</>}
                </Button>
              </div>
            </div>

            {[
              { label: "Company Name", key: "companyName", placeholder: "Your company name", type: "input" },
              { label: "Industry", key: "industry", placeholder: "e.g. Technology, Healthcare, Retail", type: "input" },
              { label: "Location / Market", key: "location", placeholder: "e.g. New York, USA or Global", type: "input" },
              { label: "Brand Voice / Tone", key: "toneOfVoice", placeholder: "e.g. Professional, Friendly, Technical", type: "input" },
              { label: "What does your business do?", key: "description", placeholder: "Describe your products/services in plain English...", type: "textarea" },
              { label: "Main Products / Services", key: "products", placeholder: "List your key offerings...", type: "textarea" },
              { label: "Who are your ideal customers?", key: "targetAudience", placeholder: "Describe your target audience in detail...", type: "textarea" },
              { label: "What makes you different? (Value Proposition)", key: "valueProposition", placeholder: "Why should customers choose you over competitors?", type: "textarea" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{f.label}</label>
                {f.type === "input" ? (
                  <Input placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="bg-muted border-border" />
                ) : (
                  <Textarea placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="bg-muted border-border" rows={3} />
                )}
              </div>
            ))}

            <Button className="w-full btn-glow gap-2" onClick={() => save.mutate({ projectId, ...form })} disabled={save.isPending}>
              <Save size={16} />{save.isPending ? "Saving..." : "Save Business Profile"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
