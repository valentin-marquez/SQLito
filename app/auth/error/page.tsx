"use client";

import { Button } from "@/_components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/_components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "unknown_error";

  const errorMessages: Record<string, string> = {
    invalid_state: "Authentication failed: Invalid state parameter. Please try again.",
    missing_code: "Authentication failed: Missing authorization code. Please try again.",
    token_exchange_failed:
      "Authentication failed: Could not exchange code for tokens. Please try again.",
    server_error: "Authentication failed: Server error occurred. Please try again.",
    unknown_error: "An unknown error occurred during authentication. Please try again.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-500">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center">{errorMessages[error]}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
