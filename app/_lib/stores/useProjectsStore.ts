import { create } from "zustand";
import type { Project, Secret } from "../types/supabase-api";
import { useDatabaseStore } from "./useDatabaseStore";
import { useOrganizationsStore } from "./useOrganizationsStore";

interface ProjectsState {
  projects: Project[];
  selectedProjectRef: string | null; // Keep name for backward compatibility
  selectedProjectDetails: Project | null;
  projectSecrets: Secret[];
  loading: boolean;
  error: string | null;
  lastFetchedOrganizationId: string | null; // Track last fetched org
  defaultProjectSelected: boolean; // Track if default project was selected

  // Actions
  setProjects: (projects: Project[]) => void;
  selectProject: (ref: string | null) => void;
  setSelectedProjectDetails: (project: Project | null) => void;
  setProjectSecrets: (secrets: Secret[]) => void;
  setDefaultProjectSelected: (selected: boolean) => void;

  fetchProjects: (organizationId?: string) => Promise<void>;
  fetchProjectDetails: (projectRef: string) => Promise<void>;
  fetchProjectSecrets: (projectRef: string) => Promise<void>;
  getSelectedProject: () => Project | null;
  selectInitialProject: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectRef: null,
  selectedProjectDetails: null,
  projectSecrets: [],
  loading: false,
  error: null,
  lastFetchedOrganizationId: null,
  defaultProjectSelected: false,

  setProjects: (projects) => set({ projects }),

  selectProject: (projectId) => {
    if (projectId === get().selectedProjectRef) return;

    console.log("Selecting project:", projectId);
    set({ selectedProjectRef: projectId });

    // Explicitly set projectRef in the database store
    if (projectId) {
      const dbStore = useDatabaseStore.getState();

      // Use the new dedicated method to set projectRef
      dbStore.setProjectRef(projectId);
    }
  },

  setSelectedProjectDetails: (project) => set({ selectedProjectDetails: project }),

  setProjectSecrets: (secrets) => set({ projectSecrets: secrets }),

  setDefaultProjectSelected: (selected) => set({ defaultProjectSelected: selected }),

  selectInitialProject: () => {
    // Don't automatically select the first project
    // The user must explicitly select a project
    return;
  },

  fetchProjects: async (organizationId) => {
    try {
      const orgId =
        organizationId || useOrganizationsStore.getState().selectedOrganizationId || "all";

      // Skip fetch if we're already loading or we already fetched this org's projects
      if (
        get().loading ||
        (get().lastFetchedOrganizationId === orgId && get().projects.length > 0)
      ) {
        return;
      }

      set({ loading: true, error: null });

      const response = await fetch(`/api/supabase/projects/${orgId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch projects");
      }

      const projects = await response.json();

      // Log the fetched projects for debugging
      console.log(`Fetched ${projects.length} projects:`, projects);

      set({
        projects,
        loading: false,
        lastFetchedOrganizationId: orgId,
        // Reset defaultProjectSelected when fetching new projects for a different org
        defaultProjectSelected: false,
      });

      // Removed auto-selection of first project - require user to select explicitly
    } catch (error) {
      console.error("Error fetching projects:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch projects",
        loading: false,
      });
    }
  },

  fetchProjectDetails: async (projectRef) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`/api/supabase/project/${projectRef}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch project details");
      }

      const projectDetails = await response.json();
      set({ selectedProjectDetails: projectDetails, loading: false });
    } catch (error) {
      console.error("Error fetching project details:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch project details",
        loading: false,
      });
    }
  },

  fetchProjectSecrets: async (projectRef) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`/api/supabase/project/secrets/${projectRef}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch project secrets");
      }

      const secrets = await response.json();
      set({ projectSecrets: secrets, loading: false });
    } catch (error) {
      console.error("Error fetching project secrets:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch project secrets",
        loading: false,
      });
    }
  },

  // Utility to get the currently selected project object
  getSelectedProject: () => {
    const { projects, selectedProjectRef } = get();
    return projects.find((project) => project.id === selectedProjectRef) || null;
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
