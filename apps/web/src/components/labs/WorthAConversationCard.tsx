"use client";

// Surfaced by the LabDropZone flow *before* the full LabAnalysis lands
// when a single biomarker reads borderline / talk_to_doctor. The tone
// is amber ("worth a conversation"), not red — red is reserved for
// critical/emergency per the handoff's semantic-palette contract.

type Props = {
  /** Main 14px bold sentence — "Fasting glucose is a little above normal." */
  title: string;
  /** Optional mono-formatted metric, right-aligned in the header row. */
  metricValue?: string | null;
  /** Optional unit rendered after the value — "mg/dL". */
  metricUnit?: string | null;
  /** Prose body (13px) contextualizing the finding and next step. */
  body: string;
};

export function WorthAConversationCard({
  title,
  metricValue,
  metricUnit,
  body,
}: Props) {
  const metric =
    metricValue != null && metricValue.length > 0
      ? metricUnit
        ? `${metricValue} ${metricUnit}`
        : metricValue
      : null;

  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{
        background: "var(--hc-amber-bg)",
        borderColor: "var(--hc-amber-border)",
        borderWidth: "1px",
      }}
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span
          className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: "var(--hc-amber-fg)" }}
        >
          Worth a conversation
        </span>
        {metric && (
          <span
            className="font-mono text-[11px]"
            style={{ color: "var(--hc-amber-fg)" }}
          >
            {metric}
          </span>
        )}
      </div>
      <div className="mb-1 text-[14px] font-semibold leading-snug text-zinc-900">
        {title}
      </div>
      <div className="text-[13px] leading-[1.5] text-zinc-900/85">{body}</div>
    </div>
  );
}

export default WorthAConversationCard;
