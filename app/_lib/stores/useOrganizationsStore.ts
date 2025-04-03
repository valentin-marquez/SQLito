import { create } from "zustand";
import type { Organization } from "../types/supabase-api";

interface OrganizationsState {
  organizations: Organization[];
  selectedOrganizationId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setOrganizations: (organizations: Organization[]) => void;
  selectOrganization: (id: string | null) => void;
  fetchOrganizations: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  organizations: [],
  selectedOrganizationId: null,
  loading: false,
  error: null,

  setOrganizations: (organizations) => set({ organizations }),

  selectOrganization: (id) => set({ selectedOrganizationId: id }),

  fetchOrganizations: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch("/api/supabase/organizations");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch organizations");
      }

      const organizations = await response.json();
      set({ organizations, loading: false });

      // If we have organizations and none is selected, select the first one
      if (organizations.length > 0 && !get().selectedOrganizationId) {
        set({ selectedOrganizationId: organizations[0].id });
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch organizations",
        loading: false,
      });
    }
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
