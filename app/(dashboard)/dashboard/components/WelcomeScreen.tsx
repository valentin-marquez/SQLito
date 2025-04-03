export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="w-20 h-20 mb-4 relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full filter blur-md" />
        <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono font-bold text-2xl text-primary">SQL</div>
        </div>
      </div>
      <h2 className="text-3xl font-mono font-semibold text-primary mb-2 tracking-tight">SQLito</h2>
      <p className="text-sm text-muted-foreground font-mono">database access, simplified</p>

      {/* Badge to show Claude is connected */}
      <div className="mt-4 flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-mono">Claude API connected</span>
      </div>
    </div>
  );
}
