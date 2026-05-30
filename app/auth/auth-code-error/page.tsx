import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Sign-in link invalid</h1>
      <p className="max-w-md text-muted-foreground">
        That magic link was invalid or has expired. Please request a new one.
      </p>
      <Button asChild>
        <Link href="/login">Back to sign in</Link>
      </Button>
    </main>
  );
}
