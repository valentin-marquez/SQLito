"use client";
import { Button } from "@/_components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Supabase from "./icons/supabase";

export interface ConnectButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function ConnectButton({
  onClick,
  isLoading: externalLoading,
  className,
}: ConnectButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  // Use external loading state if provided, otherwise use internal state
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleConnect = async () => {
    try {
      // If an onClick handler is provided, call it and manage loading internally
      if (onClick) {
        setInternalLoading(true);
        onClick();
        return;
      }

      // Default behavior without setting loading state
      window.location.href = "/api/auth/login";
    } catch (error) {
      console.error("Failed to connect to Supabase:", error);
      toast.error("Failed to connect to Supabase");
    } finally {
      // Only reset internal loading state if we're using onClick
      if (onClick && externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  return (
    <Button
      variant={"secondary"}
      onClick={handleConnect}
      disabled={isLoading}
      className={`hover:cursor-pointer border border-border flex items-center gap-2 ${className || ""}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Supabase className="h-4 w-4" />
          <span>Connect Supabase</span>
        </>
      )}
    </Button>
  );
}
