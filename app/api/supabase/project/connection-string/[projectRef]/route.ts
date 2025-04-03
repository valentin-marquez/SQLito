import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { ConnectionStringResponse, ErrorResponse } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { projectRef: string } }
): Promise<NextResponse<ConnectionStringResponse | ErrorResponse>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const projectRef = params.projectRef;
    const supabaseManagement = new SupabaseManagement(accessToken);

    // Use the service to get the connection string for the project
    const connectionString = await supabaseManagement.getConnectionString(projectRef);

    return NextResponse.json({ connectionString });
  } catch (error) {
    console.error("Failed to fetch connection string:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
