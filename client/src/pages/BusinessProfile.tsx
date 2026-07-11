import { AppLayout } from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useParams } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Zap, Save, CheckCircle2, Globe, Building2, Users, Star } from "lucide-react";
import { CURRENCIES, INDUSTRIES } from "../../../shared/types";

export default function BusinessProfile() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { setActiveProjectId, setCurrency, currency } = useProject();
  const initialised = useRef(false);

  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId);
      initialised.current = false; // Reset so profile always reloads when navigating back
    }
  }, [projectId]);

  const { data: profile, refetch, isLoading } = trpc.businessProfile.get.useQuery(
    { projectId },
    { enabled: !!projectId, staleTime: 0 } // Always fetch fresh data
  );

  const [form, setForm] = useState({
    companyName: "", industry: "", description: "", targetAudience: "",
    valueProposition: "", products: "", toneOfVoice: "", location: "",
    sourceUrl: "", currency: "USD",
  });
  const [saved, setSaved] = useState(false);

  // Populate form from DB — only once on first load
  useEffect(() => {
    if (profile && !initialised.current) {
      initialised.current = true;
      const cur = profile.currency || "USD";
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
        currency: cur,
      });
      setCurrency(cur);
    }
  }, [profile]);

  const saveMutation = trpc.businessProfile.save.useMutation({
    onSuccess: () => {
      toast.success("Business profile saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const extract = trpc.businessProfile.extractFromUrl.useMutation({
    onSuccess: (d: any) => {
      const updated = {
        ...form,
        companyName: d.companyName || form.companyName,
        description: d.description || form.description,
        targetAudience: d.targetAudience || form.targetAudience,
        industry: d.industry || form.industry,
        valueProposition: d.valueProposition || form.valueProposition,
        products: d.products || form.products,
        toneOfVoice: d.toneOfVoice || form.toneOfVoice,
        location: d.location || form.location,
      };
      setForm(updated);
      // Auto-save after extraction
      saveMutation.mutate({ projectId, ...updated });
      toast.success("Profile extracted and saved automatically!");
    },
    onError: () => toast.error("Could not extract — please fill in manually"),
  });

  const handleSave = () => {
    setCurrency(form.currency);
    saveMutation.mutate({ projectId, ...form });
  };

  const isComplete = form.companyName && form.industry && form.description && form.targetAudience;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-2xl mx-auto pb-16">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">Business Profile</h1>
              <p className="text-muted-foreground text-sm mt-1">Your business identity — used by AI across all plans, content, and campaigns</p>
            </div>
            <div className="flex items-center gap-2">
              {isComplete && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 size={12} />Complete</Badge>}
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="btn-glow gap-2">
                {saved ? <><CheckCircle2 size={16} />Saved!</> : saveMutation.isPending ? <><Zap size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save Profile</>}
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="card-premium p-8 text-center">
              <Zap size={24} className="animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Loading your business profile...</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* AI Extraction */}
              <div className="card-premium p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Globe size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Auto-Fill from Website</p>
                    <p className="text-xs text-muted-foreground">Paste your website URL — AI extracts and saves your profile instantly</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={form.sourceUrl}
                    onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                    className="bg-muted border-border flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => extract.mutate({ url: form.sourceUrl, projectId })}
                    disabled={!form.sourceUrl || extract.isPending}
                    className="gap-2 flex-shrink-0 btn-glow"
                  >
                    {extract.isPending ? <><Zap size={14} className="animate-spin" />Extracting...</> : <><Sparkles size={14} />Extract & Save</>}
                  </Button>
                </div>
              </div>

              {/* Core Details */}
              <div className="card-premium p-5 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">Company Details</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Company Name *</label>
                    <Input
                      placeholder="Your company name"
                      value={form.companyName}
                      onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Industry *</label>
                    <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Location / Market</label>
                    <Input
                      placeholder="e.g. Mumbai, India or Global"
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Brand Voice / Tone</label>
                    <Input
                      placeholder="e.g. Professional, Friendly"
                      value={form.toneOfVoice}
                      onChange={e => setForm(f => ({ ...f, toneOfVoice: e.target.value }))}
                      className="bg-muted border-border"
                    />
                  </div>
                </div>

                {/* Currency Selector */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Revenue Currency — used across all budgets, campaigns & reports
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, currency: c.code }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          form.currency === c.code
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        <span className="text-base leading-none">{c.symbol}</span>
                        <span>{c.code}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: <span className="text-foreground font-medium">{CURRENCIES.find(c => c.code === form.currency)?.name}</span> ({CURRENCIES.find(c => c.code === form.currency)?.symbol})
                  </p>
                </div>
              </div>

              {/* Audience & Value */}
              <div className="card-premium p-5 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">Audience & Value Proposition</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">What does your business do? *</label>
                  <Textarea
                    placeholder="Describe your products/services in plain English..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="bg-muted border-border"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Main Products / Services</label>
                  <Textarea
                    placeholder="List your key offerings..."
                    value={form.products}
                    onChange={e => setForm(f => ({ ...f, products: e.target.value }))}
                    className="bg-muted border-border"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Who are your ideal customers? *</label>
                  <Textarea
                    placeholder="Describe your target audience in detail — job title, age, pain points, goals..."
                    value={form.targetAudience}
                    onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                    className="bg-muted border-border"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">What makes you different? *</label>
                  <Textarea
                    placeholder="Why should customers choose you over competitors?"
                    value={form.valueProposition}
                    onChange={e => setForm(f => ({ ...f, valueProposition: e.target.value }))}
                    className="bg-muted border-border"
                    rows={3}
                  />
                </div>
              </div>

              {/* AI Opportunities (shown if profile was extracted) */}
              {profile?.rawExtraction && (() => {
                try {
                  const parsed = JSON.parse(profile.rawExtraction);
                  if (parsed.marketingOpportunities || parsed.suggestedChannels) {
                    return (
                      <div className="card-premium p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={16} className="text-amber-400" />
                          <p className="text-sm font-semibold text-foreground">AI Insights from Your Website</p>
                        </div>
                        {parsed.marketingOpportunities && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Marketing Opportunities</p>
                            <p className="text-sm text-foreground leading-relaxed">{parsed.marketingOpportunities}</p>
                          </div>
                        )}
                        {parsed.suggestedChannels && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Recommended Channels</p>
                            <p className="text-sm text-foreground leading-relaxed">{parsed.suggestedChannels}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                } catch {}
                return null;
              })()}

              <Button className="w-full btn-glow gap-2 h-11" onClick={handleSave} disabled={saveMutation.isPending}>
                {saved ? <><CheckCircle2 size={16} />Profile Saved!</> : saveMutation.isPending ? <><Zap size={16} className="animate-spin" />Saving...</> : <><Save size={16} />Save Business Profile</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
