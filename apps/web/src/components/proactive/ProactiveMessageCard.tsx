"use client";

import type { ProactiveMessage } from "@/components/shared/types";

// ---------------------------------------------------------------------------
// Humanize snake_case context_refs into readable tags.
// Examples:
//   "family_history_breast_cancer_mother" -> "family history of breast
//     cancer (your mother)"
//   "pending_screening_mammography" -> "pending mammography screening"
//   "fasting_glucose_118_trend" -> "fasting glucose 118 trend"
// ---------------------------------------------------------------------------

const RELATIVE_WORDS = new Set([
  "mother",
  "father",
  "sister",
  "brother",
  "daughter",
  "son",
  "aunt",
  "uncle",
  "grandmother",
  "grandfather",
]);

const WORD_REWRITES: Record<string, string> = {
  hx: "history",
  fam: "family",
  htn: "hypertension",
  dm: "diabetes",
  hld: "hyperlipidemia",
  bp: "blood pressure",
  ldl: "LDL",
  hdl: "HDL",
  hba1c: "HbA1c",
  egfr: "eGFR",
  psa: "PSA",
  ecg: "ECG",
  ekg: "ECG",
};

export function humanizeContextRef(ref: string): string {
  const raw = ref.trim();
  if (!raw) return raw;

  const parts = raw.split("_").filter(Boolean);

  // family_history_<condition...>_<relative> → "family history of <condition> (your <relative>)"
  if (parts.length >= 3 && parts[0] === "family" && parts[1] === "history") {
    const last = parts[parts.length - 1];
    if (RELATIVE_WORDS.has(last)) {
      const middle = parts.slice(2, -1).join(" ");
      return middle
        ? `family history of ${middle} (your ${last})`
        : `family history (your ${last})`;
    }
  }

  // pending_screening_<kind> → "pending <kind> screening"
  if (parts.length >= 3 && parts[0] === "pending" && parts[1] === "screening") {
    return `pending ${parts.slice(2).join(" ")} screening`;
  }

  // screening_due_<kind> → "<kind> screening due"
  if (parts.length >= 3 && parts[0] === "screening" && parts[1] === "due") {
    return `${parts.slice(2).join(" ")} screening due`;
  }

  const rewritten = parts.map((p) => WORD_REWRITES[p.toLowerCase()] ?? p);
  return rewritten.join(" ");
}

// ---------------------------------------------------------------------------
// ProactiveMessageCard
// ---------------------------------------------------------------------------

type Props = {
  message: ProactiveMessage;
};

export function ProactiveMessageCard({ message }: Props) {
  const monthsLabel =
    message.months_later && message.months_later > 0
      ? `${message.months_later} months later`
      : "Proactive check-in";

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm">
        {/* Pill label */}
        <div className="flex items-center justify-between gap-2 border-b border-amber-100/80 bg-amber-100/40 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
              <circle cx="6" cy="6" r="3" fill="currentColor" />
            </svg>
            Proactive check-in
          </span>
          <span className="text-[11px] uppercase tracking-wider text-amber-700/80">
            {monthsLabel}
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-4 md:px-5 md:py-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-900 md:text-sm">
            {message.text}
          </p>

          {message.context_refs && message.context_refs.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/80">
                What we talked about last time
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {message.context_refs.map((ref) => (
                  <span
                    key={ref}
                    title={ref}
                    className="inline-flex items-center rounded-full border border-amber-200 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                  >
                    {humanizeContextRef(ref)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {message.next_step && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white/70 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/80">
                  Next step
                </div>
                <div className="mt-0.5 text-[13px] text-zinc-800">
                  {message.next_step}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  // Placeholder — no real calendar integration in MVP.
                  // eslint-disable-next-line no-alert
                  alert(
                    "Calendar integration is coming. For now, add this to your own calendar."
                  );
                }}
                className="inline-flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 text-[12px] font-medium text-amber-900 transition hover:bg-amber-50"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 2.75a.75.75 0 0 1 .75.75V4h5V3.5a.75.75 0 0 1 1.5 0V4h.75A2.25 2.25 0 0 1 17 6.25v9.5A2.25 2.25 0 0 1 14.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-9.5A2.25 2.25 0 0 1 5.25 4H6v-.5a.75.75 0 0 1 .75-.75Zm-1.5 5a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 0 0-1.5h-9.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                Add to calendar
              </button>
            </div>
          )}

          <p className="mt-4 text-[11px] text-amber-800/70">
            Your doctor will confirm timing and next steps.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProactiveMessageCard;
