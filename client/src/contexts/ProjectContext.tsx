import { createContext, useContext, useState, ReactNode } from "react";

interface ProjectContextType {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProjectId: null,
  setActiveProjectId: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  return (
    <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
