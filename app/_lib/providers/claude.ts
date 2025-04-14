
import { generateId, withoutTrailingSlash } from "@ai-sdk/provider-utils";
import { Message, Tool } from "ai";

// Define the model IDs for Claude
export type ClaudeModelId =
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240307"
  | "claude-3-5-sonnet-20240620"
  | "claude-3-7-sonnet-20250219";

// Define settings for the Claude model
export interface ClaudeSettings extends LanguageModelSettings {
  /**
   * Temperature controls randomness: Lowering results in less random completions.
   * As the temperature approaches zero, the model becomes deterministic and repetitive.
   * Higher temperature results in more random completions.
   */
  temperature?: number;

  /**
   * An alternative to sampling with temperature, called nucleus sampling, where the model
   * considers the results of the tokens with top_p probability mass.
   * So 0.1 means only the tokens comprising the top 10% probability mass are considered.
   */
  topP?: number;

  /**
   * The maximum number of tokens that can be generated in the chat completion.
   */
  maxTokens?: number;

  /**
   * A stop sequence is a predefined or user-specified text string that signals an AI to stop generating content.
   */
  stop?: string[];

  /**
   * Anthropic API key. If not provided, the provider will use the API key from the environment variable.
   */
  apiKey?: string;

  /**
   * Number of tool choices that the model can return. If set to 0, the model will not return any tool calls.
   */
  toolChoice?: "none" | "auto" | "required";
}

// Custom Claude LanguageModel implementation
export class ClaudeLanguageModel implements LanguageModelProvider<LLMResult> {
  readonly specificationVersion = "v1";
  readonly provider = "claude.ai";
  readonly modelId: string;
  readonly settings: ClaudeSettings;
  readonly defaultObjectGenerationMode = "json";
  private baseURL: string;
  private apiKey: string | (() => string);

  constructor(
    modelId: ClaudeModelId,
    settings: ClaudeSettings,
    private options: {
      provider: string;
      baseURL: string;
      headers: () => Record<string, string>;
      generateId: () => string;
    }
  ) {
    this.modelId = modelId;
    this.settings = settings || {};
    this.baseURL = options.baseURL;
    this.apiKey = settings.apiKey || ""; // We'll expect this to be provided
  }

  async doGenerate(params: {
    prompt: Message[];
    tools?: Tool[];
    signal?: AbortSignal;
  }): Promise<LLMResult> {
    const { prompt, tools, signal } = params;
    const args = this.getArgs(prompt, tools);

    // Make the API call to Claude
    const response = await abortable(
      fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": typeof this.apiKey === "function" ? this.apiKey() : this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(args),
      }),
      signal
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to generate completion: ${response.status} ${response.statusText}\n${text}`
      );
    }

    const data = await response.json();
    return this.processResponse(data);
  }

  async doStream(params: {
    prompt: Message[];
    tools?: Tool[];
    signal?: AbortSignal;
  }): Promise<AsyncIterable<LLMStreamPart>> {
    const { prompt, tools, signal } = params;
    const args = this.getArgs(prompt, tools, true);

    // Make the API call to Claude with streaming
    const response = await abortable(
      fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": typeof this.apiKey === "function" ? this.apiKey() : this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(args),
      }),
      signal
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to generate completion: ${response.status} ${response.statusText}\n${text}`
      );
    }

    // Process the stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get reader from response");
    }

    let partialData = "";
    let fullContent = "";

    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            try {
              const { done, value } = await reader.read();
              if (done) {
                return { done: true, value: undefined };
              }

              const newText = new TextDecoder().decode(value);
              partialData += newText;

              // Process partial data to extract complete data lines
              const lines = partialData.split("\n");
              partialData = lines.pop() || "";

              const parts: LLMStreamPart[] = [];

              for (let line of lines) {
                line = line.trim();
                if (!line || line === "data: [DONE]") continue;

                if (line.startsWith("data: ")) {
                  try {
                    const dataString = line.slice(6);
                    const data = JSON.parse(dataString);

                    if (data.type === "content_block_delta") {
                      const text = data.delta.text;
                      if (text) {
                        fullContent += text;
                        parts.push({
                          type: "content",
                          content: text,
                          source: StreamPartSource.LLM,
                        });
                      }
                    } else if (data.type === "tool_use" || data.type === "tool_result") {
                      // Handle tool calls and results here
                      if (data.type === "tool_use") {
                        parts.push({
                          type: "tool-call",
                          toolCallId: data.id,
                          toolName: data.name,
                          args: data.input,
                          source: StreamPartSource.LLM,
                        });
                      } else if (data.type === "tool_result") {
                        parts.push({
                          type: "tool-call-result",
                          toolCallId: data.tool_call_id,
                          result: data.content,
                          source: StreamPartSource.Tool,
                        });
                      }
                    } else if (data.type === "message_start" || data.type === "message_delta") {
                      // Handle message metadata
                      if (data.delta?.stop_reason) {
                        parts.push({
                          type: "status",
                          status: LLMStatus.Finished,
                          source: StreamPartSource.LLM,
                        });
                      }
                    }
                  } catch (e) {
                    console.error("Error parsing streaming data", e);
                  }
                }
              }

              if (parts.length === 0) {
                return this.next();
              }

              return { value: parts, done: false };
            } catch (e) {
              throw e;
            }
          },
        };
      },
    };
  }

  private getArgs(prompt: Message[], tools?: Tool[], stream = false) {
    // Map messages format to Claude's format
    const messages = prompt.map((msg) => {
      if (msg.role === "user") {
        return { role: "user", content: msg.content };
      }
      if (msg.role === "assistant") {
        return { role: "assistant", content: msg.content };
      }
      if (msg.role === "system") {
        return { role: "system", content: msg.content };
      }
      return { role: "user", content: String(msg.content) };
    });

    // Map tools format to Claude's format if tools are provided
    let claudeTools;
    if (tools && tools.length > 0) {
      claudeTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));
    }

    // Build the arguments for the API call
    return {
      model: this.modelId,
      messages,
      tools: claudeTools,
      stream,
      max_tokens: this.settings.maxTokens ?? 1024,
      temperature: this.settings.temperature ?? 0.7,
      top_p: this.settings.topP,
      stop_sequences: this.settings.stop,
      tool_choice: this.settings.toolChoice,
    };
  }

  private processResponse(data: any): LLMResult {
    // Process the response from Claude API
    const content = data.content[0]?.text || "";

    // Process tool calls if they exist
    const toolCalls: ToolCall[] = [];
    if (data.tool_calls && data.tool_calls.length > 0) {
      for (const tool of data.tool_calls) {
        toolCalls.push({
          id: tool.id,
          type: "tool-call",
          name: tool.name,
          args: tool.input,
        });
      }
    }

    const parts: LLMResultPart[] = [];

    // Add content part if there's content
    if (content) {
      parts.push({
        type: "content",
        content,
      });
    }

    // Add tool call parts if there are any
    for (const toolCall of toolCalls) {
      parts.push({
        type: "tool-call",
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        args: toolCall.args,
      });
    }

    // Add status part
    parts.push({
      type: "status",
      status: LLMStatus.Finished,
    });

    return {
      id: this.options.generateId(),
      parts,
    };
  }
}

// Define settings for the Claude provider
export interface ClaudeProviderSettings {
  /**
   * Use a different URL prefix for API calls, e.g. to use proxy servers.
   */
  baseURL?: string;

  /**
   * API key.
   */
  apiKey?: string;

  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;

  /**
   * Generate ID function.
   */
  generateId?: () => string;
}

// Define the Claude provider interface
export type ClaudeProvider = (
  modelId: ClaudeModelId,
  settings?: ClaudeSettings
) => ClaudeLanguageModel;

// Provider factory function
export function createClaudeProvider(options: ClaudeProviderSettings = {}): ClaudeProvider {
  const provider = function (modelId: ClaudeModelId, settings: ClaudeSettings = {}) {
    if (new.target) {
      throw new Error("The model factory function cannot be called with the new keyword.");
    }

    return new ClaudeLanguageModel(modelId, settings, {
      provider: "claude.ai",
      baseURL: withoutTrailingSlash(options.baseURL) ?? "https://api.anthropic.com/v1",
      headers: () => ({
        ...(options.headers || {}),
      }),
      generateId: options.generateId ?? generateId,
    });
  };

  return provider;
}

// Default Claude provider instance
export const claude = createClaudeProvider();
