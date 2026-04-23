"use client";

/**
 * Sparkline — tiny SVG trend line, no axes, for inline use in lists.
 *
 * Shares the same source-color vocabulary as TrendChart (blue dot for
 * objective / lab / wearable, amber for self-reported) but skips everything
 * that wouldn't be legible at 80×24.
 */

import type { TrendPoint } from "./TrendChart";

type Props = {
  points: TrendPoint[];
  width?: number;
  height?: number;
  referenceRange?: { min: number; max: number } | null;
};

const LINE = "#059669"; // emerald-600
const BAND = "#f4f4f5"; // zinc-100
const OBJECTIVE = "#1d4ed8"; // blue-700
const SUBJECTIVE = "#d97706"; // amber-600

function parseYmd(ymd: string | null): number | null {
  if (!ymd) return null;
  const t = Date.parse(`${ymd}T00:00:00Z`);
  return Number.isFinite(t) ? t : null;
}

export function Sparkline({
  points,
  width = 80,
  height = 24,
  referenceRange,
}: Props) {
  const dated = points.filter((p) => parseYmd(p.sampled_on) !== null);
  if (dated.length === 0) {
    return <span className="font-mono text-[10px] text-zinc-300">—</span>;
  }

  const values = dated.map((p) => p.value);
  const allVals = referenceRange
    ? [...values, referenceRange.min, referenceRange.max]
    : values;
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const yPad = (yMax - yMin) * 0.1 || 1;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const xs = dated.map((p) => parseYmd(p.sampled_on) as number);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);

  const PAD = 2;
  const plotW = width - PAD * 2;
  const plotH = height - PAD * 2;

  const sx = (t: number) =>
    xMax === xMin ? PAD + plotW / 2 : PAD + ((t - xMin) / (xMax - xMin)) * plotW;
  const sy = (v: number) =>
    yHi === yLo ? PAD + plotH / 2 : PAD + (1 - (v - yLo) / (yHi - yLo)) * plotH;

  const coords = dated.map((p) => ({
    point: p,
    x: sx(parseYmd(p.sampled_on) as number),
    y: sy(p.value),
  }));
  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const bandY1 = referenceRange ? sy(referenceRange.max) : null;
  const bandY2 = referenceRange ? sy(referenceRange.min) : null;
  const last = coords[coords.length - 1];
  const lastFill =
    last.point.source === "lab_report" || last.point.source === "wearable"
      ? OBJECTIVE
      : SUBJECTIVE;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="sparkline"
      style={{ display: "block", width, height }}
    >
      {bandY1 !== null && bandY2 !== null && (
        <rect
          x={PAD}
          y={Math.min(bandY1, bandY2)}
          width={plotW}
          height={Math.abs(bandY2 - bandY1)}
          fill={BAND}
          rx={1}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={LINE}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill={lastFill} stroke="#fff" strokeWidth={1} />
    </svg>
  );
}
