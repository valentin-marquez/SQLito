import { anthropic } from "@ai-sdk/anthropic";
import {
  InvalidToolArgumentsError,
  Message,
  NoSuchToolError,
  StreamData,
  ToolExecutionError,
  createDataStreamResponse,
  experimental_createMCPClient,
  streamText,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import { cookies } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";

// Define schema for request validation
const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "data"]),
      content: z.string(),
      id: z.string().optional(),
      name: z.string().optional(),
    })
  ),
  apiKey: z.string().min(1, "API key is required"),
  projectRef: z.string().min(1, "Project reference is required"),
});

export async function POST(req: Request) {
  try {
    // 1. Parse and validate request using Zod
    const body = await req.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues.map((issue) => issue.message).join(", ");
      return Response.json({ error: errorMessage }, { status: 400 });
    }

    const { messages, apiKey, projectRef } = result.data;

    // Extract the last user message
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
    if (!lastUserMessage) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    const query = lastUserMessage.content;

    // 2. Get Supabase access token from cookies
    const accessToken = (await cookies()).get("supabase_access_token")?.value;
    if (!accessToken) {
      return Response.json({ error: "Not authenticated with Supabase" }, { status: 401 });
    }

    // 3. Initialize Supabase MCP Client
    const isDevelopment = process.env.NODE_ENV === "development";

    const transport = new Experimental_StdioMCPTransport({
      command: isDevelopment ? "cmd" : "npx",
      args: isDevelopment
        ? ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--access-token", accessToken]
        : ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", accessToken],
    });

    const mcpClient = await experimental_createMCPClient({
      transport,
    });

    const tools = await mcpClient.tools({
      schemas: {
        list_tables: {
          parameters: z.object({
            project_id: z.string().describe("Supabase project ID"),
            schema: z.optional(z.string()).default("public").describe("Schema name"),
          }),
        },
        execute_sql: {
          parameters: z.object({
            project_id: z.string().describe("Supabase project ID"),
            query: z.string().describe("SQL query to execute"),
          }),
        },
      },
    });

    // 4. Create a detailed system prompt that aligns with SQLito's purpose and branding
    const systemPrompt = `
    # SQLito Assistant

You're SQLito, a friendly Supabase BI assistant for non-technical business users.

## Personality
- Friendly and approachable
- Clear and jargon-free
- Helpful and patient

## Workflow
1. Use "{0}" to discover available tables in project: "list_tables"
2. Create simple SQL based on user questions
3. Execute queries with "execute_sql" using project ID: "${projectRef}"
4. Present results in business-friendly format

## When Showing Results
- Always respond using Markdown formatting
- Briefly explain what you found
- Always show the SQL you generated in a code block with SQL syntax highlighting
- Format results in Markdown tables with headers
- Provide business interpretation
- Suggest follow-ups when helpful

Remember: You're helping people who understand their business but not SQL. Your job is making data accessible to everyone.`;

    let stepCount = 0;

    // Return the response - MCP client will be closed in the finally block
    return createDataStreamResponse({
      onError: (error) => {
        return error instanceof Error ? error.message : String(error);
      },
      execute: (dataStream) => {
        const result = streamText({
          // claude-3-5-sonnet-20241022
          model: anthropic("claude-3-7-sonnet-20250219"),
          system: systemPrompt,
          prompt: query,
          tools,
          temperature: 0.2,
          experimental_activeTools: ["list_tables", "execute_sql"],
          maxTokens: 4000,
          maxSteps: 5,
          onStepFinish: async ({ text, toolCalls, toolResults, finishReason, stepType }) => {
            stepCount++;

            if (stepType === "initial" || stepType === "continue") {
              dataStream.writeData({
                type: "text-update",
                content: text,
                stepNumber: stepCount,
              });
            }

            if (toolCalls.length > 0) {
              const formattedToolResults = toolCalls.map((call, index) => {
                // Better handling of result extraction with fallbacks
                let resultContent = "No result";
                let isError = false;

                if (toolResults[index]) {
                  const result = toolResults[index].result;

                  if (Array.isArray(result)) {
                    // Try different ways of extracting content
                    if (result[0]?.text) {
                      resultContent = result[0].text;
                    } else if (result[0]?.value) {
                      resultContent = result[0].value;
                    } else if (typeof result[0] === "string") {
                      resultContent = result[0];
                    }
                  } else if (typeof result === "string") {
                    resultContent = result;
                  } else if (result !== undefined) {
                    resultContent = JSON.stringify(result);
                  }

                  isError = result && typeof result === "object" && "error" in result;
                }

                // Try to parse JSON results for better handling
                try {
                  if (resultContent && resultContent !== "No result") {
                    const resultObj = JSON.parse(resultContent);
                    if (resultObj.error) {
                      isError = true;
                    }
                  }
                } catch (e) {
                  // Non-JSON result, continue with raw content
                }

                // Final format for client
                return {
                  toolName: call.toolName,
                  args: call.args,
                  result: resultContent,
                  isError: isError,
                };
              });

              dataStream.writeData({
                type: "tool-execution",
                stepNumber: stepCount,
                toolCalls: formattedToolResults,
                finishReason,
              });
            }

            dataStream.writeData({
              type: "step-progress",
              stepNumber: stepCount,
              stepType,
              hasToolCalls: toolCalls.length > 0,
              toolsUsed: toolCalls.map((call) => call.toolName),
              finishReason,
            });
          },
          onFinish: async ({ steps }) => {
            const totalToolCalls = steps.flatMap((step) => step.toolCalls).length;

            dataStream.writeData({
              type: "conversation-summary",
              stepCount,
              toolCallCount: totalToolCalls,
              completed: true,
            });
          },
        });
        result.consumeStream();

        return result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
