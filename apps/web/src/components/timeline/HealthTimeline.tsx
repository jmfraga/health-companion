"use client";

import { useMemo, useState } from "react";

import { LabTable } from "@/components/labs/LabTable";
import { ProactiveMessageCard } from "@/components/proactive/ProactiveMessageCard";
import type {
  LabAnalysis,
  ProactiveMessage,
  TimelineEvent,
} from "@/components/shared/types";

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

function formatOccurredOnLong(s?: string | null): string {
  if (!s) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function eventKey(e: TimelineEvent): string {
  return `${e.event_type}|${e.occurred_on}|${e.created_at}`;
}

// ---------------------------------------------------------------------------
// Payload summaries (collapsed-row tagline)
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
// Per-event-type detail renderers
// ---------------------------------------------------------------------------

function isLabAnalysis(v: unknown): v is LabAnalysis {
  if (!v || typeof v !== "object") return false;
  const a = v as Record<string, unknown>;
  return Array.isArray(a.values) && typeof a.panel_summary === "string";
}

function LabReportDetail({
  payload,
  occurredOn,
}: {
  payload: Record<string, unknown>;
  occurredOn?: string | null;
}) {
  const analysis = payload.analysis;
  const laboratory = (payload.laboratory as string | undefined) ?? null;
  const fileName = (payload.file_name as string | undefined) ?? null;
  const note = (payload.note as string | undefined) ?? null;
  const summary = (payload.summary as string | undefined) ?? null;
  const headerDate = formatOccurredOnLong(occurredOn);

  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">
        Read on {headerDate}
        {laboratory ? ` · ${laboratory}` : ""}
        {fileName ? ` · ${fileName}` : ""}
      </div>
      {isLabAnalysis(analysis) ? (
        <LabTable analysis={analysis} />
      ) : summary ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[13px] leading-relaxed text-zinc-700">
          {summary}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[12px] italic text-zinc-500">
          The full analysis is no longer attached to this entry.
        </div>
      )}
      {note && (
        <div className="rounded-md bg-zinc-50 px-3 py-2 text-[12px] leading-snug text-zinc-600">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Note
          </div>
          <div className="mt-0.5">{note}</div>
        </div>
      )}
    </div>
  );
}

function isProactiveMessage(v: unknown): v is ProactiveMessage {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return typeof m.text === "string";
}

function ProactiveMessageDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  if (!isProactiveMessage(payload)) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[12px] italic text-zinc-500">
        No proactive message content on record.
      </div>
    );
  }
  const message: ProactiveMessage = {
    text: payload.text as string,
    context_refs: Array.isArray(payload.context_refs)
      ? (payload.context_refs as string[])
      : [],
    next_step:
      typeof payload.next_step === "string"
        ? (payload.next_step as string)
        : "",
    months_later:
      typeof payload.months_later === "number"
        ? (payload.months_later as number)
        : undefined,
  };
  return <ProactiveMessageCard message={message} />;
}

function ScreeningScheduledDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const kind = payload.kind as string | undefined;
  const recommendedBy = payload.recommended_by as string | undefined;
  const dueBy = payload.due_by as string | undefined;
  const rationale = payload.rationale as string | undefined;

  return (
    <dl className="space-y-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[13px] text-zinc-700">
      <div className="flex flex-wrap gap-x-2">
        <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Screening
        </dt>
        <dd className="min-w-0 flex-1 text-zinc-900">
          {kind ? humanize(kind) : "—"}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2">
        <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Recommended by
        </dt>
        <dd className="min-w-0 flex-1">{recommendedBy ?? "—"}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2">
        <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Due by
        </dt>
        <dd className="min-w-0 flex-1 tabular-nums">
          {dueBy ? formatOccurredOnLong(dueBy) : "No specific date"}
        </dd>
      </div>
      {rationale && (
        <div className="flex flex-wrap gap-x-2">
          <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Rationale
          </dt>
          <dd className="min-w-0 flex-1 leading-snug">{rationale}</dd>
        </div>
      )}
    </dl>
  );
}

function OnboardingDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const summary = (payload.summary as string | undefined) ?? "Profile started";
  const snapshot = payload.profile_snapshot;
  const entries =
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
      ? Object.entries(snapshot as Record<string, unknown>)
      : [];

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-[13px] leading-relaxed text-zinc-700">
        {summary}
      </p>
      {entries.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Profile at that moment
          </div>
          <ul className="mt-2 space-y-1 text-[12px] text-zinc-700">
            {entries.map(([k, v]) => (
              <li key={k} className="flex flex-wrap gap-x-2">
                <span className="w-28 shrink-0 font-mono text-[11px] text-zinc-500">
                  {k}
                </span>
                <span className="min-w-0 flex-1 break-words font-mono text-zinc-900">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UnknownDetail({ payload }: { payload: Record<string, unknown> }) {
  let body: string;
  try {
    body = JSON.stringify(payload, null, 2);
  } catch {
    body = String(payload);
  }
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Raw details
      </div>
      <pre className="mt-1 max-w-full overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-zinc-700">
        {body}
      </pre>
    </div>
  );
}

function renderDetail(event: TimelineEvent) {
  const payload = event.payload ?? {};
  switch (event.event_type) {
    case "lab_report":
      return <LabReportDetail payload={payload} occurredOn={event.occurred_on} />;
    case "proactive_message":
      return <ProactiveMessageDetail payload={payload} />;
    case "screening_scheduled":
      return <ScreeningScheduledDetail payload={payload} />;
    case "onboarding":
      return <OnboardingDetail payload={payload} />;
    default:
      return <UnknownDetail payload={payload} />;
  }
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
  // Newest first — flip the comparator so the most recent entry sits on top.
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const ao = a.occurred_on ?? "";
      const bo = b.occurred_on ?? "";
      if (ao !== bo) return bo.localeCompare(ao);
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });
  }, [events]);

  // Single-open accordion: track the key of the currently expanded row, or
  // null when everything is collapsed. One-at-a-time keeps scroll disciplined
  // on mobile and on the desktop side column.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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
            const key = eventKey(e);
            const flashing = recentlyAdded.has(key);
            const expanded = expandedKey === key;
            const summary = summarizePayload(e.event_type, e.payload ?? {});
            const detailId = `timeline-detail-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

            return (
              <li key={key} className="relative">
                <span
                  aria-hidden
                  className={
                    "absolute -left-[13px] top-3 h-3 w-3 rounded-full ring-2 ring-white " +
                    s.dot
                  }
                />
                <div
                  className={
                    "rounded-lg border transition-colors " +
                    (flashing
                      ? "border-emerald-300 bg-emerald-50"
                      : expanded
                        ? "border-zinc-300 bg-white"
                        : "border-zinc-200 bg-zinc-50")
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedKey((cur) => (cur === key ? null : key))
                    }
                    aria-expanded={expanded}
                    aria-controls={detailId}
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={
                        "mt-[5px] h-3 w-3 shrink-0 text-zinc-400 transition-transform " +
                        (expanded ? "rotate-90" : "rotate-0")
                      }
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.44 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l3.75 4.25a.75.75 0 0 1 0 1.04l-3.75 4.25a.75.75 0 0 1-1.1.02Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="min-w-0 flex-1">
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
                    </div>
                  </button>
                  {expanded && (
                    <div
                      id={detailId}
                      className="border-t border-zinc-200 px-3 py-3 pl-6 sm:pl-7"
                    >
                      {renderDetail(e)}
                    </div>
                  )}
                </div>
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
