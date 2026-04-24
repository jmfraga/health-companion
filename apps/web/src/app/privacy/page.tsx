import type { Metadata } from "next";
import Link from "next/link";

// NOTE: Small inline helpers (PageShell, Section) live here for now because this
// is a server component with no shared static-page utilities yet. If a main
// polish agent creates a shared `components/static/*` module later, dedupe
// these with the twin in `how-this-works/page.tsx`.

export const metadata: Metadata = {
  title: "About your privacy · Health Companion",
  description:
    "What we store, what we never do with your data, and how you take it with you.",
};

export default function PrivacyPage() {
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-zinc-50 text-zinc-900"
      style={{
        paddingTop: "max(0px, env(safe-area-inset-top))",
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <span>Health Companion</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline"
          >
            Back
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Privacy
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            About your privacy
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 sm:text-lg">
            Your data, your choices.
          </p>
        </div>

        <article className="space-y-8">
          <Section title="This is a hackathon demo — read this first">
            <p>
              What you are using is a hackathon demonstration of Health
              Companion &mdash; a showcase of the shape and voice of the
              product, not the production clinical tool yet.
            </p>
            <p>
              Two things worth saying out loud.
            </p>
            <p>
              The patient story woven through the recorded walk-through
              &mdash; her name, her labs, her proactive follow-up &mdash; is{" "}
              <strong>synthetic</strong>, fabricated for illustration. The
              sample lab report is anonymized. No real patient data is
              processed or retained in the scripted demo.
            </p>
            <p>
              If you decide to interact with the companion using your own
              health information to see how it feels, that is welcome
              &mdash; the demo is built to respond to real life. Please
              know: this is still a demo environment. We have not yet
              completed the Business Associate Agreement with our model
              provider, the per-user encryption, or the clinical-grade
              audit controls that a production health tool requires. Share
              what you would share in a first conversation with a new
              doctor. Hold back what you would not.
            </p>
            <p>
              Everything described below is the architecture we are
              building toward in Phase 1 &mdash; the BAA, row-level
              security, consent flows, export and delete. Scoped, not
              speculative. But future, not now.
            </p>
          </Section>

          <Section title="What we store">
            <p>
              Profile facts you tell the companion, biomarkers from labs you
              upload, screenings scheduled, conversations worth keeping
              (curated), and timeline entries. Nothing we haven&rsquo;t been
              told or shown.
            </p>
            <p>
              In the Phase-1 production build, everything is encrypted at
              rest and in transit. In the demo you are using today,
              conversation state lives in process memory and is cleared
              when you press <strong>Start fresh</strong> or when the
              session ends.
            </p>
          </Section>

          <Section title="What we never do with your data">
            <p>
              We never sell it. We never share it with advertisers. We never
              use your conversations to train the model. We never hand it to
              an insurer, an employer, or a government unless you explicitly
              ask us to share a specific item.
            </p>
          </Section>

          <Section title="Your data travels with you">
            <p>
              Export to JSON or PDF and per-user delete are Phase 1
              features. In the demo you are using today, the{" "}
              <strong>Start fresh</strong> button clears everything on the
              server instantly. When the Phase 1 build goes live, deletes
              propagate to backups within thirty days.
            </p>
          </Section>

          <Section title="Your clinician can see it">
            <p>
              If you want, you can share your living state document with your
              treating physician. They see what you see. We never share
              without your explicit consent for each recipient.
            </p>
          </Section>

          <Section title="What happens if we change hands">
            <p>
              If Health Companion is ever acquired, sold, or wound down, your
              data cannot be used in any way you have not already consented
              to. The acquiring party inherits our commitment, not the right
              to renegotiate it. If they will not commit in writing, you get
              a one-click export and your data is deleted.
            </p>
          </Section>

          <Section title="Clinician-led content">
            <p>
              Every piece of clinical language the companion speaks is
              authored or reviewed by a practicing physician. You can see the
              source of any recommendation &mdash; we cite USPSTF, ACS,
              ACOG, NICE, NCCN, ACC/AHA, ADA, and Secretar&iacute;a de Salud
              M&eacute;xico inline.
            </p>
          </Section>

          <Section title="Questions?">
            <p>
              We answer every privacy question a user asks. Email{" "}
              <a
                href="mailto:privacy@healthcompanion.app"
                className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
              >
                privacy@healthcompanion.app
              </a>{" "}
              (placeholder).
            </p>
          </Section>
        </article>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="text-base italic leading-relaxed text-zinc-700">
            &ldquo;Privacy isn&rsquo;t a paragraph in the Terms. It is a place
            in the app.&rdquo;
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to companion
          </Link>
          <Link
            href="/how-this-works"
            className="text-sm font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline"
          >
            Read &ldquo;How this works&rdquo; &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6">
          <p className="text-xs leading-relaxed text-zinc-500">
            Wellness, not a medical device. Never diagnoses, never prescribes.
          </p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link
              href="/how-this-works"
              className="font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              How this works
            </Link>
            <Link
              href="/"
              className="text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-base leading-relaxed text-zinc-700 [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-zinc-700">
        {children}
      </div>
    </section>
  );
}
