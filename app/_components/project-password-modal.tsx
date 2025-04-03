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
import { useDatabaseStore, useProjectsStore } from "@/_lib/stores";
import { AlertCircle, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

interface ProjectPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectPasswordModal = ({ open, onClose }: ProjectPasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { pendingProjectRef, setDbPassword } = useDatabaseStore();
  const { projects } = useProjectsStore();

  // Find the pending project details
  const pendingProject = projects.find((p) => p.id === pendingProjectRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Oops! We need your database password to unlock your data.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!pendingProjectRef) {
        throw new Error("No project selected");
      }

      // Store the password for this project
      setDbPassword(pendingProjectRef, password);

      // Wait a brief moment to simulate verification
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Close the modal
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't connect to your database. Please check your password and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-dashed">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            One Last Thing: Database Key
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {pendingProject ? (
              <>
                Enter the database password for <strong>"{pendingProject.name}"</strong> to unlock
                your data insights
              </>
            ) : (
              "Enter your Supabase database password to connect"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dbPassword" className="font-mono text-xs flex items-center gap-2">
              <Lock className="h-3 w-3" /> Database Password
            </Label>
            <Input
              id="dbPassword"
              type="password"
              placeholder="Your secret database key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono text-sm border-dashed"
              autoFocus
            />
            <div className="flex items-center bg-muted/30 p-2 rounded-sm">
              <p className="text-xs text-muted-foreground font-mono">
                This is the password for your Supabase PostgreSQL database. Don't worry, it's stored
                securely and only used for read-only access.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-destructive text-xs mt-1 p-2 bg-destructive/10 rounded-sm">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button type="submit" disabled={isLoading} className="font-mono border border-dashed">
              {isLoading ? (
                <>
                  <Loader variant="classic" size="sm" className="mr-2" />
                  Unlocking data magic...
                </>
              ) : (
                "Connect & Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
