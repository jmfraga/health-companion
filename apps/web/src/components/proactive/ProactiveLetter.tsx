"use client";

import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";

import type { ProactiveMessage } from "@/components/shared/types";
import { humanizeContextRef } from "@/components/proactive/ProactiveMessageCard";

// ---------------------------------------------------------------------------
// ProactiveLetter — the full-height three-months-later landing that
// replaces ProactiveMessageCard in the transcript when `months_later
// >= 3`. The timeline drill-down and the in-thread card for shorter
// gaps still use ProactiveMessageCard.
// ---------------------------------------------------------------------------

type Props = {
  message: ProactiveMessage;
  /** The user's first name — falls back to "friend". */
  firstName?: string | null;
  /** Dismiss affordance (the top-right X). */
  onClose?: () => void;
  /** Optional handler for the primary action button. Defaults to an
   *  honest inline toast — there is no calendar integration yet. */
  onPrimary?: () => void;
};

// Split the proactive text into 2–3 paragraphs. Prefer real line
// breaks; otherwise split on sentence boundary so the third paragraph
// can take the muted tone the design spec calls for.
function splitBody(text: string): string[] {
  const byLines = text
    .split(/\n\s*\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byLines.length >= 2) return byLines.slice(0, 3);

  // Fallback: split on sentence boundaries.
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length >= 3) {
    // Pack first two sentences into P1, third into P2, rest into P3.
    return [
      sentences.slice(0, 2).join(" "),
      sentences[2],
      sentences.slice(3).join(" ") || "",
    ].filter(Boolean);
  }
  return [text];
}

// Short mono timestamp for the top-left header. We use "today at HH:MM"
// so the demo looks live; the real future-app would pin this to when
// the proactive was sent.
function nowStamp(): string {
  const d = new Date();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day} · ${hh}:${mm}`;
}

export function ProactiveLetter({
  message,
  firstName,
  onClose,
  onPrimary,
}: Props) {
  const name = (firstName ?? "").trim() || "friend";
  const paragraphs = splitBody(message.text ?? "");

  // Inline toast state — we don't have real calendar integration yet, so
  // the primary CTA surfaces an honest note instead of an alert().
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handlePrimary =
    onPrimary ??
    (() => {
      setToast(
        "No calendar integration yet. Add this to your own calendar when you can.",
      );
    });

  // Fallback copy is deliberately generic — the real next_step comes from
  // the backend for the specific user. A disease-specific fallback once
  // surfaced "Hold a mammography slot" to users who had nothing to do
  // with breast cancer.
  const nextStep = message.next_step?.trim() || "Put this on your calendar";

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-amber-200 shadow-sm"
      style={{
        background: "linear-gradient(180deg, #fefce8 0%, #ffffff 55%)",
      }}
    >
      {/* Header: date stamp + close */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-zinc-500">
          {nowStamp()}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-[18px] w-[18px]" aria-hidden />
          </button>
        )}
      </div>

      <div className="px-[22px] pb-8 pt-3">
        {/* Three-months-later pill */}
        <div className="mb-[18px]">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
            style={{
              background: "var(--hc-amber-bg)",
              color: "var(--hc-amber-fg)",
              border: "0.5px solid var(--hc-amber-border)",
            }}
          >
            <span
              aria-hidden
              className="h-[5px] w-[5px] rounded-full bg-current"
            />
            Three months later
          </span>
        </div>

        {/* Greeting */}
        <div className="mb-[18px] text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900 md:text-[28px]">
          Good morning, {name}.
        </div>

        {/* Body paragraphs */}
        <div className="flex flex-col gap-3.5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                "m-0 text-[16px] leading-[1.6] " +
                (i === 2 ? "text-zinc-500" : "text-zinc-900")
              }
            >
              {p}
            </p>
          ))}
        </div>

        {/* What I'm holding onto */}
        {message.context_refs && message.context_refs.length > 0 && (
          <div
            className="mt-5 rounded-xl border px-3.5 py-3"
            style={{
              background: "var(--hc-amber-bg)",
              borderColor: "var(--hc-amber-border)",
            }}
          >
            <div
              className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "var(--hc-amber-fg)" }}
            >
              What I&apos;m holding onto
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.context_refs.map((ref) => (
                <span
                  key={ref}
                  title={ref}
                  className="inline-flex rounded-full px-[9px] py-[4px] text-[11.5px] font-medium text-zinc-900"
                  style={{
                    background: "rgba(255, 255, 255, 0.7)",
                    border: "0.5px solid var(--hc-amber-border)",
                  }}
                >
                  {humanizeContextRef(ref)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Primary action — the only button on the letter. No secondary
            or dismiss rails; both used to ship as dead copy ("both
            clinics" / "not now") that had no real handlers. The honest
            path is one CTA the user can take right now. */}
        <div className="mt-[18px]">
          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--hc-accent-600)] px-5 text-[15px] font-semibold text-white transition hover:bg-[var(--hc-accent-700)]"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            {nextStep}
          </button>
          {toast && (
            <div
              role="status"
              aria-live="polite"
              className="mt-2 rounded-xl border px-3.5 py-2 text-[12.5px]"
              style={{
                background: "var(--hc-amber-bg)",
                borderColor: "var(--hc-amber-border)",
                color: "var(--hc-amber-fg)",
              }}
            >
              {toast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProactiveLetter;
