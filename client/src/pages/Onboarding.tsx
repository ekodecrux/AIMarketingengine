import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap size={20} className="text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
