import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Starter Template</h1>
        <p className="max-w-md text-muted-foreground">
          Next.js + TypeScript + Tailwind + shadcn/ui, with Supabase auth and a
          Netlify-ready build. Spin new projects off this baseline.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/protected">Protected page</Link>
        </Button>
      </div>
    </main>
  );
}
