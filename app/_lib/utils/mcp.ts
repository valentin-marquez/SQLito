import { experimental_createMCPClient } from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import spawn from "cross-spawn";
import { decrypt } from "./encryption";

/**
 * Creates an MCP client connected to a Postgres server using the provided connection details
 */
export async function createPostgresMCPClient(connectionString: string) {
  try {
    // Log connection string format (with password masked)
    console.log("Creating MCP client with connection string format:", connectionString);

    // Initialize MCP client with Postgres server
    const transport = new Experimental_StdioMCPTransport({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres", connectionString],
    });

    const client = await experimental_createMCPClient({
      transport,
    });

    console.log("MCP client created successfully");
    return client;
  } catch (error) {
    console.error("Failed to create MCP client:", error);
    throw error;
  }
}

/**
 * Normalizes a Supabase connection string to ensure consistent format
 * Handles different formats from various Supabase endpoints
 */
export function normalizeConnectionString(connectionString: string): string {
  // Ensure we have the proper protocol (postgresql://)
  let normalized = connectionString;

  // Ensure we're using postgresql:// protocol
  if (normalized.startsWith("postgres://")) {
    normalized = normalized.replace("postgres://", "postgresql://");
  }

  // Check if the string matches the pattern for pooler connection
  const isPoolerPattern = /postgresql:\/\/postgres\.[a-zA-Z0-9]+:.*@.*pooler\.supabase\.com/;

  // If it's already in the correct format, return it
  if (isPoolerPattern.test(normalized)) {
    return normalized;
  }

  // For regular DB connection strings, we might need to transform to pooler format
  // Example: postgres://postgres:[password]@db.tcwjvtfcwoeupnpfrbzn.supabase.co:6543/postgres
  // To: postgresql://postgres.tcwjvtfcwoeupnpfrbzn:[password]@aws-0-us-east-2.pooler.supabase.com:6543/postgres

  // Extract the project ref from the hostname
  const dbHostnameMatch = normalized.match(/db\.([a-zA-Z0-9]+)\.supabase\.co/);
  if (dbHostnameMatch?.[1]) {
    const projectRef = dbHostnameMatch[1];

    // Try to transform to pooler format if it's a standard DB connection string
    if (normalized.includes(`@db.${projectRef}.supabase.co`)) {
      // Replace the username part
      normalized = normalized.replace("postgres:", `postgres.${projectRef}:`);

      // Replace the hostname part (this is a guess - ideally we'd get the region from API)
      normalized = normalized.replace(
        `db.${projectRef}.supabase.co`,
        "aws-0-us-east-2.pooler.supabase.com"
      );
    }
  }

  return normalized;
}

/**
 * Helper function to build a full connection string with password
 */
export function buildConnectionString(baseConnectionString: string, password: string): string {
  if (!baseConnectionString) {
    throw new Error("Connection string is required");
  }

  if (!password) {
    throw new Error("Database password is required");
  }

  // Replace the password placeholder in the connection string
  const connectionStringWithPassword = baseConnectionString.replace(/:[^@]*@/, `:${password}@`);

  // Normalize the connection string format
  return normalizeConnectionString(connectionStringWithPassword);
}

/**
 * Gets the connection string with password from stored credentials
 */
export function getConnectionStringWithPassword(
  connectionString: string | null,
  projectRef: string | null,
  dbPasswords: Record<string, string>
): string {
  if (!connectionString || !projectRef) {
    throw new Error("Connection string and project reference are required");
  }

  const encryptedPassword = dbPasswords[projectRef];
  if (!encryptedPassword) {
    throw new Error("No password found for this project");
  }

  const password = decrypt(encryptedPassword);

  // First replace the placeholder with the actual password
  let fullConnectionString = connectionString.replace(/:\[YOUR-PASSWORD\]@/, `:${password}@`);

  // Also handle the case where we have a different format
  fullConnectionString = fullConnectionString.replace(/:[^@]*@/, `:${password}@`);

  // Then normalize the connection string format
  return normalizeConnectionString(fullConnectionString);
}

/**
 * Validates if the environment has npx available
 * Helps diagnose ENOENT errors
 */
export async function validateNpxAvailability(): Promise<boolean> {
  try {
    // Try to execute a simple npx command to check if it's available
    // using cross-spawn instead of child_process for better cross-platform support
    await new Promise((resolve, reject) => {
      const child = spawn("npx", ["--version"]);

      let stdoutData = "";
      let stderrData = "";

      child.stdout?.on("data", (data) => {
        stdoutData += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderrData += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`npx exited with code ${code}: ${stderrData}`));
          return;
        }
        resolve(stdoutData);
      });

      child.on("error", (err) => {
        reject(err);
      });
    });

    return true;
  } catch (error) {
    console.error("npx is not available in the environment:", error);
    return false;
  }
}
