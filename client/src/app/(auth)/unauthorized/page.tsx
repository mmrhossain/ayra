import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="text-sm text-muted-foreground">
        You do not have access to this area.
      </p>
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        Go home
      </Link>
    </div>
  );
}
