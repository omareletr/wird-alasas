import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | wird al-asas",
  description: "Privacy policy for wird al-asas.",
};

export default function PrivacyPage() {
  return (
    <main className="h-dvh overflow-y-auto bg-background text-foreground">
      <article className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-12 sm:px-8 sm:py-16">
        <header className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            wird al-asas
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Last updated: June 2, 2026
          </p>
        </header>

        <section className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            wird al-asas is designed as a local-first dhikr counter. The app stores
            your progress and settings on your device so the app can work without
            an account or network connection.
          </p>
          <p>
            We do not require you to create an account. We do not collect your name,
            email address, contacts, precise location, photos, microphone input, or
            camera data for the v1 app experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Data Stored On Your Device</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The app may store your dhikr counts, completion history, selected mode,
            reset time, feedback preference, theme preference, and onboarding state
            locally on your device. This data is used only to operate the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Data Shared With Us</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The v1 native app does not send your dhikr progress or settings to our
            servers. If this changes in a future version, this policy will be
            updated before that version is released.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Website Hosting</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The public website may be hosted by Netlify. Like most hosting providers,
            Netlify may process basic technical request information such as IP
            address, user agent, requested URL, and timestamps to provide hosting,
            security, and diagnostics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Deleting Data</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            You can delete local app data by using device-level app data controls,
            uninstalling the native app, or clearing site data for the web app in
            your browser.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Contact</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            For privacy or support requests, use the support page at
            <a className="text-foreground underline underline-offset-4" href="/support">
              {" /support"}
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
