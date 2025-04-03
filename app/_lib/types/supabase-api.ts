/**
 * Types for Supabase Management API
 * Based on the API documentation: https://api.supabase.com/
 */

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  billing_email?: string;
  created_at?: string;
}

export interface Database {
  host: string;
  version: string;
  postgres_engine: string;
  release_channel: string;
}

export interface Project {
  id: string; // This is the primary identifier (previously we expected 'ref')
  organization_id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
  database: {
    host: string;
    version: string;
    postgres_engine: string;
    release_channel: string;
  };
  // Add this field for backward compatibility
  ref?: string;
}

export interface Secret {
  name: string;
  value: string;
  updated_at: string;
}

export interface ConnectionStringResponse {
  connectionString: string;
}

// Add PgBouncer configuration type
export interface PgBouncerConfig {
  pool_mode?: string;
  default_pool_size?: number;
  max_client_conn?: number;
  ignore_startup_parameters?: string;
  pool_settings?: Record<string, string>;
}

// Add PostgresT configuration type
export interface PostgrestConfig {
  db_schema: string;
  max_rows: number;
  db_extra_search_path: string;
  db_pool: number;
  jwt_secret: string;
}

export type ErrorResponse = {
  error: string;
  status?: number;
  message?: string;
};

export interface DatabaseBranch {
  id: string;
  name: string;
  project_ref: string;
  parent_project_ref: string;
  is_default: boolean;
  git_branch: string;
  pr_number: number;
  latest_check_run_id: number;
  persistent: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBranchConfig {
  ref: string;
  postgres_version: string;
  postgres_engine: string;
  release_channel: string;
  status: string;
  db_host: string;
  db_port: number;
  db_user: string;
  db_pass: string;
  jwt_secret: string;
}
