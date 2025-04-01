import { get } from "nanostores";
import { databaseConnectionInfo, selectedDatabaseId } from "../_stores/database";

export class MCPService {
  private static instance: MCPService;
  private mcpServerProcess: any = null;

  private constructor() {}

  public static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  /**
   * Generate MCP configuration for Claude
   */
  public generateMCPConfig() {
    const currentDbId = get(selectedDatabaseId);
    const connectionString = get(databaseConnectionInfo)[currentDbId];

    if (!connectionString) {
      return null;
    }

    // This would be used in a real environment as part of the model's system prompt
    return {
      mcpConfig: {
        supabase: {
          type: "postgres",
          connectionString,
        },
      },
    };
  }

  /**
   * Format a query for Claude with MCP context
   */
  public formatQueryWithMCPContext(query: string): string {
    const currentDbId = get(selectedDatabaseId);

    return `
Database: ${currentDbId}

I'm going to help you answer this question by running SQL queries against the database.
The database is a PostgreSQL database in Supabase.

Query: ${query}

Please analyze this query, generate appropriate SQL, and execute it against the database using MCP.
Then provide the results in a clear, human-readable format with explanations.
    `.trim();
  }

  /**
   * In a production application, this would start an MCP server process
   * For this example, we'll just simulate the configuration
   */
  public async configureMCPForCurrentDatabase(): Promise<boolean> {
    const currentDbId = get(selectedDatabaseId);
    const connectionString = get(databaseConnectionInfo)[currentDbId];

    if (!connectionString) {
      console.error("No connection string available for the selected database");
      return false;
    }

    console.log(`Configuring MCP server for database: ${currentDbId}`);
    // In a real implementation, this would start the MCP server process
    // this.mcpServerProcess = spawn('npx', ['-y', '@modelcontextprotocol/server-postgres', connectionString]);

    return true;
  }

  /**
   * Stop the MCP server process
   */
  public stopMCPServer() {
    if (this.mcpServerProcess) {
      this.mcpServerProcess.kill();
      this.mcpServerProcess = null;
    }
  }
}

export default MCPService.getInstance();
