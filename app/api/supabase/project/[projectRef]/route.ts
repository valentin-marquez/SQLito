import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SupabaseManagementAPI } from "supabase-management-js";

export async function GET(request: Request, { params }: { params: { projectRef: string } }) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = new SupabaseManagementAPI({
      accessToken: "sbp_oauth_52d067cce439713daaf2108c5dadeeb4d1bf6b3d",
    });
    const project = await client.getProjects().then((projects) => {
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
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
