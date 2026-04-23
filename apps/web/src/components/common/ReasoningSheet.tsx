"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Card } from "@/components/ui/card";

type Props = {
  open: boolean;
  onClose: () => void;
  reasoning?: string | null;
  /** Optional headline — falls back to "See reasoning". */
  title?: string;
  /** Optional subtitle — falls back to one-line why. */
  subtitle?: string;
};

/**
 * First-sentence helper used to synthesize a proposal summary when the
 * backend doesn't ship a dedicated `summary` field. Returns a cleaned
 * 1–2 sentence paragraph taken from the top of `reasoning`.
 */
function synthesizeProposal(reasoning: string | null | undefined): string {
  if (!reasoning) {
    return "A short, gentle plan based on what you've shared so far. We will pace this together — nothing urgent, nothing scary.";
  }
  const cleaned = reasoning.trim().replace(/^([#>*\-]+\s*)+/, "");
  // First two sentences.
  const pieces = cleaned.split(/(?<=[.!?])\s+/);
  const firstTwo = pieces.slice(0, 2).join(" ").trim();
  return firstTwo || cleaned.slice(0, 280);
}

/**
 * Best-effort extraction of likely sources the clinical orchestrator
 * leans on. If the reasoning text mentions any known guideline, surface
 * it; otherwise fall back to the demo defaults.
 */
function extractSources(reasoning: string | null | undefined): string[] {
  const defaults = [
    "USPSTF 2024 — breast cancer screening",
    "NCCN v.2.2025 — high-risk assessment",
    "Dr. Fraga's clinical voice guide (internal)",
  ];
  if (!reasoning) return defaults;
  const r = reasoning.toLowerCase();
  const hits: string[] = [];
  if (r.includes("uspstf")) hits.push("USPSTF 2024 — breast cancer screening");
  if (r.includes("nccn")) hits.push("NCCN v.2.2025 — high-risk assessment");
  if (r.includes("ada") || r.includes("a1c"))
    hits.push("ADA 2024 — Standards of Care");
  if (r.includes("ascvd") || r.includes("cholesterol"))
    hits.push("ACC/AHA 2019 — ASCVD prevention");
  if (hits.length === 0) return defaults;
  hits.push("Dr. Fraga's clinical voice guide (internal)");
  return hits;
}

/**
 * ReasoningSheet — iOS-style sheet (mobile) / centered modal (desktop)
 * revealing Opus 4.7's extended thinking for a turn or card. This is the
 * FDA-wellness safety surface: sources must be named, disclaimer must stay.
 */
export function ReasoningSheet({
  open,
  onClose,
  reasoning,
  title = "See reasoning",
  subtitle,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);

  const proposal = synthesizeProposal(reasoning);
  const sources = extractSources(reasoning);

  return (
    <div
      className={
        "fixed inset-0 z-50 " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={
          "absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity " +
          (open ? "opacity-100" : "opacity-0")
        }
        style={{ transitionDuration: "240ms" }}
      />
      {/* Panel container — sheet on mobile, centered card on desktop */}
      <div
        className={
          "absolute inset-0 flex items-end justify-center md:items-center " +
          (open ? "" : "pointer-events-none")
        }
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={
            "flex w-full flex-col bg-white shadow-xl outline-none transition-transform ease-out dark:bg-zinc-950 " +
            "max-h-[90dvh] rounded-t-2xl md:max-h-[90vh] md:w-[640px] md:max-w-[92vw] md:rounded-2xl " +
            (open
              ? "translate-y-0 md:opacity-100"
              : "translate-y-full md:translate-y-0 md:opacity-0")
          }
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            transitionDuration: "240ms",
          }}
        >
          {/* Grab handle on mobile */}
          <div className="flex justify-center pt-2 md:hidden">
            <div className="h-1 w-10 shrink-0 rounded-full bg-zinc-300" />
          </div>
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-zinc-200 px-5 py-3 md:py-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
            {/* 1 — Thinking (mono) */}
            <Card
              size="sm"
              className="ring-zinc-200"
              style={{ background: "var(--hc-amber-bg, #fafaf9)" }}
            >
              <div className="px-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Thinking · Opus 4.7
                </div>
                <div
                  className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-[1.55] text-zinc-800"
                  style={{ fontFamily: "var(--font-geist-mono, ui-monospace)" }}
                >
                  {reasoning && reasoning.trim().length > 0
                    ? reasoning
                    : "The companion is still gathering its thoughts. Reasoning will appear here as it streams in."}
                </div>
              </div>
            </Card>

            {/* 2 — What I'm proposing */}
            <Card size="sm" className="ring-zinc-200">
              <div className="px-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  What I&apos;m proposing
                </div>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-zinc-900">
                  {proposal}
                </p>
              </div>
            </Card>

            {/* 3 — Sources (blue) */}
            <Card
              size="sm"
              className="ring-0"
              style={{
                background: "var(--hc-blue-bg)",
                boxShadow: "inset 0 0 0 1px var(--hc-blue-border)",
              }}
            >
              <div className="px-4">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--hc-blue-fg)" }}
                >
                  Sources I&apos;m leaning on
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-[1.6] text-zinc-900">
                  {sources.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* 4 — Disclaimer (amber) */}
            <Card
              size="sm"
              className="ring-0"
              style={{
                background: "var(--hc-amber-bg)",
                boxShadow: "inset 0 0 0 1px var(--hc-amber-border)",
              }}
            >
              <div className="px-4">
                <p className="text-[12.5px] leading-[1.55] text-zinc-900">
                  <b>I&apos;m not a doctor.</b> I&apos;m educating and
                  referring — the final call is yours and your physician&apos;s.
                  If something here doesn&apos;t fit your situation, say so, and
                  I&apos;ll adjust what I remember.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReasoningSheet;
