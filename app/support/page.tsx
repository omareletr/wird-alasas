import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | wird al-asas",
  description: "Support information for wird al-asas.",
};

export default function SupportPage() {
  return (
    <main className="h-dvh overflow-y-auto bg-background text-foreground">
      <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12 sm:px-8 sm:py-16">
        <header className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            wird al-asas
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Support
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Help and contact information for the wird al-asas app.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Contact</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            For app support, send a message to the maintainer through the project
            support channel you received with the app. A public support email should
            be added here before App Store or Google Play submission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Before Contacting Support</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>Confirm that you are using the latest app version.</li>
            <li>Try closing and reopening the app.</li>
            <li>
              For web usage, try refreshing the page or clearing browser site data
              if your local state appears corrupted.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Privacy</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Read the privacy policy at
            <a className="text-foreground underline underline-offset-4" href="/privacy">
              {" /privacy"}
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
