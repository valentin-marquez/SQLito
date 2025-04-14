import { Button } from "@/_components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/_components/ui/prompt-input";
import { useSQLChat } from "@/_lib/hooks/useSQLChat";
import { useDatabaseStore, useProjectsStore } from "@/_lib/stores";
import { cn } from "@/_lib/utils";
import { CircleHelp, Send, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProjectSelector } from "./ProjectSelector";

export function InputArea() {
  const { setApiKeyModalOpen, anthropicApiKey, clearMessages } = useDatabaseStore();

  const {
    projects,
    selectedProjectRef,
    loading: projectsLoading,
    selectProject,
  } = useProjectsStore();

  const { input, setInput, handleInputChange, handleSubmit, messages, status, isChatReady } =
    useSQLChat();

  const isLoading = status === "streaming" || status === "submitted";
  const chatIsEmpty = messages.length === 0 && !isLoading;

  const handleProjectChange = (projectId: string) => {
    console.log("Handling project change in InputArea:", projectId);
    selectProject(projectId);
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
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
        onChange={handleInputChange}
        disabled={!selectedProjectRef || isLoading}
      />
      <PromptInputActions className="flex items-center justify-between gap-2 pt-2 px-3 border-t border-dashed mt-2">
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

        <div className="flex items-center gap-2">
          <PromptInputAction tooltip="Select project">
            <ProjectSelector
              projects={projects}
              selectedProjectRef={selectedProjectRef}
              isLoading={projectsLoading}
              onChange={handleProjectChange}
            />
          </PromptInputAction>
          <PromptInputAction tooltip={!selectedProjectRef ? "Select a project first" : "Send"}>
            <Button
              type="submit"
              disabled={
                !input.trim() ||
                isLoading ||
                !anthropicApiKey ||
                !selectedProjectRef ||
                projectsLoading
              }
              size="icon"
              className={cn(
                "rounded-none transition-colors",
                !selectedProjectRef
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
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
