import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { useDatabaseStore, useProjectsStore } from "../stores";

/**
 * Custom hook that wraps useChat from AI SDK to handle SQLito's specific requirements
 */
export function useSQLChat() {
  const { anthropicApiKey, projectRef: dbProjectRef } = useDatabaseStore();
  const { selectedProjectRef } = useProjectsStore();

  // Local state to track initial setup
  const [isInitialized, setIsInitialized] = useState(false);

  // Use the project reference from the projects store (falling back to database store if needed)
  const projectRef = selectedProjectRef || dbProjectRef;

  // Initialize the chat hook from AI SDK
  const chat = useChat({
    api: "/api/chat", // New endpoint that we'll create
    id: `sqlito-chat-${projectRef || "default"}`, // Unique ID based on project
    body: {
      apiKey: anthropicApiKey,
      projectRef,
    },
    onFinish: (message) => {
      console.log("Chat message complete:", message.id);
      console.log(message.role);
      console.log(message.content);
      console.log(message.createdAt);
      console.log(message);
    },
    onError: (error) => {
      console.error(
        "Chat error:",
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
            : String(error)
      );
    },
  });

  // When project or API key changes, mark as initialized after first setting
  useEffect(() => {
    if (anthropicApiKey && projectRef && !isInitialized) {
      setIsInitialized(true);
    }
  }, [anthropicApiKey, projectRef, isInitialized]);

  // Determine if chat is ready to use
  const isChatReady = Boolean(anthropicApiKey && projectRef);

  // Provide a convenience function for sending messages that checks prerequisites
  const sendMessage = async (content: string) => {
    if (!isChatReady || !content.trim()) {
      console.warn("Cannot send message:", {
        hasContent: !!content.trim(),
        isChatReady,
      });
      return;
    }

    return chat.append({
      role: "user",
      content,
    });
  };

  return {
    ...chat,
    sendMessage,
    isChatReady,
    isInitialized,
  };
}
