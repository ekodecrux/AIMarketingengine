import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrencySymbol } from "../../../shared/types";

interface ProjectContextType {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  currency: string;           // e.g. "INR"
  currencySymbol: string;     // e.g. "₹"
  setCurrency: (code: string) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProjectId: null,
  setActiveProjectId: () => {},
  currency: "USD",
  currencySymbol: "$",
  setCurrency: () => {},
});

const STORAGE_KEY = "nexusai_project_state";

function loadState(): { projectId: number | null; currency: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { projectId: null, currency: "USD" };
}

function saveState(projectId: number | null, currency: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectId, currency }));
  } catch {}
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const saved = loadState();
  const [activeProjectId, setActiveProjectIdState] = useState<number | null>(saved.projectId);
  const [currency, setCurrencyState] = useState<string>(saved.currency || "USD");

  const setActiveProjectId = (id: number | null) => {
    setActiveProjectIdState(id);
    saveState(id, currency);
  };

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    saveState(activeProjectId, code);
  };

  // Keep localStorage in sync whenever either changes
  useEffect(() => {
    saveState(activeProjectId, currency);
  }, [activeProjectId, currency]);

  return (
    <ProjectContext.Provider value={{
      activeProjectId,
      setActiveProjectId,
      currency,
      currencySymbol: getCurrencySymbol(currency),
      setCurrency,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
