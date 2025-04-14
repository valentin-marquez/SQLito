import { Loader } from "@/_components/ui/loader";
import { Message, MessageAvatar } from "@/_components/ui/message";
import { ScrollButton } from "@/_components/ui/scroll-button";
import { useSQLChat } from "@/_lib/hooks/useSQLChat";
import { useDatabaseStore } from "@/_lib/stores";
import { type RefObject, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessageType } from "./ChatMessage";

export function ChatArea() {
  const { copyMessageToClipboard, deleteMessage } = useDatabaseStore();
  const { messages, status, reload } = useSQLChat();

  const isLoading = status === "streaming" || status === "submitted";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoscroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Convert AI SDK messages to our ChatMessageType format
  const formattedMessages: ChatMessageType[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant", // Type assertion since we know these are the only roles we use
    content: msg.content,
    timestamp: msg.createdAt || new Date(),
  }));

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 relative">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Messages */}
        <div className="space-y-6 pb-20">
          {formattedMessages.map((message, i) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLastAssistantMessage={
                message.role === "assistant" &&
                i === formattedMessages.findLastIndex((m) => m.role === "assistant")
              }
              onCopy={copyMessageToClipboard}
              onDelete={deleteMessage}
              onRegenerate={() => reload()} // Use reload function from useChat
            />
          ))}

          {isLoading && (
            <Message>
              <div className="flex gap-3">
                <MessageAvatar src="/favicon.svg" alt="AI Assistant" fallback="AI" />
                <div className="flex items-center h-6">
                  <Loader variant="terminal" size="sm" />
                </div>
              </div>
            </Message>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <ScrollButton
        containerRef={containerRef as RefObject<HTMLDivElement>}
        scrollRef={messagesEndRef}
        className="absolute bottom-24 right-8 border border-dashed hover:border-primary"
      />
    </div>
  );
}
