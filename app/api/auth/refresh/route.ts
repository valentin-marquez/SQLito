import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookiesStore = await cookies();
  const refreshToken = cookiesStore.get("supabase_refresh_token")?.value;

  if (!refreshToken) {
    console.log("Refresh failed: No refresh token found in cookies");
    return NextResponse.json({ error: "No refresh token found", success: false }, { status: 401 });
  }

  try {
    const tokenEndpoint = "https://api.supabase.com/v1/oauth/token";
    const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID || "";
    const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      console.error("Missing OAuth client credentials");
      return NextResponse.json(
        { error: "Server configuration error", success: false },
        { status: 500 }
      );
    }

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
      const errorText = await response.text();
      console.error("Token refresh failed:", errorText, "Status:", response.status);

      // If refresh token is invalid, clear cookies to prevent future failed attempts
      if (response.status === 400 || response.status === 401) {
        cookiesStore.delete("supabase_access_token");
        cookiesStore.delete("supabase_refresh_token");
      }

      return NextResponse.json(
        { error: "Failed to refresh token", success: false, details: errorText },
        { status: 401 }
      );
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
      access_token: tokens.access_token, // Send token back to client for direct use
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
    return NextResponse.json({ error: "Failed to refresh token", success: false }, { status: 500 });
  }
}
