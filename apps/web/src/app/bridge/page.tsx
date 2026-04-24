"use client";

/**
 * /bridge — The Bridge Preview.
 *
 * The clinician-side surface of Health Companion. Same product, different
 * view. A primary-care doctor or internist sees every enrolled patient
 * between visits: goals, biomarker trends, adherence flags, the note
 * they wrote last time, and how the companion auto-translates that note
 * into plain language for the patient.
 *
 * This page is a *preview* — read-only, illustrative — so a judge can
 * see the shape of the Phase-2 clinician surface without us faking a
 * full product. The "selected" patient row reads real state from the
 * same in-memory backend that powers the patient chat; the rest of the
 * panel is illustrative so the Bridge doesn't look hollow on first
 * open.
 *
 * Critically white-label: the clinic logo is a dashed placeholder, and
 * every clinic brands their own instance. "Your clinic here · powered
 * by Health Companion."
 */

import Link from "next/link";
import { ArrowLeft, AlertCircle, FileText, Heart, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { TrendChart, type TrendPoint, type ReferenceRange } from "@/components/trends/TrendChart";
import { Sparkline } from "@/components/trends/Sparkline";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types for the shape we read from the existing API.
// ---------------------------------------------------------------------------

type TrendSeries = {
  label: string;
  unit: string;
  reference_range?: ReferenceRange | null;
  points: TrendPoint[];
};

type ScreeningEntry = {
  kind: string;
  recommended_by: string;
  due_by: string | null;
};

type TimelineEntry = {
  event_type: string;
  occurred_on: string;
  payload: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Illustrative patients — fills out the left rail so the Bridge doesn't
// look empty even when the real demo state only has one user. Purely
// for demo; a real Bridge binds patients to the clinic's panel.
// ---------------------------------------------------------------------------

type Patient = {
  id: string;
  initials: string;
  name: string;
  age: number;
  lastTouch: string;
  flag?: { tone: "amber" | "blue"; label: string };
  goals: string[];
  // When `useRealState` is true, the detail pane fetches /api/profile etc.
  useRealState?: boolean;
  // Static content for the detail pane.
  preparedBullets?: string[];
  trends?: { label: string; unit: string; points: TrendPoint[]; reference?: ReferenceRange | null }[];
  clinicianNote?: string;
  patientTranslation?: string;
};

const ILLUSTRATIVE_PATIENTS: Patient[] = [
  {
    id: "carlos",
    initials: "CR",
    name: "Carlos R.",
    age: 58,
    lastTouch: "Last visit · 6 weeks ago",
    flag: { tone: "amber", label: "BP trending up" },
    goals: ["Bring fasting glucose into range", "Walking plan 5×/week"],
    preparedBullets: [
      "Home BP log over two weeks averages 134/86 — worth a formal office reading.",
      "Self-reported walking dropped to 2 days last week; companion asked about it gently.",
      "Fasting glucose last month 104 mg/dL — stable.",
    ],
    trends: [
      {
        label: "Systolic BP",
        unit: "mmHg",
        reference: { min: 90, max: 120, unit: "mmHg" },
        points: [
          { value: 128, unit: "mmHg", sampled_on: "2026-02-05", source: "user_said", idx: 0 },
          { value: 132, unit: "mmHg", sampled_on: "2026-03-01", source: "user_said", idx: 1 },
          { value: 130, unit: "mmHg", sampled_on: "2026-03-22", source: "user_said", idx: 2 },
          { value: 134, unit: "mmHg", sampled_on: "2026-04-18", source: "user_said", idx: 3 },
        ],
      },
      {
        label: "Fasting glucose",
        unit: "mg/dL",
        reference: { min: 70, max: 99, unit: "mg/dL" },
        points: [
          { value: 108, unit: "mg/dL", sampled_on: "2026-01-15", source: "lab_report", idx: 0 },
          { value: 104, unit: "mg/dL", sampled_on: "2026-04-02", source: "lab_report", idx: 1 },
        ],
      },
    ],
    clinicianNote:
      "58M with stage-1 hypertension on lifestyle modification. Home BP log suggests inadequate control (avg 134/86); glucose stable. Continue DASH + exercise. Consider lisinopril 10 mg at next visit if BP remains >130/80 after two more weeks of home monitoring.",
    patientTranslation:
      "Your blood pressure has been running a little high lately — around 134 over 86 on the home cuff. Your blood sugar looks stable, which is a win. Keep the walking going and watch the salty food for two more weeks; if the numbers don't come down, we'll talk about adding a gentle morning pill at your next visit.",
  },
  {
    id: "ana",
    initials: "AM",
    name: "Ana M.",
    age: 42,
    lastTouch: "Last visit · 3 weeks ago",
    goals: ["Prep for endocrinology follow-up", "Sleep hygiene reset"],
    preparedBullets: [
      "Brought three specific questions to her endo visit — companion helped her write them.",
      "TSH normalized on latest lab; companion surfaced the trend without celebrating a single value.",
      "Two rough nights this week — reported proactively; sleep-hygiene plan adjusted.",
    ],
    trends: [
      {
        label: "TSH",
        unit: "mIU/L",
        reference: { min: 0.4, max: 4.0, unit: "mIU/L" },
        points: [
          { value: 5.8, unit: "mIU/L", sampled_on: "2025-11-20", source: "lab_report", idx: 0 },
          { value: 4.7, unit: "mIU/L", sampled_on: "2026-02-15", source: "lab_report", idx: 1 },
          { value: 3.2, unit: "mIU/L", sampled_on: "2026-04-10", source: "lab_report", idx: 2 },
        ],
      },
      {
        label: "Sleep (avg hr/night)",
        unit: "hr",
        reference: { min: 7, max: 9, unit: "hr" },
        points: [
          { value: 6.1, unit: "hr", sampled_on: "2026-03-01", source: "wearable", idx: 0 },
          { value: 6.4, unit: "hr", sampled_on: "2026-03-22", source: "wearable", idx: 1 },
          { value: 7.2, unit: "hr", sampled_on: "2026-04-18", source: "wearable", idx: 2 },
        ],
      },
    ],
    clinicianNote:
      "42F, subclinical hypothyroidism, now euthyroid at 75 mcg levothyroxine (TSH 3.2). Sleep improving on hygiene plan. Continue current dose, re-check TSH in 3 months, keep sleep log.",
    patientTranslation:
      "Your thyroid numbers look great now on the current dose — nothing to change. Your sleep is trending in the right direction too. Keep the evening routine you've been doing, and we'll re-check the thyroid number in three months to make sure it stays steady.",
  },
  {
    id: "miguel",
    initials: "MS",
    name: "Miguel S.",
    age: 64,
    lastTouch: "Last visit · 11 weeks ago",
    flag: { tone: "amber", label: "Overdue · colorectal screen" },
    goals: ["Colonoscopy (first since age 50)", "Weight loss 4 kg"],
    preparedBullets: [
      "Hasn't opened the app in 18 days — companion queued a gentle re-engagement nudge.",
      "Colorectal screening overdue per USPSTF 2021; companion holding the referral.",
      "Weight plateau at 88 kg over the last 6 weeks; no pattern change reported.",
    ],
    trends: [
      {
        label: "Weight",
        unit: "kg",
        reference: null,
        points: [
          { value: 91.4, unit: "kg", sampled_on: "2026-01-10", source: "user_said", idx: 0 },
          { value: 90.1, unit: "kg", sampled_on: "2026-02-20", source: "user_said", idx: 1 },
          { value: 89.0, unit: "kg", sampled_on: "2026-03-18", source: "user_said", idx: 2 },
          { value: 88.2, unit: "kg", sampled_on: "2026-04-12", source: "user_said", idx: 3 },
        ],
      },
    ],
    clinicianNote:
      "64M. Colorectal screening overdue — first colonoscopy never completed despite age. Weight plateau at 88 kg after initial 3 kg loss. Consider FIT as lower-friction alternative if colonoscopy aversion persists. Re-engage on activity log.",
    patientTranslation:
      "There's one important thing on my list for us: we still haven't gotten your first colonoscopy done, and it's time. If that feels like a lot, there's a simpler at-home test (FIT) we can start with. Your weight is slowly going in the right direction — good work, let's talk about what changed recently.",
  },
];

// ---------------------------------------------------------------------------
// Patient list + soft flags
// ---------------------------------------------------------------------------

function firstName(full: string): string {
  return full.split(/\s+/)[0];
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

type SoftFlag = { tone: "amber" | "blue"; text: string };

function flagsFromTrends(series: Record<string, TrendSeries>): SoftFlag[] {
  const flags: SoftFlag[] = [];
  for (const [name, s] of Object.entries(series)) {
    const dated = s.points.filter((p) => p.sampled_on);
    if (dated.length < 2) continue;
    const latest = dated[dated.length - 1];
    const prev = dated[dated.length - 2];
    const delta = latest.value - prev.value;
    if (Math.abs(delta) < 1e-6) continue;
    const dir = delta < 0 ? "↓" : "↑";
    const abs = Math.abs(delta).toFixed(Math.abs(delta) >= 10 ? 0 : 1);
    flags.push({
      tone: "blue",
      text: `${s.label} ${dir} ${abs} ${s.unit} (${prev.value} → ${latest.value})`,
    });
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BridgePage() {
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [screenings, setScreenings] = useState<ScreeningEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [series, setSeries] = useState<Record<string, TrendSeries>>({});
  const [selectedId, setSelectedId] = useState<string>("real");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pr, sc, tl, tr] = await Promise.allSettled([
          fetch(`${API_URL}/api/profile`).then((r) => r.json()),
          fetch(`${API_URL}/api/screenings`).then((r) => r.json()),
          fetch(`${API_URL}/api/timeline`).then((r) => r.json()),
          fetch(`${API_URL}/api/trends`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (pr.status === "fulfilled" && pr.value?.profile) {
          setProfile(pr.value.profile as Record<string, unknown>);
        }
        if (sc.status === "fulfilled" && Array.isArray(sc.value?.screenings)) {
          setScreenings(sc.value.screenings as ScreeningEntry[]);
        }
        if (tl.status === "fulfilled" && Array.isArray(tl.value?.timeline)) {
          setTimeline(tl.value.timeline as TimelineEntry[]);
        }
        if (tr.status === "fulfilled" && tr.value?.series) {
          setSeries(tr.value.series as Record<string, TrendSeries>);
        }
      } catch {
        // noop — empty Bridge still renders with the illustrative panel.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Construct the "real" patient entry from backend state. This is the one
  // that moves if the user has actually been chatting; the three others
  // are illustrative so the left rail doesn't look empty.
  const realPatient: Patient = useMemo(() => {
    const name = (profile?.name as string | undefined)?.trim() || "Demo user";
    const age = typeof profile?.age === "number" ? (profile.age as number) : undefined;
    const seriesCount = Object.keys(series).length;
    const screeningCount = screenings.length;
    const hasState = !!name && name !== "Demo user" || seriesCount > 0 || screeningCount > 0;
    const flags = flagsFromTrends(series);
    const flag: Patient["flag"] = flags.length > 0
      ? { tone: flags[0].tone, label: flags[0].text }
      : screeningCount > 0
        ? { tone: "amber", label: `${screeningCount} preventive check${screeningCount === 1 ? "" : "s"} queued` }
        : undefined;
    const preparedBullets: string[] = [];
    if (screeningCount > 0) {
      const s = screenings[0];
      preparedBullets.push(
        `Screening discussion pending: ${s.kind.replace(/_/g, " ")} (${s.recommended_by}).`,
      );
    }
    for (const f of flags.slice(0, 2)) {
      preparedBullets.push(`Trend to acknowledge: ${f.text}.`);
    }
    if (timeline.length > 0) {
      const last = timeline[timeline.length - 1];
      preparedBullets.push(
        `Most recent event · ${last.event_type.replace(/_/g, " ")} on ${last.occurred_on}.`,
      );
    }
    if (preparedBullets.length === 0) {
      preparedBullets.push(
        "No activity yet in this patient's thread. Companion is listening.",
      );
    }
    const trendsBlocks = Object.entries(series).slice(0, 3).map(([, s]) => ({
      label: s.label,
      unit: s.unit,
      reference: s.reference_range ?? null,
      points: s.points,
    }));

    return {
      id: "real",
      initials: initialsFrom(name),
      name: name === "Demo user" ? "Demo user · your state" : name,
      age: age ?? 0,
      lastTouch: hasState ? "Active today" : "No activity yet",
      flag,
      goals: [
        (profile?.["concerns.longevity"] ? "Stick around for a lot longer" : null) as string | null,
        (profile?.["concerns.sleep"] ? "Sleep hygiene reset" : null) as string | null,
        (profile?.["concerns.weight"] ? "Sustainable weight loss" : null) as string | null,
      ].filter((x): x is string => !!x).slice(0, 3),
      useRealState: true,
      preparedBullets,
      trends: trendsBlocks,
      clinicianNote:
        "This note would be written by the clinician and auto-translated for the patient. The Bridge surfaces the conversation between visits; the clinician owns the in-visit record.",
      patientTranslation:
        "When your doctor writes a note, you'll see the same thing in plain language — no medical jargon, no guessing what it meant.",
    };
  }, [profile, screenings, timeline, series]);

  const allPatients: Patient[] = useMemo(
    () => [realPatient, ...ILLUSTRATIVE_PATIENTS],
    [realPatient],
  );
  const selected = allPatients.find((p) => p.id === selectedId) ?? realPatient;

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            Back to patient surface
          </Link>
          <div className="flex items-center gap-3">
            {/* White-label placeholder — dashed outline explicitly reads as "your clinic here" */}
            <div
              className="inline-flex h-9 items-center gap-2 rounded-md border-2 border-dashed border-zinc-300 bg-white px-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-zinc-400"
              aria-label="Clinic logo placeholder"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-zinc-100 text-zinc-400">
                +
              </span>
              Your clinic here
            </div>
            <div className="hidden text-[11px] text-zinc-400 md:inline">
              · powered by Health Companion
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {/* Preview-only advisory — this surface ships with the clinical product, not the patient app */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
          <p>
            <span className="font-semibold">Preview only.</span>{" "}
            This section will only be available in the clinical (clinician-facing)
            version of Health Companion. It will not ship in the patient app.
          </p>
        </div>

        {/* Intro */}
        <div className="mb-8 flex items-start gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "var(--hc-accent-50, #ecfdf5)", color: "var(--hc-accent-700, #047857)" }}
          >
            <Stethoscope className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              The Bridge
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Clinician-facing preview · Phase 2. The same companion your
              patients use, viewed through the lens a clinician actually
              needs: goals between visits, trends, adherence, and plain-
              language translation of the note you write. White-label for
              every clinic.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Patient rail */}
          <aside className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Patient panel
              </h2>
              <span className="font-mono text-[10.5px] text-zinc-400">
                {allPatients.length} enrolled
              </span>
            </div>
            {allPatients.map((p) => {
              const isSelected = p.id === selected.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={
                    "block w-full rounded-xl border px-4 py-3 text-left transition " +
                    (isSelected
                      ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300")
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "inline-flex h-10 w-10 items-center justify-center rounded-full font-mono text-[12px] font-semibold " +
                        (isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-100 text-zinc-700")
                      }
                    >
                      {p.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {p.name}
                        {p.age > 0 && (
                          <span className="ml-1.5 font-normal text-zinc-500">
                            · {p.age}
                          </span>
                        )}
                      </p>
                      <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.06em] text-zinc-400">
                        {p.lastTouch}
                      </p>
                    </div>
                  </div>
                  {p.flag && (
                    <div
                      className={
                        "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold " +
                        (p.flag.tone === "amber"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-blue-200 bg-blue-50 text-blue-700")
                      }
                    >
                      <AlertCircle className="h-3 w-3" strokeWidth={1.8} aria-hidden />
                      {p.flag.label}
                    </div>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Detail pane */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-500">
                    Patient · {selected.age > 0 ? `${selected.age} y/o` : "age unknown"}
                  </p>
                  <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900">
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">{selected.lastTouch}</p>
                </div>
                {selected.goals.length > 0 && (
                  <div className="text-right">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-500">
                      Goals
                    </p>
                    <ul className="mt-1 space-y-1 text-right text-xs text-zinc-700">
                      {selected.goals.map((g) => (
                        <li key={g}>· {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Prepared for next visit */}
              <div
                className="mt-5 rounded-xl border px-4 py-3"
                style={{
                  background: "var(--hc-amber-bg)",
                  borderColor: "var(--hc-amber-border)",
                }}
              >
                <p
                  className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--hc-amber-fg)" }}
                >
                  Prepared for {firstName(selected.name)}&rsquo;s next visit
                </p>
                <ul className="space-y-1.5 text-sm text-zinc-800">
                  {(selected.preparedBullets ?? []).map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        aria-hidden
                        className="mt-[8px] inline-block h-1 w-1 shrink-0 rounded-full"
                        style={{ background: "var(--hc-amber-fg)" }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Trends */}
            {(selected.trends ?? []).length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="mb-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Between-visit trends
                </p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(selected.trends ?? []).map((t) => {
                    const latest = t.points.filter((p) => p.sampled_on).slice(-1)[0];
                    return (
                      <div key={t.label} className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-zinc-900">
                            {t.label}
                          </span>
                          {latest && (
                            <span className="font-mono text-[12px] text-zinc-700 tabular-nums">
                              {latest.value} {t.unit}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Sparkline
                            points={t.points}
                            referenceRange={t.reference ?? null}
                            width={120}
                            height={36}
                          />
                          <span className="font-mono text-[10.5px] text-zinc-400">
                            {t.points.length} pts
                          </span>
                        </div>
                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                          <TrendChart
                            points={t.points}
                            unit={t.unit}
                            referenceRange={t.reference ?? null}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clinician note + patient translation */}
            {selected.clinicianNote && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                    Clinician note
                  </h3>
                  <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-400">
                    as you wrote it
                  </span>
                </div>
                <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-zinc-700">
                  {selected.clinicianNote}
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-600" strokeWidth={1.6} />
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                    What {firstName(selected.name)} receives
                  </h3>
                  <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.08em] text-emerald-700">
                    auto-translated
                  </span>
                </div>
                <p className="mt-3 text-[14.5px] leading-[1.6] text-zinc-800">
                  {selected.patientTranslation}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <p className="mt-12 text-center font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-400">
          The Bridge · Phase 2 preview · white-label · not for clinical use
        </p>
      </div>
    </main>
  );
}
