import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessageType } from "../../(dashboard)/dashboard/components/ChatMessage";

interface DatabaseState {
  anthropicApiKey: string | null;
  projectRef: string | null;
  messages: ChatMessageType[]; // Keep for backwards compatibility
  apiKeyModalOpen: boolean;

  // Actions
  setAnthropicApiKey: (apiKey: string) => void;
  setProjectRef: (ref: string | null) => void;

  // Chat message actions (simplified)
  copyMessageToClipboard: (content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // API key modal actions
  setApiKeyModalOpen: (open: boolean) => void;
  handleApiKeySubmit: (apiKey: string) => void;
}

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      anthropicApiKey: null,
      projectRef: null,
      messages: [], // Keep for compatibility, but will be managed by useChat
      apiKeyModalOpen: false,

      setAnthropicApiKey: (apiKey) => set({ anthropicApiKey: apiKey }),

      setProjectRef: (ref) => {
        if (!ref) {
          console.warn("Cannot set projectRef: value is null or undefined");
          return;
        }

        console.log("Setting database store projectRef:", ref);
        set({ projectRef: ref });

        // Force sync to localStorage immediately
        try {
          const storage = JSON.parse(localStorage.getItem("sqlito-database-storage") || "{}");
          storage.state = storage.state || {};
          storage.state.projectRef = ref;
          localStorage.setItem("sqlito-database-storage", JSON.stringify(storage));
          console.log("Saved projectRef to localStorage:", ref);
        } catch (err) {
          console.error("Failed to manually save projectRef to localStorage:", err);
        }
      },

      // Simplified chat actions (useChat handles most functionality now)
      copyMessageToClipboard: (content) => {
        navigator.clipboard.writeText(content);
      },

      deleteMessage: (id) => {
        // This now just removes from local store
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));

        // Note: To fully implement deletion with useChat, we would need to call setMessages there
      },

      clearMessages: () => set({ messages: [] }),

      // API key modal actions
      setApiKeyModalOpen: (open) => set({ apiKeyModalOpen: open }),

      handleApiKeySubmit: (apiKey) => {
        set({ anthropicApiKey: apiKey, apiKeyModalOpen: false });
      },
    }),
    {
      name: "sqlito-database-storage",
      partialize: (state) => ({
        anthropicApiKey: state.anthropicApiKey,
        projectRef: state.projectRef,
        // No need to store messages locally anymore as useChat will manage them
      }),
      onRehydrateStorage: () => (state) => {
        console.log("Database store rehydrated from localStorage:", {
          hasApiKey: !!state?.anthropicApiKey,
          projectRef: state?.projectRef,
        });
      },
    }
  )
);
