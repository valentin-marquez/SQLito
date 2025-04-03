import { Button } from "@/_components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/_components/ui/prompt-input";
import { useDatabaseStore, useProjectsStore } from "@/_lib/stores";
import { cn } from "@/_lib/utils";
import { CircleHelp, Send, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useState } from "react";
import { ProjectSelector } from "./ProjectSelector";

// Simplified props - only accept optional custom send handler for flexibility
interface InputAreaProps {
  onSend?: (content: string) => Promise<void>;
}

export function InputArea({ onSend }: InputAreaProps = {}) {
  const {
    input,
    setInput,
    isLoadingMessage,
    messages,
    clearMessages,
    sendMessage,
    setApiKeyModalOpen,
    anthropicApiKey,
    hasPasswordForProject,
    setPasswordModalOpen,
    setPendingProjectRef,
  } = useDatabaseStore();

  const {
    projects,
    selectedProjectRef,
    loading: projectsLoading,
    selectProject,
  } = useProjectsStore();

  const chatIsEmpty = messages.length === 0 && !isLoadingMessage;

  // Local state for input height management
  const [textareaHeight, setTextareaHeight] = useState<number>(40);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSend = async () => {
    if (
      !input.trim() ||
      isLoadingMessage ||
      !anthropicApiKey ||
      !selectedProjectRef ||
      projectsLoading
    ) {
      return;
    }

    // Check if we have a password for the selected project
    if (!hasPasswordForProject(selectedProjectRef)) {
      console.log("No password for project, opening password modal");
      // Set the pending project and open the password modal
      setPendingProjectRef(selectedProjectRef);
      setPasswordModalOpen(true);
      // The sendMessage will be triggered after the password is set
      return;
    }

    // Use provided onSend or fallback to store's sendMessage
    const sendFn = onSend || sendMessage;
    await sendFn(input);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Update handler to use the project id
  const handleProjectChange = (projectId: string) => {
    console.log("Handling project change in InputArea:", projectId);
    selectProject(projectId);
  };

  // Check if the selected project has a password
  const hasPassword = selectedProjectRef ? hasPasswordForProject(selectedProjectRef) : false;

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoadingMessage}
      onSubmit={handleSend}
      maxHeight={200}
      className="relative rounded-none border border-dashed shadow-sm"
    >
      <PromptInputTextarea
        placeholder={
          !selectedProjectRef
            ? "Please select a project first →"
            : chatIsEmpty
              ? "Ask about your data (e.g.: How many users registered this week?)"
              : "Make another query about your data..."
        }
        className="min-h-12 resize-none p-3 pr-12 font-mono"
        onKeyDown={handleKeyDown}
        disabled={!selectedProjectRef} // Disable textarea until a project is selected
      />
      <PromptInputActions className="flex items-center justify-between gap-2 pt-2 px-3 border-t border-dashed mt-2">
        {/* left side */}
        <div className="flex items-center gap-2">
          {!chatIsEmpty && (
            <PromptInputAction tooltip="Clear chat">
              <Button type="button" variant="ghost" size="icon" onClick={clearMessages}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          )}
          <PromptInputAction tooltip="Help">
            <Button type="button" variant="ghost" size="icon" asChild>
              <Link href="http://github.com/valentin-marquez/SQLito" target="_blank">
                <CircleHelp className="h-4 w-4" />
              </Link>
            </Button>
          </PromptInputAction>
          <PromptInputAction tooltip="Configure API">
            <Button
              className="cursor-pointer"
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setApiKeyModalOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PromptInputAction>
        </div>

        {/* right side */}
        <div className="flex items-center gap-2">
          <PromptInputAction tooltip="Select project">
            <ProjectSelector
              projects={projects}
              selectedProjectRef={selectedProjectRef}
              isLoading={projectsLoading}
              onChange={handleProjectChange}
            />
          </PromptInputAction>
          <PromptInputAction
            tooltip={
              !selectedProjectRef
                ? "Select a project first"
                : !hasPassword
                  ? "Click to enter database password"
                  : "Send"
            }
          >
            <Button
              type="submit"
              disabled={
                !input.trim() ||
                isLoadingMessage ||
                !anthropicApiKey ||
                !selectedProjectRef ||
                projectsLoading
              }
              size="icon"
              className={cn(
                "rounded-none transition-colors",
                !selectedProjectRef
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : !hasPassword
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "bg-primary/90 backdrop-blur-sm hover:bg-primary text-primary-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </PromptInputAction>
        </div>
      </PromptInputActions>
    </PromptInput>
  );
}
