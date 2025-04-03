import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Loader } from "@/_components/ui/loader";
import { useDatabaseStore } from "@/_lib/stores";
import { AlertCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface ApiKeyModalProps {
  open: boolean;
  onClose: (apiKey?: string) => void;
}

export const ApiKeyModal = ({ open, onClose }: ApiKeyModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Use the database store to access and update the API key
  const { setAnthropicApiKey } = useDatabaseStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate API key
      const isValidKey = apiKey.startsWith("sk-ant-");

      if (!isValidKey) {
        throw new Error("The API key must start with 'sk-ant-'");
      }

      // Store the key only in the Zustand store
      setAnthropicApiKey(apiKey);

      // Wait a brief moment to simulate verification
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Close the modal and pass the key
      onClose(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error validating API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-dashed">
        <DialogHeader>
          <DialogTitle className="font-mono">Claude API Configuration</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            To use SQLito, you need to provide a Claude API key (Anthropic).
            <br />
            This key will be stored locally and won't be sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="font-mono text-xs">
              Claude API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm border-dashed"
            />
            {error && (
              <div className="flex items-center space-x-2 text-destructive text-xs mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-2">
              You can get a key at{" "}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="submit" disabled={isLoading} className="font-mono border border-dashed">
              {isLoading ? (
                <>
                  <Loader variant="classic" size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Connect with Claude"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
