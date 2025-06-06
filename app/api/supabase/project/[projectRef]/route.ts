import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { ErrorResponse, Project } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { projectRef: string } }
): Promise<NextResponse<Project | ErrorResponse>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const projectRef = params.projectRef;
    const supabaseManagement = new SupabaseManagement(accessToken);

    // Use the service to get project details
    const project = await supabaseManagement.getProject(projectRef);
    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
