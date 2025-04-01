import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Path that require authentication
  const protectedPaths = ["/dashboard"];

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath) {
    // Check if the user is authenticated
    const accessToken = request.cookies.get("supabase_access_token")?.value;

    // If token doesn't exist, redirect to login
    if (!accessToken) {
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Specify which paths this middleware applies to
export const config = {
  matcher: ["/dashboard/:path*"],
};
