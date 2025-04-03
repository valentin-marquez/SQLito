import { SupabaseManagement } from "@/_lib/services/supabase-management";
import type { DatabaseBranchConfig, ErrorResponse } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request, { params }: { params: { branchId: string } }) => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { branchId } = params;
    if (!branchId) {
      return NextResponse.json({ error: "Missing branch ID" } as ErrorResponse, {
        status: 400,
      });
    }

    const supabaseManagement = new SupabaseManagement(accessToken);
    const branchConfig = await supabaseManagement.getBranchConfig(branchId);

    return NextResponse.json(branchConfig);
  } catch (error) {
    console.error("Error fetching branch configuration:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch branch configuration",
        message: error instanceof Error ? error.message : String(error),
      } as ErrorResponse,
      { status: 500 }
    );
  }
};
