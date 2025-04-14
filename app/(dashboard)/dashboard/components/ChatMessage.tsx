import { Button } from "@/_components/ui/button";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
} from "@/_components/ui/message";
import { ResponseStream, useTextStream } from "@/_components/ui/response-stream";
import { Copy, Delete, RefreshCcw } from "lucide-react";

export interface ChatMessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageType;
  isLastAssistantMessage: boolean;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: () => void;
}

export function ChatMessage({
  message,
  isLastAssistantMessage,
  onCopy,
  onDelete,
  onRegenerate,
}: ChatMessageProps) {
  return (
    <Message className="group">
      <div className="flex gap-3">
        {message.role === "user" ? (
          <MessageAvatar src="" alt="User" fallback="U" className="bg-secondary" />
        ) : (
          <MessageAvatar src="/favicon.svg" alt="AI Assistant" className="ring-1 ring-primary/20" />
        )}
        <div className="flex-1">
          <div className="flex-row relative group">
            <MessageContent
              className="font-mono text-sm border border-dashed hover:border-primary/50 transition-colors prose-h2:!mt-0 prose-h2:!scroll-m-0"
              markdown
            >
              {message.content}
            </MessageContent>

            

            <MessageActions className="flex justify-between w-full">
              {/* Left side with timestamp */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="font-mono">
                {message.role === "user" ? "you" : "sqlito"} •{" "}
                {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                })}
              </span>
              </div>
              
              {/* Right side with action buttons */}
              <div className="flex items-center gap-1">
              <MessageAction tooltip="Copy message">
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onCopy(message.content)}
                className="h-6 w-6 hover:bg-primary/10"
                >
                <Copy className="h-3 w-3" />
                </Button>
              </MessageAction>
              <MessageAction tooltip="Delete message">
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(message.id)}
                className="h-6 w-6 hover:bg-destructive/10"
                >
                <Delete className="h-3 w-3" />
                </Button>
              </MessageAction>
              {message.role === "assistant" && isLastAssistantMessage && (
                <MessageAction tooltip="Regenerate response">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRegenerate}
                  className="h-6 w-6 hover:bg-primary/10"
                >
                  <RefreshCcw className="h-3 w-3" />
                </Button>
                </MessageAction>
              )}
              </div>
            </MessageActions>
          </div>

          
        </div>
      </div>
    </Message>
  );
}
