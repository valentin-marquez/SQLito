export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 bg-primary animate-pulse delay-100" />
        <div className="h-3 w-3 bg-primary animate-pulse delay-300" />
        <div className="h-3 w-3 bg-primary animate-pulse delay-500" />
      </div>
    </div>
  );
}
