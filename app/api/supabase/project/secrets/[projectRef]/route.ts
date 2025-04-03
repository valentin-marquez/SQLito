import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { ErrorResponse, Secret } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectRef: string }> }
): Promise<NextResponse<Secret[] | ErrorResponse>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { projectRef } = await params;
    console.log(projectRef);
    if (!projectRef) {
      return NextResponse.json({ error: "Project reference is required" }, { status: 400 });
    }

    const supabaseManagement = new SupabaseManagement(accessToken);

    // Use the service to get secrets
    const secrets = await supabaseManagement.getProjectSecrets(projectRef);
    return NextResponse.json(secrets);
  } catch (error) {
    console.error("Failed to fetch project secrets:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
