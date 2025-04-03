import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookiesStore = await cookies();
  const storedState = cookiesStore.get("oauth_state")?.value;
  const codeVerifier = cookiesStore.get("code_verifier")?.value;

  // Verify state to prevent CSRF attacks
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/auth/error?error=invalid_state", request.url));
  }

  if (!code || !codeVerifier) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_code", request.url));
  }

  try {
    // Exchange the authorization code for tokens
    const tokenEndpoint = "https://api.supabase.com/v1/oauth/token";
    const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID || "";
    const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET || "";
    const redirectUri = process.env.SUPABASE_REDIRECT_URI || "";

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token exchange failed:", error);
      return NextResponse.redirect(new URL("/auth/error?error=token_exchange_failed", request.url));
    }

    const tokens = await response.json();

    // Store the tokens in secure cookies
    cookiesStore.set("supabase_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
      sameSite: "lax",
    });

    cookiesStore.set("supabase_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });

    // Set a non-HttpOnly cookie to indicate authentication status to the client
    // This is safe because it doesn't contain the actual token
    cookiesStore.set("sqlito_auth_status", "authenticated", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
      sameSite: "lax",
    });

    // Clean up the temporary cookies
    cookiesStore.delete("code_verifier");
    cookiesStore.delete("oauth_state");

    // Redirect to the dashboard without token in URL
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error("Failed to exchange code for tokens:", error);
    return NextResponse.redirect(new URL("/auth/error?error=server_error", request.url));
  }
}
