import { SupabaseManagement } from "@/_lib/services/supabase-management";
import { type ErrorResponse, PgBouncerConfig } from "@/_lib/types/supabase-api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (request: Request, { params }: { params: { projectRef: string } }) => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("supabase_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { projectRef } = params;
    if (!projectRef) {
      return NextResponse.json({ error: "Missing project reference" } as ErrorResponse, {
        status: 400,
      });
    }

    const supabaseManagement = new SupabaseManagement(accessToken);
    const pgBouncerConfig = await supabaseManagement.getPgBouncerConfig(projectRef);

    return NextResponse.json(pgBouncerConfig);
  } catch (error) {
    console.error("Error fetching pgbouncer configuration:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch PgBouncer configuration",
        message: error instanceof Error ? error.message : String(error),
      } as ErrorResponse,
      { status: 500 }
    );
  }
};
