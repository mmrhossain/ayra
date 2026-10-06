export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-3.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="h-3.5 w-3.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="h-3.5 w-3.5 rounded-full bg-primary animate-bounce" />
      </div>

      <p className="text-sm font-medium text-muted-foreground tracking-wide animate-pulse">
        Preparing your checkout...
      </p>
    </div>
  );
}
