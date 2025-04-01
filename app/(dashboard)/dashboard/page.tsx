"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Button } from "@/_components/ui/button";
import { Loader } from "@/_components/ui/loader";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
} from "@/_components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/_components/ui/prompt-input";
import { ScrollButton } from "@/_components/ui/scroll-button";
import {
  CircleHelp,
  Copy,
  Delete,
  Info,
  MicIcon,
  RefreshCcw,
  Send,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { ApiKeyModal } from "@/_components/api-key-modal"; // We import the component we just created
import { ThemeSelector } from "@/_components/theme-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import {
  availableDatabases,
  databasesLoading,
  fetchDatabases,
  selectDatabase,
  selectedDatabaseId,
} from "@/_lib/stores/database";
import { useStore } from "@nanostores/react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Basic types
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  const $availableDatabases = useStore(availableDatabases);

  console.log("Available databases:", $availableDatabases);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatIsEmpty = messages.length === 0 && !isLoading;

  // Add these new functions for message actions
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const regenerateResponse = async () => {
    if (messages.length === 0) return;

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
    if (!lastUserMessage) return;

    // Remove the last assistant message if it exists
    const filteredMessages = messages.filter(
      (msg) => !(msg.role === "assistant" && messages.indexOf(msg) === messages.length - 1)
    );

    setMessages(filteredMessages);
    setIsLoading(true);

    // Re-send the last user message to get a new response
    await sendMessage(lastUserMessage.content);
  };

  // Check authentication and API key on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get user info using the refresh endpoint which will fail if not authenticated
        const response = await fetch("/api/auth/refresh");
        const data = await response.json();

        if (!data.success) {
          router.push("/");
          return;
        }

        // Check if we have an API key stored
        const storedApiKey = localStorage.getItem("anthropic_api_key");
        if (storedApiKey) {
          setApiKey(storedApiKey);

          // after api key is set, try load databases
          // get from cookies supabase_access_token
          const supabaseToken = data.cookies.access_token.value;
          if (supabaseToken) {
            // Assuming this comes from the refresh endpoint
            await fetchDatabases(supabaseToken);
          }
        } else {
          // No API key found, show the modal
          setIsApiKeyModalOpen(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle API key modal closure
  const handleApiKeyModalClose = (newApiKey?: string) => {
    if (newApiKey) {
      setApiKey(newApiKey);
    }
    setIsApiKeyModalOpen(false);
  };

  // Simulate sending message to backend with Claude API integration
  const sendMessage = async (content: string) => {
    if (!content.trim() || !apiKey) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    try {
      // In a real environment, here would go the call to Claude API
      // using the apiKey for authentication
      // const response = await fetch("/api/query", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "X-API-Key": apiKey
      //   },
      //   body: JSON.stringify({ query: content })
      // });
      // const data = await response.json();

      // Simulating the response after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Analyzing your query: "${content}". Connecting to Supabase database to retrieve the requested information...

\`\`\`sql
-- Automatically generated SQL
SELECT COUNT(*) as total_users 
FROM users 
WHERE created_at >= NOW() - INTERVAL '7 days';
\`\`\`

**Results:**
| total_users |
|-------------|
| 127         |

127 new users have registered on the platform in the last week. This represents a 15% increase compared to the previous week.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Error message in case of failure
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, an error occurred while processing your query. Please try again or check your connection to the Claude API.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Autoscroll to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to clear the chat
  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  // Function to open API key configuration modal
  const openApiKeyConfig = () => {
    setIsApiKeyModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-primary animate-pulse delay-100" />
          <div className="h-3 w-3 bg-primary animate-pulse delay-300" />
          <div className="h-3 w-3 bg-primary animate-pulse delay-500" />
        </div>
      </div>
    );
  }

  // If no API key is configured, show a message
  if (!apiKey && !isApiKeyModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md text-center px-4 py-8 border border-dashed rounded-none">
          <h2 className="text-xl font-mono mb-4">Required Setup</h2>
          <p className="text-sm text-muted-foreground mb-6 font-mono">
            To use SQLito, you need to provide a Claude API key (Anthropic). This key is used to
            process your natural language queries.
          </p>
          <Button onClick={openApiKeyConfig} className="font-mono border border-dashed">
            Configure Claude API
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ApiKeyModal open={isApiKeyModalOpen} onClose={handleApiKeyModalClose} />

      <div className="flex flex-col h-screen w-full relative">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full filter blur-3xl" />
        </div>

        {/* Theme selector - shown when there's no chat */}
        {chatIsEmpty && (
          <div className="fixed top-4 right-4 z-20">
            <div className="p-1 border border-dashed border-sidebar-border rounded-none bg-sidebar/80 backdrop-blur-sm">
              <ThemeSelector />
            </div>
          </div>
        )}

        {/* Main content container - flexes differently based on chat state */}
        <div className={`flex flex-col h-full ${chatIsEmpty ? "justify-center" : ""}`}>
          {/* Chat Area - Only render when we have messages */}
          {!chatIsEmpty && (
            <div ref={containerRef} className="flex-1 overflow-y-auto p-4 relative">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Messages */}
                <div className="space-y-6 pb-20">
                  {messages.map((message) => (
                    <Message key={message.id} className="group">
                      <div className="flex gap-3">
                        {message.role === "user" ? (
                          <MessageAvatar src="" alt="User" fallback="U" className="bg-secondary" />
                        ) : (
                          <MessageAvatar
                            src="/bot-avatar.png"
                            alt="AI Assistant"
                            className="ring-1 ring-primary/20"
                          />
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
                                    onClick={() => copyMessageToClipboard(message.content)}
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
                                    onClick={() => deleteMessage(message.id)}
                                    className="h-6 w-6 hover:bg-destructive/10"
                                  >
                                    <Delete className="h-3 w-3" />
                                  </Button>
                                </MessageAction>
                                {message.role === "assistant" &&
                                  messages.indexOf(message) === messages.length - 1 && (
                                    <MessageAction tooltip="Regenerate response">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={regenerateResponse}
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
                  ))}
                  {isLoading && (
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
                containerRef={containerRef}
                scrollRef={messagesEndRef}
                className="absolute bottom-24 right-8 border border-dashed hover:border-primary"
              />
            </div>
          )}

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
              {chatIsEmpty && (
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 mb-4 relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full filter blur-md" />
                    <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="font-mono font-bold text-2xl text-primary">SQL</div>
                    </div>
                  </div>
                  <h2 className="text-3xl font-mono font-semibold text-primary mb-2 tracking-tight">
                    SQLito
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    database access, simplified
                  </p>

                  {/* Badge to show Claude is connected */}
                  <div className="mt-4 flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono">Claude API connected</span>
                  </div>
                </div>
              )}

              <PromptInput
                value={input}
                onValueChange={setInput}
                isLoading={isLoading}
                onSubmit={() => sendMessage(input)}
                maxHeight={200}
                className="relative rounded-none border border-dashed shadow-sm"
              >
                <PromptInputTextarea
                  placeholder={
                    chatIsEmpty
                      ? "Ask about your data (e.g.: How many users registered this week?)"
                      : "Make another query about your data..."
                  }
                  className="min-h-12 resize-none p-3 pr-12 font-mono"
                />
                <PromptInputActions className="flex items-center justify-between gap-2 pt-2 px-3 pb-3 border-t border-dashed mt-2">
                  {/* left side */}
                  <div className="flex items-center gap-2">
                    {!chatIsEmpty && (
                      <PromptInputAction tooltip="Clear chat">
                        <Button type="button" variant="ghost" size="icon" onClick={clearChat}>
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
                        onClick={openApiKeyConfig}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </PromptInputAction>
                  </div>

                  {/* right side */}
                  <div className="flex items-center gap-2">
                    <PromptInputAction tooltip="Select database">
                      <Select defaultValue="production">
                        <SelectTrigger className="w-[120px] h-8 text-xs border-dashed font-mono">
                          <SelectValue placeholder="Database" />
                        </SelectTrigger>
                        <SelectContent className="font-mono text-xs">
                          <SelectItem value="production">production</SelectItem>
                          <SelectItem value="development">development</SelectItem>
                          <SelectItem value="analytics">analytics</SelectItem>
                        </SelectContent>
                      </Select>
                    </PromptInputAction>
                    <PromptInputAction tooltip="Send">
                      <Button
                        type="submit"
                        disabled={!input.trim() || isLoading || !apiKey}
                        size="icon"
                        className="rounded-none border border-dashed font-mono bg-primary/90 backdrop-blur-sm hover:bg-primary transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </PromptInputAction>
                  </div>
                </PromptInputActions>
              </PromptInput>

              {chatIsEmpty && (
                <p className="text-xs text-muted-foreground text-center mt-4 font-mono border border-dashed p-2 bg-muted/30">
                  Ask questions in natural language and Sqlito will automatically generate Supabase
                  reports
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center mt-4 font-mono">
                Sqlito - Business Intelligence for executives with no technical knowledge
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
