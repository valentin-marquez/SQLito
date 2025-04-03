import {
  createPostgresMCPClient,
  getConnectionStringWithPassword,
  validateNpxAvailability,
} from "@/_lib/utils/mcp";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, connectionString, projectRef, dbPasswords, apiKey } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "No query provided" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!connectionString || !projectRef || !dbPasswords || !apiKey) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Build the full connection string with password
    try {
      // Validate npx availability first
      const npxAvailable = await validateNpxAvailability();
      if (!npxAvailable) {
        throw new Error(
          "The 'npx' command is not available in the current environment. Please ensure Node.js is properly installed."
        );
      }

      // Get the properly formatted connection string
      const fullConnectionString = getConnectionStringWithPassword(
        connectionString,
        projectRef,
        dbPasswords
      );

      console.log("Connection string format:", fullConnectionString);
      console.debug("Setting up MCP client...");

      // Create MCP client with Postgres connection
      const mcpClient = await createPostgresMCPClient(fullConnectionString);

      console.debug("MCP client created, fetching available tools...");
      // Get available tools from MCP client
      const tools = await mcpClient.tools();
      console.debug("Tools fetched:", Object.keys(tools).join(", "));

      const systemPrompt = `
        You are SQLito, a database assistant for Supabase.
        
        You have direct read-only database access through MCP tools.
        
        When asked questions about data, you should:
        1. Understand what data the user wants
        2. Use the database/query MCP tool to execute SQL queries
        3. Format results nicely with Markdown tables
        4. Provide a brief explanation of the results
        5. Include the SQL you used in a code block
        
        Important: Only perform READ operations (SELECT). Do not attempt to modify data.
        
        If you receive an error, explain it in plain terms and suggest fixes. Don't expose sensitive connection details.
      `;

      // Stream response using Claude through ai-sdk
      const response = await streamText({
        model: anthropic("claude-3-sonnet-20240229", { apiKey }),
        system: systemPrompt,
        tools,
        prompt: query,
        onFinish: async () => {
          await mcpClient.close();
        },
      });

      return response.toDataStreamResponse();
    } catch (error) {
      console.error("MCP query error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return new Response(
      JSON.stringify({
        error: "Server error processing request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
