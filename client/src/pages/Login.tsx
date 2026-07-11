import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap, Shield, Users } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Nexus AI!");
      // Small delay to allow cookie to be set
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 300);
    },
    onError: (err) => {
      toast.error(err.message || "Invalid email or password");
    },
  });

  function fillAdmin() {
    setEmail("admin@nexusai.demo");
    setPassword("admin123");
  }

  function fillClient() {
    setEmail("client@nexusai.demo");
    setPassword("client123");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    loginMutation.mutate({ email, password });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-4 shadow-lg shadow-violet-500/25">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Nexus AI</h1>
          <p className="text-slate-400 mt-1 text-sm">AI-Powered Marketing Platform</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Sign in to your account</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials or use a demo account below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Demo quick-fill buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={fillAdmin}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 hover:border-violet-500/50 transition-all duration-200 text-sm font-medium group"
              >
                <Shield className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="text-left min-w-0">
                  <div className="font-semibold truncate">Admin Demo</div>
                  <div className="text-xs text-violet-400/70 truncate">admin@nexusai.demo</div>
                </div>
              </button>
              <button
                type="button"
                onClick={fillClient}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 hover:border-cyan-500/50 transition-all duration-200 text-sm font-medium group"
              >
                <Users className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="text-left min-w-0">
                  <div className="font-semibold truncate">Client Demo</div>
                  <div className="text-xs text-cyan-400/70 truncate">client@nexusai.demo</div>
                </div>
              </button>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-slate-500">or enter credentials</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-slate-500 text-sm mb-3">Or sign in with your Manus account</p>
              <Button
                variant="outline"
                onClick={() => startLogin()}
                className="w-full border-white/10 text-slate-300 hover:bg-white/5 hover:text-white bg-transparent h-10"
              >
                <Zap className="w-4 h-4 mr-2 text-violet-400" />
                Continue with Manus OAuth
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          Demo credentials are pre-loaded for testing. No sign-up required.
        </p>
      </div>
    </div>
  );
}
