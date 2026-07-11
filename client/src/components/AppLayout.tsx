import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import {
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  ChevronDown,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  projectScoped?: boolean;
}

const globalNav: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/dashboard" },
  { label: "Knowledge Base", icon: <BookOpen size={16} />, href: "/knowledge" },
  { label: "Integrations", icon: <Settings size={16} />, href: "/integrations" },
];

const projectNav: NavItem[] = [
  { label: "Business Profile", icon: <Briefcase size={16} />, href: "/profile", projectScoped: true },
  { label: "Marketing Plan", icon: <Sparkles size={16} />, href: "/plan", projectScoped: true },
  { label: "Keywords", icon: <Search size={16} />, href: "/keywords", projectScoped: true },
  { label: "Competitors", icon: <Target size={16} />, href: "/competitors", projectScoped: true },
  { label: "Content Studio", icon: <FileText size={16} />, href: "/content", projectScoped: true },
  { label: "Leads & CRM", icon: <Users size={16} />, href: "/leads", projectScoped: true },
  { label: "Campaigns", icon: <TrendingUp size={16} />, href: "/campaigns", projectScoped: true },
  { label: "SEO & Backlinks", icon: <Link2 size={16} />, href: "/seo", projectScoped: true },
  { label: "WhatsApp", icon: <MessageCircle size={16} />, href: "/whatsapp", projectScoped: true },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { activeProjectId, setActiveProjectId } = useProject();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap size={20} className="text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Loading Nexus AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please sign in to continue</p>
          <Button onClick={() => startLogin()}>Sign In</Button>
        </div>
      </div>
    );
  }

  const activeProject = projects?.find((p) => p.id === activeProjectId);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={16} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Nexus AI</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            {/* Global nav */}
            {globalNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className={cn("nav-item", location === item.href && "active")}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            <Separator className="my-3 bg-sidebar-border" />

            {/* Project selector */}
            <div className="px-3 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Projects
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent text-sm font-medium text-foreground transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {activeProject ? (
                        <>
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: activeProject.color || "#6366f1" }}
                          />
                          <span className="truncate">{activeProject.name}</span>
                        </>
                      ) : (
                        <>
                          <Layers size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Select project</span>
                        </>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {projectsLoading ? (
                    <div className="p-2 space-y-1">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <>
                      {projects?.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => setActiveProjectId(p.id)}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.color || "#6366f1" }}
                          />
                          <span className="truncate">{p.name}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/projects/new">
                          <Plus size={14} className="mr-2" />
                          New Project
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Project-scoped nav */}
            {activeProjectId && (
              <div className="space-y-0.5">
                {projectNav.map((item) => {
                  const href = `/projects/${activeProjectId}${item.href}`;
                  return (
                    <Link key={item.href} href={href}>
                      <div className={cn("nav-item", location === href && "active")}>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!activeProjectId && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  Select or create a project to access all tools
                </p>
                <Link href="/projects/new">
                  <Button size="sm" className="w-full gap-2 btn-glow">
                    <Plus size={14} />
                    New Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
                <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                <LogOut size={14} className="mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Floating AI Assistant */}
      <AIAssistant projectId={activeProjectId} />
    </div>
  );
}

function AIAssistant({ projectId }: { projectId: number | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = trpc.knowledge.ask.useMutation({
    onSuccess: (data: any) => {
      const text = typeof data === "string" ? data : data?.answer || "I'm here to help with your marketing questions!";
      setMessages(m => [...m, { role: "ai", text }]);
    },
    onError: () => setMessages(m => [...m, { role: "ai", text: "Sorry, I couldn't process that. Please try again." }]),
  });

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages(m => [...m, { role: "user", text: q }]);
    setInput("");
    ask.mutate({ projectId: projectId || 0, question: q });
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 w-80 h-96 card-premium flex flex-col z-50 shadow-2xl animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                <Bot size={13} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">AI Marketing Advisor</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">Ask me anything about marketing strategy, SEO, campaigns, or your leads!</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("text-xs rounded-lg px-3 py-2 max-w-[90%]", m.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-foreground")}>
                {m.text.substring(0, 300)}{m.text.length > 300 ? "..." : ""}
              </div>
            ))}
            {ask.isPending && <div className="bg-muted text-muted-foreground text-xs rounded-lg px-3 py-2 w-16">Thinking...</div>}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask a marketing question..." className="flex-1 bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50" />
            <button onClick={send} disabled={!input.trim() || ask.isPending}
              className="px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform z-50">
        <Bot size={20} />
      </button>
    </>
  );
}
