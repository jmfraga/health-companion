"use client";

/**
 * BiomarkerTrackingList — compact "what I'm tracking" surface for the
 * profile aside. Reads the same grouped series as /trends, renders one row
 * per biomarker with its latest value in mono + a 80×24 sparkline. Links
 * out to the full /trends view.
 */

import Link from "next/link";
import { LineChart } from "lucide-react";

import { Sparkline } from "./Sparkline";
import type { ReferenceRange, TrendPoint } from "./TrendChart";

export type TrackingSeries = {
  label: string;
  unit: string;
  reference_range?: ReferenceRange | null;
  points: TrendPoint[];
};

export type BiomarkerTrackingListProps = {
  series: Record<string, TrackingSeries>;
};

// Keep fasting glucose at the top to match the demo arc; otherwise
// alphabetize by label.
const PRIORITY = [
  "fasting_glucose",
  "hba1c",
  "systolic_bp",
  "diastolic_bp",
  "weight_kg",
  "ldl",
  "hdl",
  "triglycerides",
];

function orderNames(names: string[]): string[] {
  const known = PRIORITY.filter((n) => names.includes(n));
  const rest = names.filter((n) => !PRIORITY.includes(n)).sort();
  return [...known, ...rest];
}

function latestValue(points: TrendPoint[]): TrendPoint | null {
  const dated = points.filter((p) => typeof p.sampled_on === "string" && p.sampled_on);
  if (dated.length === 0) return null;
  return dated.reduce((a, b) =>
    (a.sampled_on ?? "") > (b.sampled_on ?? "") ? a : b,
  );
}

export function BiomarkerTrackingList({ series }: BiomarkerTrackingListProps) {
  const names = orderNames(Object.keys(series));
  if (names.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-zinc-500" aria-hidden strokeWidth={1.6} />
          <h2 className="text-sm font-semibold">What I&rsquo;m tracking</h2>
        </div>
        <Link
          href="/trends"
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500 hover:text-emerald-700"
        >
          See all →
        </Link>
      </header>
      <ul className="divide-y divide-zinc-100">
        {names.map((name) => {
          const s = series[name];
          const latest = latestValue(s.points);
          return (
            <li key={name} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-800">{s.label}</p>
                <p className="mt-0.5 font-mono text-[10.5px] text-zinc-500">
                  {latest ? (
                    <>
                      <span className="text-zinc-900">{latest.value}</span>{" "}
                      <span className="text-zinc-500">{s.unit}</span>{" "}
                      <span className="text-zinc-400">· {s.points.length} pts</span>
                    </>
                  ) : (
                    <span className="text-zinc-400">no data yet</span>
                  )}
                </p>
              </div>
              <Sparkline
                points={s.points}
                referenceRange={s.reference_range ?? null}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
