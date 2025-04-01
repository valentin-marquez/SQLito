import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  // Clear authentication cookies
  const cookiesStore = await cookies();
  cookiesStore.delete("supabase_access_token");
  cookiesStore.delete("supabase_refresh_token");

  // Redirect to the home page
  const redirectUri = process.env.SUPABASE_REDIRECT_URI || "http://localhost:3000";
  return NextResponse.redirect(new URL("/", redirectUri));
}
