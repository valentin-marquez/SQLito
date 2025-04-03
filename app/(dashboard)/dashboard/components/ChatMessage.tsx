import { Button } from "@/_components/ui/button";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
} from "@/_components/ui/message";
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
          <div className="relative group">
            <MessageContent
              markdown={true}
              className="font-mono text-sm border border-dashed hover:border-primary/50 transition-colors"
            >
              {message.content}
            </MessageContent>

            <MessageActions className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border/50 rounded-none p-0.5 shadow-sm">
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

          <div className="flex items-center gap-2 mt-1 opacity-50 text-xs">
            <span className="font-mono text-muted-foreground">
              {message.role === "user" ? "you" : "sqlito"} •{" "}
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </Message>
  );
}
