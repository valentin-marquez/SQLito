import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookiesStore = await cookies();
  const refreshToken = cookiesStore.get("supabase_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token found" }, { status: 401 });
  }

  try {
    const tokenEndpoint = "https://api.supabase.com/v1/oauth/token";
    const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID || "";
    const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET || "";

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Token refresh failed:", error);
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
    }

    const tokens = await response.json();

    // Store the new tokens
    cookiesStore.set("supabase_access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokens.expires_in,
      path: "/",
      sameSite: "lax",
    });

    if (tokens.refresh_token) {
      cookiesStore.set("supabase_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      });
    }

    return NextResponse.json({
      success: true,
      cookies: {
        access_token: {
          value: tokens.access_token,
          expires_in: tokens.expires_in,
        },
        refresh_token: tokens.refresh_token
          ? {
              value: tokens.refresh_token,
              expires_in: 60 * 60 * 24 * 30,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to refresh tokens:", error);
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
  }
}
