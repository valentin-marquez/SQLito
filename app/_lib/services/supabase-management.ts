import {
  type ConnectionStringResponse,
  Database,
  type DatabaseBranch, // Add this import
  type DatabaseBranchConfig, // Add this import
  type Organization,
  type PgBouncerConfig, // Add this import
  type PostgrestConfig, // Add this import
  type Project,
  type Secret,
} from "../types/supabase-api";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type CacheStore = Record<string, CacheEntry<unknown>>;

export class SupabaseManagement {
  private accessToken: string;
  private baseUrl = "https://api.supabase.com/v1";
  private cache: CacheStore = {};
  private cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private requestQueue: Promise<unknown>[] = [];
  private maxConcurrentRequests = 10;
  private requestsInLastMinute = 0;
  private lastRequestTime = 0;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Basic rate limiting - track requests per minute
    const now = Date.now();
    if (now - this.lastRequestTime > 60000) {
      // Reset counter after a minute
      this.requestsInLastMinute = 0;
      this.lastRequestTime = now;
    } else {
      this.requestsInLastMinute++;
      if (this.requestsInLastMinute >= 55) {
        // Conservative limit (55 instead of 60)
        const waitTime = 60000 - (now - this.lastRequestTime);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.requestsInLastMinute = 0;
        this.lastRequestTime = Date.now();
      }
    }

    // Check cache
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    if (this.cache[cacheKey] && now - this.cache[cacheKey].timestamp < this.cacheTTL) {
      return this.cache[cacheKey].data as T;
    }

    // Manage concurrent requests
    if (this.requestQueue.length >= this.maxConcurrentRequests) {
      await Promise.race(this.requestQueue);
    }

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Next.js 15 optimization - use fetch with next caching options
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      // Next.js 15 cache options
      next: {
        revalidate: Math.floor(this.cacheTTL / 1000), // Convert ms to seconds
        tags: [`supabase-${url.split("/")[1]}`], // Create cache tags based on resource type
      },
    };

    const requestPromise = fetch(`${this.baseUrl}${url}`, fetchOptions).then(async (response) => {
      // Remove this request from the queue
      this.requestQueue = this.requestQueue.filter((p) => p !== requestPromise);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: unknown;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = errorText;
        }

        const errorMessage =
          typeof errorData === "object" && errorData !== null
            ? JSON.stringify(errorData)
            : `${response.status}: ${String(errorData)}`;

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as T;

      // Cache the result
      this.cache[cacheKey] = { data, timestamp: Date.now() };

      return data;
    });

    // Add to queue
    this.requestQueue.push(requestPromise);

    return requestPromise as Promise<T>;
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.makeRequest<Organization[]>("/organizations");
  }

  async getProjects(orgId?: string): Promise<Project[]> {
    const projects = await this.makeRequest<Project[]>("/projects");
    return orgId ? projects.filter((p) => p.organization_id === orgId) : projects;
  }

  async getProject(projectRef: string): Promise<Project> {
    return this.makeRequest<Project>(`/projects/${projectRef}`);
  }

  async getProjectSecrets(projectRef: string): Promise<Secret[]> {
    return this.makeRequest<Secret[]>(`/projects/${projectRef}/secrets`);
  }

  buildConnectionString(project: Project, password: string): string {
    // If database info is not available
    if (!project.database?.host) {
      throw new Error("Database connection information not available");
    }

    // Build connection string for pooler session mode
    return `postgresql://postgres.${project.ref}:${password}@${project.database.host.replace(/^db\./, "aws-0-us-east-1.pooler.")}.supabase.com:6543/postgres`;
  }

  async getConnectionString(ref: string): Promise<string> {
    // Get the project's connection information
    const endpoint = `/projects/${ref}/connection-string`;
    const data = await this.makeRequest<{ db_url: string }>(endpoint);
    return data.db_url;
  }

  // Add method for getting PgBouncer configuration
  async getPgBouncerConfig(projectRef: string): Promise<PgBouncerConfig> {
    return this.makeRequest<PgBouncerConfig>(`/projects/${projectRef}/config/database/pgbouncer`);
  }

  // Add these methods to your class
  async getProjectBranches(projectRef: string): Promise<DatabaseBranch[]> {
    return this.makeRequest<DatabaseBranch[]>(`/projects/${projectRef}/branches`);
  }

  async getBranchConfig(branchId: string): Promise<DatabaseBranchConfig> {
    return this.makeRequest<DatabaseBranchConfig>(`/branches/${branchId}`);
  }

  // Add method for getting PostgresT configuration
  async getPostgrestConfig(projectRef: string): Promise<PostgrestConfig> {
    return this.makeRequest<PostgrestConfig>(`/projects/${projectRef}/postgrest`);
  }

  clearCache(): void {
    this.cache = {};
  }
}
