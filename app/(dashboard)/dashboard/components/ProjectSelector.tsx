import { Loader } from "@/_components/ui/loader";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { useDatabaseStore, useProjectsStore } from "@/_lib/stores";
import type { Project } from "@/_lib/types/supabase-api";
import { Key } from "lucide-react";
import { useEffect } from "react";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectRef: string | null;
  isLoading: boolean;
  onChange: (projectRef: string) => void;
}

export function ProjectSelector({
  projects,
  selectedProjectRef,
  isLoading,
  onChange,
}: ProjectSelectorProps) {
  // Find the currently selected project using id
  const selectedProject = projects.find((p) => p.id === selectedProjectRef);
  const dbProjectRef = useDatabaseStore((state) => state.projectRef);

  // Debug project list and selection
  useEffect(() => {
    console.log("ProjectSelector render:", {
      projectCount: projects.length,
      selectedProjectRef,
      dbProjectRef,
      projects: projects.map((p) => ({ name: p.name, id: p.id })),
    });
  }, [projects, selectedProjectRef, dbProjectRef]);

  // Ensure the database store and projects store are in sync
  useEffect(() => {
    if (selectedProjectRef && dbProjectRef !== selectedProjectRef) {
      console.log("Syncing database store projectRef from ProjectSelector:", selectedProjectRef);
      useDatabaseStore.getState().setProjectRef(selectedProjectRef);
    }
  }, [selectedProjectRef, dbProjectRef]);

  const handleProjectChange = (id: string) => {
    console.log("Project selected in dropdown:", id);
    onChange(id);

    // Also directly update database store as a fallback
    useDatabaseStore.getState().setProjectRef(id);
  };

  return (
    <div className="relative group">
      <Select
        value={selectedProjectRef || ""}
        onValueChange={handleProjectChange}
        disabled={isLoading}
      >
        <SelectTrigger
          className={`w-[150px] h-8 text-xs font-mono ${
            !selectedProjectRef
              ? "border-dashed border-2 border-red-500 animate-pulse bg-red-500/5"
              : "border-dashed"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader />
              <span>Loading...</span>
            </div>
          ) : selectedProject ? (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate">{selectedProject.name}</span>
              <span className="text-muted-foreground text-[9px] truncate">
                {selectedProject.id}
              </span>
            </div>
          ) : (
            <SelectValue placeholder="Select a project" />
          )}
        </SelectTrigger>
        <SelectContent className="font-mono text-xs max-h-60 overflow-y-auto">
          {projects.length === 0 && !isLoading ? (
            <div className="p-2 text-center text-muted-foreground">No projects found</div>
          ) : (
            <>
              <SelectGroup>
                <SelectLabel className="px-2 py-1.5 text-[10px] flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  <span>Password required for connection</span>
                </SelectLabel>
                {projects.map((project) => (
                  <SelectItem key={`project-${project.id}`} value={project.id} className="py-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground text-[10px] truncate">
                        {project.id}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
