"use client";

/**
 * TrendCard — card wrapper around a TrendChart.
 *
 * Shows the humanized biomarker label, the latest value in mono, a tiny
 * delta from the previous sample, and the chart itself. Matches the existing
 * Claude-Design surface tones (paper surface, zinc hairlines, emerald signal).
 */

import type { ReferenceRange, TrendPoint } from "./TrendChart";
import { TrendChart } from "./TrendChart";

export type TrendCardProps = {
  name: string;
  label: string;
  unit: string;
  referenceRange?: ReferenceRange | null;
  points: TrendPoint[];
  onPointClick?: (point: TrendPoint) => void;
};

function deltaText(latest: TrendPoint, prior: TrendPoint | null) {
  if (!prior) return null;
  const delta = latest.value - prior.value;
  if (delta === 0) return { sign: "", label: "no change", tone: "neutral" as const };
  const sign = delta > 0 ? "↑" : "↓";
  const abs = Math.abs(delta);
  const rounded = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return {
    sign,
    label: `${sign} ${rounded} ${latest.unit} since last`,
    tone: delta > 0 ? ("up" as const) : ("down" as const),
  };
}

function latestStatus(
  latest: TrendPoint | null,
  range: ReferenceRange | null | undefined,
): { label: string; chipClass: string } | null {
  if (!latest || !range) return null;
  if (latest.value < range.min) {
    return { label: "Below range", chipClass: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  if (latest.value > range.max) {
    return { label: "Above range", chipClass: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  return { label: "In range", chipClass: "bg-emerald-50 text-emerald-700 border-emerald-100" };
}

export function TrendCard({
  label,
  unit,
  referenceRange,
  points,
  onPointClick,
}: TrendCardProps) {
  const dated = points
    .filter((p) => typeof p.sampled_on === "string" && p.sampled_on)
    .slice()
    .sort((a, b) => (a.sampled_on ?? "").localeCompare(b.sampled_on ?? ""));
  const latest = dated.length > 0 ? dated[dated.length - 1] : null;
  const prior = dated.length > 1 ? dated[dated.length - 2] : null;
  const delta = latest ? deltaText(latest, prior) : null;
  const status = latestStatus(latest, referenceRange);

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900">{label}</h3>
          {referenceRange && (
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-500">
              Ref · {referenceRange.min}–{referenceRange.max} {referenceRange.unit || unit}
            </p>
          )}
          {!referenceRange && (
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-400">
              Personal metric
            </p>
          )}
        </div>
        {status && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${status.chipClass}`}
          >
            {status.label}
          </span>
        )}
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl tracking-tight text-zinc-900 tabular-nums">
          {latest ? latest.value : "—"}
        </span>
        <span className="font-mono text-xs text-zinc-500">{unit}</span>
      </div>
      {delta && (
        <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{delta.label}</p>
      )}

      <div className="mt-3 w-full overflow-hidden">
        <TrendChart
          points={points}
          unit={unit}
          referenceRange={referenceRange}
          onPointClick={onPointClick}
        />
      </div>

      <footer className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-3 text-[10.5px] font-mono uppercase tracking-[0.08em] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-700" /> Objective
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-600" /> Self-reported
        </span>
        <span className="ml-auto text-zinc-400">{dated.length} point{dated.length === 1 ? "" : "s"}</span>
      </footer>
    </article>
  );
}
