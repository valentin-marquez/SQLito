import { useDatabaseStore } from '@/_lib/stores/useDatabaseStore';

export function WelcomeScreen() {
  const { anthropicApiKey } = useDatabaseStore();
  const isClaudeConnected = !!anthropicApiKey;
  
  return (
    <div className="flex flex-col items-center mb-6 font-mono">
      <div className="w-20 h-20 mb-4 relative">
      <div className="absolute inset-0 bg-primary/10 rounded-sm filter blur-md" />
      <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="font-mono font-bold text-2xl text-primary tracking-tighter">SQL</div>
      </div>
      </div>
      <h2 className="text-3xl font-mono font-semibold text-primary mb-2 tracking-tight">SQLito</h2>
      <p className="text-sm text-muted-foreground font-mono tracking-tighter">database access, simplified</p>

      {/* Badge to show Claude connection status */}
      <div className={`mt-4 flex items-center gap-2 ${isClaudeConnected ? 'bg-green-500/10' : 'bg-red-500/10'} px-3 py-1 rounded-sm border border-border font-mono`}>
      <div className={`w-2 h-2 ${isClaudeConnected ? 'bg-green-500' : 'bg-red-500'} rounded-sm ${isClaudeConnected ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-mono tracking-tight">
          {isClaudeConnected ? 'Claude API connected' : 'Claude API not connected'}
        </span>
      </div>
    </div>
  );
}
