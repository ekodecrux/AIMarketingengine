import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, BarChart3, Bot, FileText, Globe, Link2,
  MessageCircle, Search, Sparkles, Target, TrendingUp,
  Users, Zap, CheckCircle2, Star
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

const features = [
  { icon: <Sparkles size={20} />, title: "AI Marketing Plans", desc: "Goal-based strategies with SEO-first approach and smart budget allocation across all channels." },
  { icon: <Search size={20} />, title: "Keyword & Competitor Analysis", desc: "AI-powered research with difficulty scoring and full competitor landscape breakdown." },
  { icon: <FileText size={20} />, title: "Content Studio", desc: "Generate blogs, social posts, and LinkedIn thought leadership content in seconds." },
  { icon: <Users size={20} />, title: "Lead CRM Pipeline", desc: "Track leads from New to Closed Won with revenue and ROI reporting built in." },
  { icon: <TrendingUp size={20} />, title: "Paid Campaigns", desc: "Plan, track, and optimise paid campaigns with retargeting strategies across all platforms." },
  { icon: <MessageCircle size={20} />, title: "WhatsApp Campaigns", desc: "98% open rate campaigns with broadcast scheduling and contact management." },
  { icon: <Link2 size={20} />, title: "SEO & Backlinks", desc: "On-page recommendations, backlink tracking, and keyword ranking monitoring." },
  { icon: <Bot size={20} />, title: "AI Knowledge Base", desc: "Context-aware answers from your own marketing history — AI as fallback, knowledge first." },
];

const channels = [
  { name: "Google Ads", color: "#4285F4" },
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Facebook", color: "#1877F2" },
  { name: "Instagram", color: "#E1306C" },
  { name: "WhatsApp", color: "#25D366" },
  { name: "Quora", color: "#B92B27" },
  { name: "X / Twitter", color: "#1DA1F2" },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={16} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Nexus AI</span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Demo Login</Link>
            </Button>
            <Button onClick={() => startLogin()} className="btn-glow gap-2" size="sm">
              Get Started <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="outline" className="px-4 py-1.5 text-primary border-primary/30 bg-primary/10 text-sm font-medium">
            <Sparkles size={12} className="mr-2" />
            AI-Powered Marketing Intelligence
          </Badge>
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-tight">
            Your entire marketing
            <br />
            <span className="gradient-text">engine, on autopilot.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nexus AI handles strategy, content, leads, campaigns, and analytics — so you can focus on growing your business. No marketing degree required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => startLogin()} className="btn-glow gap-2 px-8 text-base h-12">
              Start Free <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 px-8 text-base h-12">
              <Link href="/login">
                <Zap size={18} />
                Try Demo
              </Link>
            </Button>
          </div>
          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex -space-x-2">
              {["A","B","C","D","E"].map((l) => (
                <div key={l} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-semibold text-primary">{l}</div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-xs text-muted-foreground">Trusted by 500+ businesses</p>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-10 border-y border-border/50 bg-muted/20">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">All channels, one platform</p>
          <div className="flex flex-wrap justify-center gap-4">
            {channels.map((ch) => (
              <div key={ch.name} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                {ch.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl mb-4">Everything you need to grow</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From strategy to execution — every marketing tool you need, powered by AI that learns your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            {features.map((f) => (
              <div key={f.title} className="card-premium p-6 space-y-3 animate-fade-in-up">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="font-display font-bold text-4xl">Built for business owners, not marketers.</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                No jargon. No complexity. Just clear guidance on what to do next to grow your business.
              </p>
              {[
                "Plain-English explanations for every metric",
                "Guided setup wizard — live in under 5 minutes",
                "AI suggests your next best action, always",
                "Industry best practices embedded automatically",
                "Multi-project workspace for agencies and teams",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
              <Button size="lg" onClick={() => startLogin()} className="btn-glow gap-2 mt-4">
                Get Started Free <ArrowRight size={18} />
              </Button>
            </div>
            <div className="relative">
              <div className="card-premium p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <span className="font-semibold text-sm">AI Marketing Assistant</span>
                </div>
                {[
                  { q: "What should I do first?", a: "Your SEO foundation is the highest ROI move. Start with 5 blog posts targeting your top keywords." },
                  { q: "How much should I spend on ads?", a: "With your $2,000 budget, allocate 40% to Google Ads, 30% to Meta, 20% to LinkedIn, 10% to WhatsApp." },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">{item.q}</div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm text-foreground">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="container max-w-2xl mx-auto space-y-6">
          <h2 className="font-display font-bold text-4xl">Ready to transform your marketing?</h2>
          <p className="text-muted-foreground text-lg">Join hundreds of businesses already using Nexus AI to generate leads and grow revenue.</p>
          <Button size="lg" onClick={() => startLogin()} className="btn-glow gap-2 px-10 text-base h-12">
            Start for Free <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Zap size={12} className="text-primary" />
            </div>
            <span>Nexus AI © 2026</span>
          </div>
          <span>AI-Powered Marketing Intelligence Platform</span>
        </div>
      </footer>
    </div>
  );
}
