import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { ErrorResponse, Project } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  // { params }: { params: { orgId: string } }
  { params }: { params: Promise<{ orgId: string }> }
): Promise<NextResponse<Project[] | ErrorResponse>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { orgId } = await params;
    const supabaseManagement = new SupabaseManagement(accessToken);

    // Use the service to get projects
    const projects = await supabaseManagement.getProjects(orgId !== "all" ? orgId : undefined);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
