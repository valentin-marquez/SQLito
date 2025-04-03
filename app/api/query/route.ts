import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, connectionString, projectRef, apiKey } = await req.json();

    if (!query || !connectionString || !projectRef || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Since we can't access localStorage in the API route, redirect to MCP endpoint
    // and let it handle the password retrieval on the client side
    const response = await fetch(new URL("/api/mcp/query", req.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        connectionString,
        projectRef,
        apiKey,
        // Pass the passwords from client-side
        dbPasswords: req.headers.get("X-Database-Passwords")
          ? JSON.parse(req.headers.get("X-Database-Passwords") || "{}")
          : {},
      }),
    });

    // Return the streaming response from the MCP endpoint
    return response;
  } catch (error) {
    console.error("Query API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process query",
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
