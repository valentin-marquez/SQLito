import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SupabaseManagementAPI } from "supabase-management-js";

export async function GET(request: Request, { params }: { params: { orgId: string } }) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = new SupabaseManagementAPI({ accessToken });
    const projects = await client.getProjects().then((projects) => {
      if (!projects) {
        return [];
      }
      return projects.map((project) => ({
        id: project.id,
        organization_id: project.organization_id,
        name: project.name,
        region: project.region,
        created_at: project.created_at,
        database: project.database
          ? { host: project.database.host, version: project.database.version }
          : undefined,
      }));
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
