import { atom, map } from "nanostores";
import { SupabaseManagement } from "../services/supabase-management";

export interface DatabaseItem {
  id: string;
  name: string;
  connectionString?: string;
}

// Stores
export const selectedDatabaseId = atom<string | null>(null);
export const availableDatabases = atom<DatabaseItem[]>([]);
export const databasesLoading = atom<boolean>(false);
export const databaseConnectionInfo = map<Record<string, string>>({});
export const databaseFetchError = atom<string | null>(null);

// Actions
export async function fetchDatabases(accessToken: string) {
  databasesLoading.set(true);
  databaseFetchError.set(null);

  try {
    const supabaseManagement = new SupabaseManagement(accessToken);

    // Get organizations
    const organizations = await supabaseManagement.getOrganizations();
    if (!organizations || !organizations.length) {
      databaseFetchError.set("No organizations found");
      return;
    }

    // Get projects for the first organization
    const orgId = organizations[0].id;
    const projects = await supabaseManagement.getProjects(orgId);

    if (!projects || !projects.length) {
      databaseFetchError.set("No projects found in the organization");
      return;
    }

    const dbs: DatabaseItem[] = projects.map((project) => ({
      id: project.ref,
      name: project.name,
    }));

    availableDatabases.set(dbs);

    // Set the first database as selected if none is selected
    if (selectedDatabaseId.get() === null && dbs.length > 0) {
      selectedDatabaseId.set(dbs[0].id);
    }

    // Set connection info for each database
    for (const db of dbs) {
      try {
        const projectDetails = await supabaseManagement.getProject(db.id);
        const dbUrl = projectDetails.db_host;
        databaseConnectionInfo.setKey(db.id, dbUrl);
      } catch (error) {
        console.error(`Failed to get connection info for ${db.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching databases:", error);
    databaseFetchError.set("Failed to fetch databases");
  } finally {
    databasesLoading.set(false);
  }
}

export function selectDatabase(dbId: string) {
  selectedDatabaseId.set(dbId);
}
