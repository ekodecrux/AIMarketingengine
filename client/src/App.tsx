import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProjectSetup from "./pages/ProjectSetup";
import BusinessProfile from "./pages/BusinessProfile";
import MarketingPlan from "./pages/MarketingPlan";
import Keywords from "./pages/Keywords";
import Competitors from "./pages/Competitors";
import ContentStudio from "./pages/ContentStudio";
import Leads from "./pages/Leads";
import Campaigns from "./pages/Campaigns";
import SeoTools from "./pages/SeoTools";
import WhatsApp from "./pages/WhatsApp";
import Integrations from "./pages/Integrations";
import KnowledgeBase from "./pages/KnowledgeBase";
import Onboarding from "./pages/Onboarding";
import ClientPortal from "./pages/ClientPortal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects/new" component={ProjectSetup} />
      <Route path="/projects/:id/profile" component={BusinessProfile} />
      <Route path="/projects/:id/plan" component={MarketingPlan} />
      <Route path="/projects/:id/keywords" component={Keywords} />
      <Route path="/projects/:id/competitors" component={Competitors} />
      <Route path="/projects/:id/content" component={ContentStudio} />
      <Route path="/projects/:id/leads" component={Leads} />
      <Route path="/projects/:id/campaigns" component={Campaigns} />
      <Route path="/projects/:id/seo" component={SeoTools} />
      <Route path="/projects/:id/whatsapp" component={WhatsApp} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/portal/:token" component={ClientPortal} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <ProjectProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </ProjectProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
