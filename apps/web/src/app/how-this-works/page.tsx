import type { Metadata } from "next";
import Link from "next/link";

// NOTE: Small inline helpers (Section, etc.) live here for now because this
// is a server component with no shared static-page utilities yet. If a main
// polish agent creates a shared `components/static/*` module later, dedupe
// these with the twin in `privacy/page.tsx`.

export const metadata: Metadata = {
  title: "How this works · Health Companion",
  description:
    "What we are, what we aren't, and what we cite.",
};

export default function HowThisWorksPage() {
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
            Explicability
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            How this works
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 sm:text-lg">
            What we are, what we aren&rsquo;t, and what we cite.
          </p>
        </div>

        <article className="space-y-8">
          <Section title="The model">
            <p>
              Health Companion runs on{" "}
              <strong className="font-semibold text-zinc-900">
                Claude Opus 4.7
              </strong>{" "}
              from Anthropic. Opus is a large language model; it can read and
              reason over clinical text and images (your lab PDFs, for
              example). We do not train the model on your data.
            </p>
          </Section>

          <Section title="What it reads">
            <p>
              Every preventive recommendation the companion makes is grounded
              in published guidelines. We cite the source inline &mdash;
              USPSTF, ACS, ACOG, NICE, NCCN, ACC/AHA, ADA, and
              Secretar&iacute;a de Salud M&eacute;xico. If we are not sure
              about the current recommendation, we say so and point you to
              your doctor.
            </p>
          </Section>

          <Section title="See reasoning">
            <p>
              Any clinical turn has an audit layer. You can expand &ldquo;See
              reasoning&rdquo; and watch the model&rsquo;s thought process
              &mdash; the same note a clinician might jot on your chart. This
              is optional (off by default; toggle it in Settings) because
              most turns do not need it. It is always available, though, and
              it is always logged so your doctor can review it if you share.
            </p>
          </Section>

          <Section title="What we never do">
            <p>
              We do not diagnose. We do not prescribe. We do not recommend
              starting, stopping, or adjusting any medication. We never
              replace the doctor. We always refer.
            </p>
          </Section>

          <Section title="What a “good day” means here">
            <p>
              We prefer calibrated caution over automatic positive
              reinforcement. One good lab value is not a problem solved; one
              good night of sleep is not a recovery. We celebrate actions you
              took &mdash; not outcomes that are still preliminary.
            </p>
          </Section>

          <Section title="Who reviewed this">
            <p>
              Dr. Juan Manuel Fraga Sastr&iacute;as &mdash; general physician,
              director of a cancer center, educator and tech enthusiast.
              Every clinical string is authored or reviewed by a practicing
              physician. The review log is part of the product.
            </p>
          </Section>

          <Section title="When to call a doctor or emergency services">
            <p>
              Do not use the companion in an emergency. Call your local
              emergency number or go to the nearest emergency room if you
              have any of these:
            </p>
            <ul className="mt-3 space-y-1.5 pl-5 [list-style-type:disc] marker:text-zinc-400">
              <li>Chest pain on exertion</li>
              <li>Stroke signs (face droop, arm weakness, speech trouble)</li>
              <li>Severe shortness of breath</li>
              <li>Fainting</li>
              <li>Severe abdominal pain</li>
              <li>Suicidal ideation</li>
              <li>
                Any gut feeling that says &ldquo;this is urgent&rdquo;
              </li>
            </ul>
            <p className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700">
              Tap the{" "}
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                Emergency
              </span>{" "}
              pill anywhere in the app to see regional emergency and
              mental-health crisis numbers for your location.
            </p>
          </Section>
        </article>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            href="/privacy"
            className="text-sm font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline"
          >
            Read &ldquo;About your privacy&rdquo; &rarr;
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
              href="/privacy"
              className="font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              About your privacy
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
