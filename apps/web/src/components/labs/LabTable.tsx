"use client";

import type { LabAnalysis, LabStatus, LabValue } from "@/components/shared/types";

// ---------------------------------------------------------------------------
// Status styling
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<
  LabStatus,
  { dot: string; pill: string; row: string; label: string }
> = {
  ok: {
    dot: "bg-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    row: "",
    label: "Normal",
  },
  borderline: {
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    row: "bg-amber-50/40",
    label: "Borderline",
  },
  out_of_range: {
    dot: "bg-orange-500",
    pill: "bg-orange-50 text-orange-800 border-orange-200",
    row: "bg-orange-50/50",
    label: "Out of range",
  },
  critical: {
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-800 border-red-200",
    row: "bg-red-50/60",
    label: "Critical",
  },
};

function StatusPill({ status }: { status: LabStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.ok;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        s.pill
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + s.dot} aria-hidden />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ConfidenceBadge — tiny pip, only rendered when a numeric confidence is
// present (0–1 expected). The backend does not emit this yet; we degrade
// silently when it's absent. TODO: wire once the schema adds `confidence`.
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence?: number | null }) {
  if (confidence == null || Number.isNaN(confidence)) return null;
  const pct = Math.max(0, Math.min(1, confidence));
  const label = `${Math.round(pct * 100)}%`;
  const color =
    pct >= 0.85
      ? "text-emerald-600"
      : pct >= 0.6
        ? "text-amber-600"
        : "text-orange-600";
  return (
    <span
      title={`Extraction confidence: ${label}`}
      className={"inline-flex items-center gap-1 text-[10px] font-medium " + color}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${pct * 31.4} 31.4`}
          strokeLinecap="round"
          transform="rotate(-90 6 6)"
        />
      </svg>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Value formatting
// ---------------------------------------------------------------------------

function formatValue(v: LabValue): string {
  if (v.value != null) {
    return `${v.value}${v.unit ? " " + v.unit : ""}`;
  }
  if (v.value_text) return v.value_text;
  return "—";
}

function formatDrawnOn(s?: string | null): string | null {
  if (!s) return null;
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

const SEVERITY_STYLES: Record<
  string,
  { pill: string; label: string }
> = {
  info: { pill: "bg-zinc-100 text-zinc-700 border-zinc-200", label: "Info" },
  watch: { pill: "bg-amber-50 text-amber-800 border-amber-200", label: "Watch" },
  talk_to_doctor: {
    pill: "bg-orange-50 text-orange-800 border-orange-200",
    label: "Talk to your doctor",
  },
  urgent: { pill: "bg-red-50 text-red-800 border-red-200", label: "Urgent" },
};

// ---------------------------------------------------------------------------
// LabTable
// ---------------------------------------------------------------------------

export function LabTable({ analysis }: { analysis: LabAnalysis }) {
  const drawnOn = formatDrawnOn(analysis.drawn_on);
  // Defensive: older or partial analyses may not carry every array. Normalize
  // so every array is iterable and counts render as 0 rather than crashing.
  const values = Array.isArray(analysis.values) ? analysis.values : [];
  const flags = Array.isArray(analysis.flags) ? analysis.flags : [];
  const trends = Array.isArray(analysis.trends) ? analysis.trends : [];
  const doctorQuestions = Array.isArray(analysis.doctor_questions)
    ? analysis.doctor_questions
    : [];

  return (
    <div className="flex w-full flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">
            Lab results{analysis.laboratory ? ` · ${analysis.laboratory}` : ""}
          </h3>
          {drawnOn && (
            <p className="text-xs text-zinc-500">Drawn on {drawnOn}</p>
          )}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">
          {values.length} value{values.length === 1 ? "" : "s"}
        </span>
      </header>

      {/* Table — desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-2 font-semibold">Test</th>
              <th className="px-3 py-2 font-semibold">Value</th>
              <th className="px-3 py-2 font-semibold">Reference</th>
              <th className="px-5 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {values.map((v, i) => {
              const s = STATUS_STYLES[v.status] ?? STATUS_STYLES.ok;
              return (
                <tr
                  key={`${v.test}-${i}`}
                  className={
                    "border-t border-zinc-100 align-top " + s.row
                  }
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-zinc-900">{v.test}</div>
                      <ConfidenceBadge confidence={v.confidence} />
                    </div>
                    {v.interpretation && (
                      <div className="mt-1 text-[12px] leading-snug text-zinc-600">
                        {v.interpretation}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-zinc-900">
                    {formatValue(v)}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500">
                    {v.reference_range ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={v.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stacked cards — mobile */}
      <div className="space-y-2 px-4 py-3 md:hidden">
        {values.map((v, i) => {
          const s = STATUS_STYLES[v.status] ?? STATUS_STYLES.ok;
          return (
            <div
              key={`${v.test}-${i}`}
              className={
                "rounded-lg border border-zinc-200 bg-white px-3 py-3 " + s.row
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {v.test}
                    </div>
                    <ConfidenceBadge confidence={v.confidence} />
                  </div>
                  <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-zinc-900">
                    {formatValue(v)}
                  </div>
                  {v.reference_range && (
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      Ref: {v.reference_range}
                    </div>
                  )}
                </div>
                <StatusPill status={v.status} />
              </div>
              {v.interpretation && (
                <div className="mt-2 text-[12px] leading-snug text-zinc-600">
                  {v.interpretation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel summary */}
      {analysis.panel_summary && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            What this means
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
            {analysis.panel_summary}
          </div>
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Flags
          </div>
          <div className="mt-2 space-y-2">
            {flags.map((f, i) => {
              const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.info;
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-start gap-2 rounded-md bg-zinc-50 px-3 py-2 text-[13px] text-zinc-700"
                >
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
                      sev.pill
                    }
                  >
                    {sev.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div>{f.message}</div>
                    {f.value_refs.length > 0 && (
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        Refers to: {f.value_refs.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends */}
      {trends.length > 0 && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Trends
          </div>
          <div className="mt-2 space-y-2">
            {trends.map((t, i) => (
              <div
                key={i}
                className="rounded-md bg-zinc-50 px-3 py-2 text-[13px] text-zinc-700"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium text-zinc-900">{t.test}</div>
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                    {t.direction}
                  </div>
                </div>
                <div className="mt-0.5">{t.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor questions */}
      {doctorQuestions.length > 0 && (
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Questions for your doctor
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-zinc-700">
            {doctorQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-zinc-100 px-5 py-3 text-[11px] text-zinc-400">
        This is not a medical diagnosis. Your doctor will interpret these
        results in context.
      </p>
    </div>
  );
}

export default LabTable;
