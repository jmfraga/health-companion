"use client";

import { useMemo } from "react";

import type { TimelineEvent } from "@/components/shared/types";

// ---------------------------------------------------------------------------
// Event styling
// ---------------------------------------------------------------------------

const EVENT_STYLES: Record<
  string,
  { label: string; dot: string; ring: string; chip: string }
> = {
  onboarding: {
    label: "Onboarding",
    dot: "bg-zinc-400",
    ring: "ring-zinc-200",
    chip: "bg-zinc-100 text-zinc-700",
  },
  screening_scheduled: {
    label: "Screening scheduled",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    chip: "bg-emerald-50 text-emerald-700",
  },
  lab_report: {
    label: "Lab report",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
    chip: "bg-blue-50 text-blue-700",
  },
  proactive_message: {
    label: "Proactive check-in",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    chip: "bg-amber-50 text-amber-800",
  },
};

function styleFor(eventType: string) {
  return (
    EVENT_STYLES[eventType] ?? {
      label: humanize(eventType),
      dot: "bg-zinc-400",
      ring: "ring-zinc-200",
      chip: "bg-zinc-100 text-zinc-700",
    }
  );
}

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatOccurredOn(s?: string | null): string {
  if (!s) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function eventKey(e: TimelineEvent): string {
  return `${e.event_type}|${e.occurred_on}|${e.created_at}`;
}

// ---------------------------------------------------------------------------
// Payload summaries
// ---------------------------------------------------------------------------

function summarizePayload(
  eventType: string,
  payload: Record<string, unknown>
): string {
  if (!payload) return "";

  if (eventType === "lab_report") {
    const lab = payload.laboratory as string | undefined;
    const count = payload.biomarker_count as number | undefined;
    const file = payload.file_name as string | undefined;
    const parts: string[] = [];
    if (lab) parts.push(lab);
    if (typeof count === "number") parts.push(`${count} biomarkers`);
    if (!parts.length && file) parts.push(file);
    return parts.join(" · ");
  }

  if (eventType === "proactive_message") {
    const text = payload.text as string | undefined;
    if (typeof text === "string" && text.length > 0) {
      return text.length > 160 ? text.slice(0, 157) + "…" : text;
    }
    const next = payload.next_step as string | undefined;
    return next ?? "";
  }

  if (eventType === "screening_scheduled") {
    const kind = payload.kind as string | undefined;
    const rec = payload.recommended_by as string | undefined;
    return [kind ? humanize(kind) : null, rec].filter(Boolean).join(" · ");
  }

  if (eventType === "onboarding") {
    const summary = payload.summary as string | undefined;
    return summary ?? "Profile started";
  }

  const summary = payload.summary as string | undefined;
  if (typeof summary === "string") return summary;

  const text = payload.text as string | undefined;
  if (typeof text === "string") return text;

  return "";
}

// ---------------------------------------------------------------------------
// HealthTimeline
// ---------------------------------------------------------------------------

type Props = {
  events: TimelineEvent[];
  recentlyAdded: Set<string>;
  title?: string;
  subtitle?: string;
  /** When true, omit the outer bordered card — used inside the bottom sheet. */
  embedded?: boolean;
};

export function HealthTimeline({
  events,
  recentlyAdded,
  title = "Timeline",
  subtitle = "Everything your companion remembers.",
  embedded = false,
}: Props) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const ao = a.occurred_on ?? "";
      const bo = b.occurred_on ?? "";
      if (ao !== bo) return ao.localeCompare(bo);
      return (a.created_at ?? "").localeCompare(b.created_at ?? "");
    });
  }, [events]);

  const body = (
    <div className="px-5 py-4">
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-400">
          Nothing here yet. Your story will build as you talk.
        </p>
      ) : (
        <ol className="relative space-y-4 pl-6">
          {/* vertical rail */}
          <span
            aria-hidden
            className="absolute left-[9px] top-1 bottom-1 w-px bg-zinc-200"
          />
          {sorted.map((e) => {
            const s = styleFor(e.event_type);
            const flashing = recentlyAdded.has(eventKey(e));
            const summary = summarizePayload(e.event_type, e.payload ?? {});
            return (
              <li
                key={eventKey(e)}
                className={
                  "relative rounded-lg border px-3 py-2.5 transition-colors " +
                  (flashing
                    ? "border-amber-300 bg-amber-50/60"
                    : "border-zinc-200 bg-zinc-50")
                }
              >
                <span
                  aria-hidden
                  className={
                    "absolute -left-[22px] top-3 h-3 w-3 rounded-full ring-2 ring-white " +
                    s.dot +
                    " " +
                    "ring-offset-0"
                  }
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    className={
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium " +
                      s.chip
                    }
                  >
                    {s.label}
                  </span>
                  <time className="text-[11px] tabular-nums text-zinc-500">
                    {formatOccurredOn(e.occurred_on)}
                  </time>
                </div>
                {summary && (
                  <div className="mt-1.5 text-[13px] leading-snug text-zinc-700">
                    {summary}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      {body}
    </div>
  );
}

export default HealthTimeline;
