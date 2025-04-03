import { Loader } from "@/_components/ui/loader";
import { Message, MessageAvatar } from "@/_components/ui/message";
import { ScrollButton } from "@/_components/ui/scroll-button";
import { useDatabaseStore } from "@/_lib/stores";
import { type RefObject, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";

export function ChatArea() {
  const { messages, isLoadingMessage, copyMessageToClipboard, deleteMessage, regenerateResponse } =
    useDatabaseStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoscroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 relative">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Messages */}
        <div className="space-y-6 pb-20">
          {messages.map((message, i) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLastAssistantMessage={
                message.role === "assistant" &&
                i === messages.findLastIndex((m) => m.role === "assistant")
              }
              onCopy={copyMessageToClipboard}
              onDelete={deleteMessage}
              onRegenerate={regenerateResponse}
            />
          ))}

          {isLoadingMessage && (
            <Message>
              <div className="flex gap-3">
                <MessageAvatar src="/bot-avatar.png" alt="AI Assistant" fallback="AI" />
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
