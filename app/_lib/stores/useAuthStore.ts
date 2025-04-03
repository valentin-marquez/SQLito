import Cookies from "js-cookie";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setAuthenticated: (isAuthenticated: boolean) => void;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loading: false,
      error: null,

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      checkAuth: async () => {
        try {
          set({ loading: true });

          // Check if we have auth status cookie
          const authStatus = Cookies.get("sqlito_auth_status");

          if (authStatus === "authenticated") {
            // We're authenticated via cookie
            set({ isAuthenticated: true, loading: false });
            return true;
          }

          // Otherwise try to refresh the token
          const response = await fetch("/api/auth/refresh");

          if (!response.ok) {
            set({ isAuthenticated: false, loading: false });
            return false;
          }

          const data = await response.json();

          if (data.success) {
            // Token refreshed successfully
            set({ isAuthenticated: true, loading: false });
            return true;
          }
          set({ isAuthenticated: false, loading: false });
          return false;
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            isAuthenticated: false,
            loading: false,
            error: error instanceof Error ? error.message : "Authentication check failed",
          });
          return false;
        }
      },

      logout: async () => {
        try {
          // Call server-side logout to clear HTTP-only cookies
          await fetch("/api/auth/logout");

          // Clear client-side cookie
          Cookies.remove("sqlito_auth_status");

          set({ isAuthenticated: false, error: null });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: "sqlito-auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
