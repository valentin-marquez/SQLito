import { Button } from "@/_components/ui/button";

interface SetupScreenProps {
  onConfigure: () => void;
}

export function SetupScreen({ onConfigure }: SetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="max-w-md text-center px-4 py-8 border border-dashed rounded-none">
        <h2 className="text-xl font-mono mb-4">Required Setup</h2>
        <p className="text-sm text-muted-foreground mb-6 font-mono">
          To use SQLito, you need to provide:
        </p>
        <ul className="text-sm text-muted-foreground mb-6 font-mono list-disc text-left max-w-xs mx-auto">
          <li>A Claude API key (Anthropic) for natural language processing</li>
          <li>Database passwords for your Supabase projects</li>
        </ul>
        <Button onClick={onConfigure} className="font-mono border border-dashed">
          Configure Settings
        </Button>
      </div>
    </div>
  );
}
