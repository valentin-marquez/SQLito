interface Organization {
  id: string;
  name: string;
  billing_email: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  ref: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
  status: string;
}

interface ProjectDetails extends Project {
  db_host: string;
  db_port: number;
  db_name: string;
  services: {
    id: string;
    name: string;
    app_config: Record<string, unknown>;
    app_status: string;
  }[];
}

interface ApiKey {
  name: string;
  api_key: string;
  tags: string[];
  created_at: string;
}

export class SupabaseManagement {
  private baseUrl = "https://api.supabase.com";
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // Get user organizations
  async getOrganizations(): Promise<Organization[]> {
    return this.fetch<Organization[]>("/v1/organizations");
  }

  // Get projects in an organization
  async getProjects(organizationId: string): Promise<Project[]> {
    return this.fetch<Project[]>(`/v1/organizations/${organizationId}/projects`);
  }

  // Get project details
  async getProject(projectRef: string): Promise<ProjectDetails> {
    return this.fetch<ProjectDetails>(`/v1/projects/${projectRef}`);
  }

  // Get project API keys
  async getProjectApiKeys(projectRef: string): Promise<ApiKey[]> {
    return this.fetch<ApiKey[]>(`/v1/projects/${projectRef}/api-keys`);
  }
}
