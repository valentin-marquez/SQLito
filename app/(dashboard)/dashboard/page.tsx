"use client";

import { ApiKeyModal } from "@/_components/api-key-modal";
import { ProjectPasswordModal } from "@/_components/project-password-modal";
import {
  useAuthStore,
  useDatabaseStore,
  useOrganizationsStore,
  useProjectsStore,
} from "@/_lib/stores";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatArea, InputArea, LoadingScreen, SetupScreen, WelcomeScreen } from "./components";

export default function ChatPage() {
  const router = useRouter();

  // Use Zustand stores
  const { isAuthenticated, loading: authLoading, checkAuth } = useAuthStore();
  const { selectedOrganizationId, fetchOrganizations } = useOrganizationsStore();
  const {
    projects,
    selectedProjectRef,
    loading: projectsLoading,
    fetchProjects,
    selectProject,
  } = useProjectsStore();
  const {
    messages,
    isLoadingMessage,
    anthropicApiKey,
    apiKeyModalOpen,
    passwordModalOpen,
    setApiKeyModalOpen,
    sendMessage,
    copyMessageToClipboard,
    deleteMessage,
    regenerateResponse,
    clearMessages,
    handleApiKeySubmit,
  } = useDatabaseStore();

  const chatIsEmpty = messages.length === 0 && !isLoadingMessage;

  // Check authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isAuthed = await checkAuth();
        if (!isAuthed) {
          console.log("Authentication failed, redirecting to login");
          router.push("/");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/");
      }
    };

    verifyAuth();
  }, [router, checkAuth]);

  // Once authenticated, load organizations
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchOrganizations();
  }, [authLoading, isAuthenticated, fetchOrganizations]);

  // Once we have an organization selected, load its projects
  useEffect(() => {
    if (!selectedOrganizationId) return;
    fetchProjects(selectedOrganizationId);
  }, [selectedOrganizationId, fetchProjects]);

  // Remove the auto-selection effect that selects the initial project
  useEffect(() => {
    // Removed automatic selection
    // selectInitialProject() - don't call this anymore
  }, [projects]);

  // Check if API key is configured
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (!anthropicApiKey) {
      setApiKeyModalOpen(true);
    }
  }, [authLoading, isAuthenticated, anthropicApiKey, setApiKeyModalOpen]);

  // Enhanced debugging for project and database synchronization
  useEffect(() => {
    console.log("State check:", {
      projectStoreRef: selectedProjectRef,
      dbStoreRef: useDatabaseStore.getState().projectRef,
      connectionString: useDatabaseStore.getState().connectionString ? "exists" : "none",
      projectsCount: projects.length,
    });

    // If there's a mismatch between stores, fix it
    const dbRef = useDatabaseStore.getState().projectRef;
    if (selectedProjectRef && dbRef !== selectedProjectRef) {
      console.log("Fixing store mismatch - updating database store:", selectedProjectRef);
      useDatabaseStore.getState().setProjectRef(selectedProjectRef);
    } else if (!selectedProjectRef && dbRef) {
      console.log("Fixing store mismatch - updating project store:", dbRef);
      selectProject(dbRef);
    }
  }, [selectedProjectRef, projects]);

  // Handle initial project selection when projects are loaded - don't auto-select
  useEffect(() => {
    if (!projects.length) return;

    console.log("Projects loaded check:", {
      count: projects.length,
      selectedRef: selectedProjectRef,
      dbRef: useDatabaseStore.getState().projectRef,
      firstProject: projects[0] ? { id: projects[0].id, name: projects[0].name } : null,
    });

    // Don't auto-select projects - require user to make an explicit choice
    // Previous auto-selection code removed
  }, [projects]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  // If no API key is configured, show a message
  if (!anthropicApiKey && !apiKeyModalOpen) {
    return <SetupScreen onConfigure={() => setApiKeyModalOpen(true)} />;
  }

  return (
    <>
      <ApiKeyModal
        open={apiKeyModalOpen}
        onClose={(newApiKey?: string) => {
          if (newApiKey) {
            handleApiKeySubmit(newApiKey);
          } else {
            setApiKeyModalOpen(false);
          }
        }}
      />

      <ProjectPasswordModal
        open={passwordModalOpen}
        onClose={() => useDatabaseStore.getState().setPasswordModalOpen(false)}
      />

      <div className="flex flex-col h-screen w-full relative">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full filter blur-3xl" />
        </div>

        {/* Main content container */}
        <div className={`flex flex-col h-full ${chatIsEmpty ? "justify-center" : ""}`}>
          {/* Chat Area - Only render when we have messages */}
          {!chatIsEmpty && <ChatArea />}

          {/* Input Area with integrated terminal elements */}
          <div
            className={`
              transition-all duration-300 ease-in-out relative z-10
              ${
                chatIsEmpty ? "p-4" : "border-t border-dashed bg-background/80 backdrop-blur-sm p-4"
              }
            `}
          >
            <div
              className={`
                max-w-2xl w-full mx-auto
                ${chatIsEmpty ? "transform scale-110" : ""}
              `}
            >
              {chatIsEmpty && <WelcomeScreen />}
              <InputArea onSend={sendMessage} />

              <div className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground text-center font-mono border border-dashed p-2 bg-muted/30">
                  Ask questions in natural language and Sqlito will automatically generate Supabase
                  reports
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4 font-mono">
                SQLito - Business Intelligence for executives with no technical knowledge
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
