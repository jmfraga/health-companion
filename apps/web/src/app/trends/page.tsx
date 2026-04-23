"use client";

/**
 * /trends — the longitudinal surface.
 *
 * A grid of TrendCards, one per biomarker the user is actively working on.
 * Fetches ``/api/trends`` on mount. Empty state speaks in the companion's
 * voice so the page is never sterile. See ROADMAP §16b — *a trend line is
 * memory you can see*.
 */

import Link from "next/link";
import { ArrowLeft, LineChart } from "lucide-react";
import { useEffect, useState } from "react";

import { TrendCard } from "@/components/trends/TrendCard";
import type { ReferenceRange, TrendPoint } from "@/components/trends/TrendChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type SeriesEntry = {
  label: string;
  unit: string;
  reference_range?: ReferenceRange | null;
  points: TrendPoint[];
};

type TrendsResponse = {
  series: Record<string, SeriesEntry>;
};

// Keep a small priority order for the headline biomarkers so the demo card
// (fasting glucose) lands at the top without needing a bespoke sort.
const PRIORITY_ORDER = [
  "fasting_glucose",
  "hba1c",
  "systolic_bp",
  "diastolic_bp",
  "resting_heart_rate",
  "ldl",
  "hdl",
  "triglycerides",
  "total_cholesterol",
  "weight_kg",
  "bmi",
];

function orderedNames(names: string[]): string[] {
  const known = PRIORITY_ORDER.filter((n) => names.includes(n));
  const rest = names.filter((n) => !PRIORITY_ORDER.includes(n)).sort();
  return [...known, ...rest];
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/trends`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as TrendsResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function seedDemo() {
    setSeeding(true);
    try {
      await fetch(`${API_URL}/api/trends/seed-demo`, { method: "POST" });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const names = data ? orderedNames(Object.keys(data.series)) : [];
  const isEmpty = !loading && !error && names.length === 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            Back
          </Link>
          <h1 className="mt-4 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            <LineChart className="h-6 w-6 text-emerald-700" strokeWidth={1.6} />
            Your trends
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            A trend line is memory you can see. Every parameter we&rsquo;re
            working on together earns a small chart — shaded bands show the
            usual adult range, blue dots are lab or wearable data, amber dots
            are what you shared in conversation.
          </p>
        </div>
      </div>

      {loading && (
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-zinc-400">
          Loading…
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Couldn&rsquo;t reach the API ({error}). Make sure the backend is
          running on <span className="font-mono">{API_URL}</span>.
        </div>
      )}

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="mx-auto max-w-sm text-sm text-zinc-600">
            No parameters yet. Tell me about a lab result or a reading in the
            chat, or load the Laura demo arc to see how this page fills in.
          </p>
          <button
            type="button"
            onClick={seedDemo}
            disabled={seeding}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {seeding ? "Loading fixture…" : "Load Laura demo arc"}
          </button>
        </div>
      )}

      {!isEmpty && !loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {names.map((name) => {
            const entry = data!.series[name];
            return (
              <TrendCard
                key={name}
                name={name}
                label={entry.label}
                unit={entry.unit}
                referenceRange={entry.reference_range ?? null}
                points={entry.points}
              />
            );
          })}
        </div>
      )}

      <p className="mt-10 font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-400">
        Reference ranges shown are generic adult values. Personalization by
        age, sex, and history is pending clinical audit.
      </p>
    </main>
  );
}
