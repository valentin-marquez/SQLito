import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessageType } from "../../(dashboard)/dashboard/components/ChatMessage";
import { decrypt, encrypt } from "../utils/encryption";

interface QueryResult {
  data: unknown[] | null;
  sql: string;
  executionTime: number;
  error: string | null;
  timestamp: number;
}

interface QueryMessage {
  id: string;
  question: string;
  result: QueryResult | null;
  loading: boolean;
  timestamp: number;
}

interface DatabaseState {
  anthropicApiKey: string | null;
  connectionString: string | null;
  dbPasswords: Record<string, string>; // Store passwords by project ID
  projectRef: string | null;
  pendingProjectRef: string | null; // Project waiting for password
  passwordModalOpen: boolean; // Control password modal
  connected: boolean;
  connecting: boolean;
  messages: ChatMessageType[];
  isLoadingMessage: boolean;
  activeMessage: string | null;
  error: string | null;
  apiKeyModalOpen: boolean;
  input: string;

  // Actions
  setAnthropicApiKey: (apiKey: string) => void;
  setDbPassword: (projectId: string, password: string) => void;
  getDbPassword: (projectId: string) => string | null;
  hasPasswordForProject: (projectId: string) => boolean;
  setConnectionString: (connectionString: string | null, projectRef: string | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setPasswordModalOpen: (open: boolean) => void;
  setPendingProjectRef: (projectRef: string | null) => void;
  fetchConnectionString: (projectRef: string) => Promise<string | null>;

  // Chat message actions
  sendMessage: (content: string) => Promise<void>;
  copyMessageToClipboard: (content: string) => void;
  deleteMessage: (id: string) => void;
  regenerateResponse: () => Promise<void>;
  clearMessages: () => void;

  // API key modal actions
  setApiKeyModalOpen: (open: boolean) => void;
  handleApiKeySubmit: (apiKey: string) => void;

  setError: (error: string | null) => void;
  reset: () => void;
  setInput: (value: string) => void;
  setProjectRef: (ref: string | null) => void;
}

export const useDatabaseStore = create<DatabaseState>()(
  persist(
    (set, get) => ({
      anthropicApiKey: null,
      connectionString: null,
      dbPasswords: {}, // Initialize as empty object
      projectRef: null,
      pendingProjectRef: null,
      passwordModalOpen: false,
      connected: false,
      connecting: false,
      messages: [],
      isLoadingMessage: false,
      activeMessage: null,
      error: null,
      apiKeyModalOpen: false,
      input: "",

      setAnthropicApiKey: (apiKey) => set({ anthropicApiKey: apiKey }),

      setDbPassword: (projectId, password) => {
        if (!projectId) return;

        console.log(`Setting password for project ${projectId}`);
        const encryptedPassword = encrypt(password);

        set((state) => ({
          dbPasswords: {
            ...state.dbPasswords,
            [projectId]: encryptedPassword,
          },
        }));

        // If this is the pending project, complete the process
        if (projectId === get().pendingProjectRef) {
          set({
            passwordModalOpen: false,
            projectRef: projectId,
          });

          // Try to fetch connection string now that we have the password
          setTimeout(() => {
            get().fetchConnectionString(projectId);
          }, 100);
        }
      },

      getDbPassword: (projectId) => {
        const encryptedPassword = get().dbPasswords[projectId];
        if (!encryptedPassword) return null;

        return decrypt(encryptedPassword);
      },

      hasPasswordForProject: (projectId) => {
        return !!get().dbPasswords[projectId];
      },

      setPasswordModalOpen: (open) => set({ passwordModalOpen: open }),

      setPendingProjectRef: (projectRef) => set({ pendingProjectRef: projectRef }),

      setConnectionString: (connectionString, projectRef) =>
        set({ connectionString, projectRef, connected: !!connectionString }),

      setConnected: (connected) => set({ connected, connecting: false }),

      setConnecting: (connecting) => set({ connecting }),

      setProjectRef: (ref) => {
        if (!ref) {
          console.warn("Cannot set projectRef: value is null or undefined");
          return;
        }

        console.log("Setting database store projectRef:", ref);

        // Check if we have a password for this project
        if (!get().hasPasswordForProject(ref)) {
          console.log(`No password for project ${ref}, will prompt user`);
          // We need to ask for the password
          set({
            pendingProjectRef: ref,
            passwordModalOpen: true,
          });
          return;
        }

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

        // If we're setting a new project ref, ensure we try to fetch its connection string
        if (ref !== get().projectRef) {
          get().fetchConnectionString(ref);
        }
      },

      fetchConnectionString: async (projectRef) => {
        try {
          if (!projectRef) {
            console.warn("Cannot fetch connection string: No project reference provided");
            return null;
          }

          // Validate projectRef is a string
          if (typeof projectRef !== "string") {
            console.error("Invalid projectRef type:", typeof projectRef);
            return null;
          }

          // Check if we have a password for this project
          if (!get().hasPasswordForProject(projectRef)) {
            console.warn(`No password for project ${projectRef}, opening password modal`);
            set({
              pendingProjectRef: projectRef,
              passwordModalOpen: true,
            });
            return null;
          }

          set({ connecting: true, error: null });

          console.log(`Fetching connection string for project: ${projectRef}`);

          // First try the pgbouncer endpoint to get the connection string with pooler
          try {
            const pgBouncerResponse = await fetch(`/api/supabase/project/${projectRef}/pgbouncer`);

            if (pgBouncerResponse.ok) {
              const pgBouncer = await pgBouncerResponse.json();
              if (pgBouncer.connection_string) {
                const connectionString = pgBouncer.connection_string;
                console.log(
                  "Raw connection string from pgbouncer:",
                  connectionString.replace(/:[^@]*@/, ":***@")
                );

                // Format as postgresql:// instead of postgres://
                let normalizedConnectionString = connectionString;
                if (normalizedConnectionString.startsWith("postgres://")) {
                  normalizedConnectionString = normalizedConnectionString.replace(
                    "postgres://",
                    "postgresql://"
                  );
                }

                // If the string has postgres.PROJECT_REF format, it's already optimized for pooler
                // Otherwise, we should try to convert it
                if (!normalizedConnectionString.includes("postgres.")) {
                  // Extract project ref from hostname or use the provided projectRef
                  const hostnameMatch = normalizedConnectionString.match(
                    /db\.([a-zA-Z0-9]+)\.supabase\.co/
                  );
                  const extractedRef = hostnameMatch ? hostnameMatch[1] : projectRef;

                  // Replace username to include the project ref
                  normalizedConnectionString = normalizedConnectionString.replace(
                    "postgresql://postgres:",
                    `postgresql://postgres.${extractedRef}:`
                  );

                  // Try to convert to pooler hostname (best guess)
                  if (normalizedConnectionString.includes(`db.${extractedRef}.supabase.co`)) {
                    normalizedConnectionString = normalizedConnectionString.replace(
                      `db.${extractedRef}.supabase.co`,
                      `aws-0-us-east-2.pooler.supabase.com`
                    );
                  }
                }

                // Store the normalized connection string
                set({
                  connectionString: normalizedConnectionString,
                  projectRef,
                  connected: true,
                  connecting: false,
                });

                console.log(
                  "Normalized connection string format:",
                  normalizedConnectionString.replace(/:[^@]*@/, ":***@")
                );

                // Insert the password
                const password = get().getDbPassword(projectRef);
                const fullConnectionString = normalizedConnectionString.replace(
                  /:\[YOUR-PASSWORD\]@|:[^@]*@/,
                  `:${password}@`
                );

                console.log("Connection string fetch successful with password inserted");
                return fullConnectionString;
              }
            }
          } catch (error) {
            console.warn(
              "Error fetching pgbouncer config, falling back to standard endpoint",
              error
            );
          }

          // Fall back to standard connection string
          const response = await fetch(`/api/supabase/project/connection-string/${projectRef}`);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch connection string");
          }

          const { connectionString } = await response.json();

          // Insert the password into the connection string
          const password = get().getDbPassword(projectRef);
          const fullConnectionString = connectionString.replace(/:[^@]*@/, `:${password}@`);

          // Store the base connection string
          set({
            connectionString,
            projectRef,
            connected: !!connectionString,
            connecting: false,
          });

          console.log("Connection string fetch successful", {
            hasConnectionString: !!connectionString,
            hasPassword: !!password,
            projectRef,
          });

          return fullConnectionString;
        } catch (error) {
          console.error("Error fetching connection string:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to fetch connection string",
            connecting: false,
            connected: false,
          });
          return null;
        }
      },

      // Chat message actions
      sendMessage: async (content) => {
        const { anthropicApiKey, connectionString, projectRef, dbPasswords } = get();

        if (!content.trim() || !anthropicApiKey || !connectionString || !projectRef) {
          console.warn("Cannot send message:", {
            hasContent: !!content.trim(),
            hasApiKey: !!anthropicApiKey,
            hasConnectionString: !!connectionString,
            hasSelectedProject: !!projectRef,
            hasPassword: projectRef ? get().hasPasswordForProject(projectRef) : false,
          });

          // If we're missing a password, prompt for it
          if (projectRef && !get().hasPasswordForProject(projectRef)) {
            set({
              pendingProjectRef: projectRef,
              passwordModalOpen: true,
            });
          }

          return;
        }

        const userMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: "user",
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoadingMessage: true,
          input: "", // Clear input after sending
        }));

        try {
          // Send the query to the MCP endpoint
          const response = await fetch("/api/query", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Pass the encrypted password map in headers
              "X-Database-Passwords": JSON.stringify(dbPasswords),
            },
            body: JSON.stringify({
              query: content,
              connectionString,
              apiKey: anthropicApiKey,
              projectRef,
            }),
          });

          if (!response.ok) {
            if (!response.body) {
              throw new Error("Empty response from server");
            }

            const errorData = await response.json();
            throw new Error(errorData.error || "Error processing query");
          }

          // Handle streaming response from MCP endpoint
          const reader = response.body?.getReader();
          let receivedText = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              // Convert the chunk to text and append
              const chunk = new TextDecoder().decode(value);
              receivedText += chunk;

              // Create an in-progress message
              const assistantMessage: ChatMessageType = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: receivedText,
                timestamp: new Date(),
              };

              // Update the messages with the current content
              set((state) => {
                // Remove any previous assistant message in progress
                const filteredMessages = state.messages.filter(
                  (msg) =>
                    !(
                      msg.role === "assistant" &&
                      state.messages.indexOf(msg) === state.messages.length - 1
                    )
                );

                // Add the updated message
                return { messages: [...filteredMessages, assistantMessage] };
              });
            }
          }
        } catch (error) {
          console.error("Error sending message:", error);

          // Error message in case of failure
          const errorMessage: ChatMessageType = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Error: ${
              error instanceof Error ? error.message : "Failed to process your query"
            }. Please try again or check your connection settings.`,
            timestamp: new Date(),
          };

          set((state) => ({ messages: [...state.messages, errorMessage] }));
        } finally {
          set({ isLoadingMessage: false });
        }
      },

      copyMessageToClipboard: (content) => {
        navigator.clipboard.writeText(content);
      },

      deleteMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));
      },

      regenerateResponse: async () => {
        const { messages } = get();
        if (messages.length === 0) return;

        // Find the last user message
        const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
        if (!lastUserMessage) return;

        // Remove the last assistant message if it exists
        const filteredMessages = messages.filter(
          (msg) => !(msg.role === "assistant" && messages.indexOf(msg) === messages.length - 1)
        );

        set({ messages: filteredMessages, isLoadingMessage: true });

        // Re-send the last user message to get a new response
        await get().sendMessage(lastUserMessage.content);
      },

      clearMessages: () => set({ messages: [], activeMessage: null }),

      // API key modal actions
      setApiKeyModalOpen: (open) => set({ apiKeyModalOpen: open }),

      handleApiKeySubmit: (apiKey) => {
        set({ anthropicApiKey: apiKey, apiKeyModalOpen: false });
      },

      setError: (error) => set({ error }),

      reset: () =>
        set({
          connectionString: null,
          projectRef: null,
          connected: false,
          connecting: false,
          messages: [],
          activeMessage: null,
          error: null,
          // Don't reset passwords and API key
        }),

      setInput: (value) => set({ input: value }),
    }),
    {
      name: "sqlito-database-storage",
      partialize: (state) => ({
        anthropicApiKey: state.anthropicApiKey,
        connectionString: state.connectionString,
        dbPasswords: state.dbPasswords, // Store passwords
        projectRef: state.projectRef,
        messages: state.messages,
      }),
      // Add onRehydrateStorage to debug localStorage issues
      onRehydrateStorage: () => (state) => {
        console.log("Database store rehydrated from localStorage:", {
          hasApiKey: !!state?.anthropicApiKey,
          hasConnectionString: !!state?.connectionString,
          projectRef: state?.projectRef,
          passwordsCount: state?.dbPasswords ? Object.keys(state.dbPasswords).length : 0,
        });

        // If we have a projectRef from localStorage but no connectionString, try to fetch it
        if (state?.projectRef && !state?.connectionString) {
          console.log("Found projectRef in localStorage but no connectionString, will fetch it");
          // We need to delay this until the store is fully initialized
          setTimeout(() => {
            useDatabaseStore.getState().fetchConnectionString(state.projectRef as string);
          }, 100);
        }
      },
    }
  )
);
