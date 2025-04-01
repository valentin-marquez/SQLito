import { generateCodeChallenge, generateCodeVerifier, generateState } from "@/_lib/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store the code verifier and state in cookies for later verification
  (await cookies()).set("code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
    sameSite: "lax",
  });

  (await cookies()).set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
    sameSite: "lax",
  });

  // Construct the authorization URL
  const authUrl = new URL("https://api.supabase.com/v1/oauth/authorize");
  authUrl.searchParams.append("client_id", process.env.SUPABASE_OAUTH_CLIENT_ID || "");
  authUrl.searchParams.append("redirect_uri", process.env.SUPABASE_REDIRECT_URI || "");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  authUrl.searchParams.append("state", state);

  // Redirect to the Supabase OAuth authorization page
  return NextResponse.redirect(authUrl);
}
