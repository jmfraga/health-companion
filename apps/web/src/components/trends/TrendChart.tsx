"use client";

/**
 * TrendChart — minimal SVG time-series for a single biomarker.
 *
 * No chart library. The styling hews to the Apple-Health / Things-3 editorial
 * aesthetic already set by Claude Design: zinc base, Geist Mono for values
 * and dates, emerald line for the series, zinc-100 band for the reference
 * range, and source-coded dots (blue for objective / lab / wearable, amber
 * for chat-reported / photo). See ROADMAP §16b — *a trend line is memory you
 * can see*.
 */

import { useMemo } from "react";

export type TrendPoint = {
  value: number;
  unit: string;
  sampled_on: string | null;
  source: "lab_report" | "wearable" | "user_said" | "photo" | string;
  idx: number;
};

export type ReferenceRange = {
  min: number;
  max: number;
  unit: string;
};

export type TrendChartProps = {
  points: TrendPoint[];
  unit: string;
  referenceRange?: ReferenceRange | null;
  width?: number;
  height?: number;
  onPointClick?: (point: TrendPoint) => void;
};

// ── color map ──────────────────────────────────────────────────────────────
// Stays in-file so a future swap for semantic tokens is a one-diff change.
const OBJECTIVE_FILL = "#1d4ed8"; // blue-700
const SUBJECTIVE_FILL = "#d97706"; // amber-600
const LINE_STROKE = "#059669"; // emerald-600
const BAND_FILL = "#f4f4f5"; // zinc-100
const AXIS = "#a1a1aa"; // zinc-400

function dotFill(source: string): string {
  if (source === "lab_report" || source === "wearable") return OBJECTIVE_FILL;
  return SUBJECTIVE_FILL;
}

function parseYmd(ymd: string | null): number | null {
  if (!ymd) return null;
  const t = Date.parse(`${ymd}T00:00:00Z`);
  return Number.isFinite(t) ? t : null;
}

function formatShortDate(ymd: string | null): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return ymd;
  const month = d.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${month} ${d.getUTCDate()}`;
}

// Nudge the y-axis range outward so the line never hugs the edges, and so a
// reference band is always visible even when every point sits inside it.
function yDomain(
  points: TrendPoint[],
  range: ReferenceRange | null | undefined,
): [number, number] {
  const values: number[] = points.map((p) => p.value);
  if (range) {
    values.push(range.min);
    values.push(range.max);
  }
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.15;
  return [min - pad, max + pad];
}

export function TrendChart({
  points,
  unit,
  referenceRange,
  width = 320,
  height = 180,
  onPointClick,
}: TrendChartProps) {
  const PAD = { top: 16, right: 20, bottom: 28, left: 44 };

  const plot = useMemo(() => {
    const dated = points.filter((p) => parseYmd(p.sampled_on) !== null);
    if (dated.length === 0) {
      return null;
    }
    const xs = dated.map((p) => parseYmd(p.sampled_on) as number);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const [yMin, yMax] = yDomain(dated, referenceRange);

    const plotW = width - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;

    const scaleX = (t: number) => {
      if (xMax === xMin) return PAD.left + plotW / 2;
      return PAD.left + ((t - xMin) / (xMax - xMin)) * plotW;
    };
    const scaleY = (v: number) => {
      if (yMax === yMin) return PAD.top + plotH / 2;
      return PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
    };

    const coords = dated.map((p) => ({
      point: p,
      x: scaleX(parseYmd(p.sampled_on) as number),
      y: scaleY(p.value),
    }));

    let bandY1: number | null = null;
    let bandY2: number | null = null;
    if (referenceRange) {
      bandY1 = scaleY(referenceRange.max);
      bandY2 = scaleY(referenceRange.min);
    }

    return {
      coords,
      yMin,
      yMax,
      xMin,
      xMax,
      bandY1,
      bandY2,
      plotW,
      plotH,
    };
  }, [points, referenceRange, width, height, PAD.left, PAD.right, PAD.top, PAD.bottom]);

  if (!plot) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-400"
        style={{ width, height }}
      >
        No dated points yet
      </div>
    );
  }

  const pathD = plot.coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const firstDate = plot.coords[0].point.sampled_on;
  const lastDate = plot.coords[plot.coords.length - 1].point.sampled_on;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Trend chart with ${plot.coords.length} point(s)`}
      style={{ display: "block", width: "100%", height: "auto", maxWidth: width }}
    >
      {/* Reference band */}
      {plot.bandY1 !== null && plot.bandY2 !== null && (
        <rect
          x={PAD.left}
          y={Math.min(plot.bandY1, plot.bandY2)}
          width={plot.plotW}
          height={Math.abs(plot.bandY2 - plot.bandY1)}
          fill={BAND_FILL}
          rx={2}
        />
      )}

      {/* y-axis labels (min / max of domain) */}
      <text
        x={PAD.left - 8}
        y={PAD.top + 4}
        fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
        fontSize={10.5}
        fill={AXIS}
        textAnchor="end"
      >
        {Math.round(plot.yMax)}
      </text>
      <text
        x={PAD.left - 8}
        y={PAD.top + plot.plotH}
        fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
        fontSize={10.5}
        fill={AXIS}
        textAnchor="end"
      >
        {Math.round(plot.yMin)}
      </text>

      {/* Reference-range numeric tick labels, subtle */}
      {referenceRange && plot.bandY1 !== null && (
        <text
          x={width - PAD.right + 2}
          y={plot.bandY1 + 3}
          fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
          fontSize={9.5}
          fill={AXIS}
          textAnchor="start"
        >
          {referenceRange.max}
        </text>
      )}
      {referenceRange && plot.bandY2 !== null && (
        <text
          x={width - PAD.right + 2}
          y={plot.bandY2 + 3}
          fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
          fontSize={9.5}
          fill={AXIS}
          textAnchor="start"
        >
          {referenceRange.min}
        </text>
      )}

      {/* Series line */}
      <path
        d={pathD}
        fill="none"
        stroke={LINE_STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {plot.coords.map((c) => (
        <g
          key={c.point.idx}
          onClick={() => onPointClick?.(c.point)}
          style={{ cursor: onPointClick ? "pointer" : "default" }}
        >
          <circle
            cx={c.x}
            cy={c.y}
            r={5}
            fill={dotFill(c.point.source)}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
          <title>
            {c.point.value} {c.point.unit} · {c.point.sampled_on ?? "—"} · {c.point.source}
          </title>
        </g>
      ))}

      {/* x-axis date labels — first and last only (keeps it readable) */}
      <text
        x={PAD.left}
        y={height - 8}
        fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
        fontSize={10.5}
        fill={AXIS}
        textAnchor="start"
      >
        {formatShortDate(firstDate)}
      </text>
      {plot.coords.length > 1 && (
        <text
          x={width - PAD.right}
          y={height - 8}
          fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
          fontSize={10.5}
          fill={AXIS}
          textAnchor="end"
        >
          {formatShortDate(lastDate)}
        </text>
      )}
      <text
        x={width - PAD.right}
        y={PAD.top + 4}
        fontFamily="var(--font-geist-mono, ui-monospace, Menlo, monospace)"
        fontSize={9.5}
        fill={AXIS}
        textAnchor="end"
      >
        {unit}
      </text>
    </svg>
  );
}
