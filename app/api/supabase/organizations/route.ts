import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { ErrorResponse, Organization } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<Organization[] | ErrorResponse>> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseManagement = new SupabaseManagement(accessToken);

    // Use the service to get organizations
    const organizations = await supabaseManagement.getOrganizations();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
