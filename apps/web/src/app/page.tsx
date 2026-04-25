"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Heart,
  Menu,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/supabase";
import { Avatar } from "@/components/profile/Avatar";
import { EmergencyPill } from "@/components/common/EmergencyPill";
import { ReasoningSheet } from "@/components/common/ReasoningSheet";
import { LabDropZone } from "@/components/labs/LabDropZone";
import { LabTable } from "@/components/labs/LabTable";
import { MonthsLaterFade } from "@/components/proactive/MonthsLaterFade";
import { ProactiveLetter } from "@/components/proactive/ProactiveLetter";
import { ProactiveMessageCard } from "@/components/proactive/ProactiveMessageCard";
import { HealthTimeline } from "@/components/timeline/HealthTimeline";
import { ScheduleCard, type ScheduleRow } from "@/components/chat/ScheduleCard";
import { ToolTraceCard, type ToolCall } from "@/components/chat/ToolTraceCard";
import {
  BiomarkerTrackingList,
  type TrackingSeries,
} from "@/components/trends/BiomarkerTrackingList";
import type {
  Biomarker,
  LabAnalysis,
  ProactiveMessage,
  TimelineEvent,
} from "@/components/shared/types";

type ChatMessage = {
  role: "user" | "assistant" | "proactive" | "system";
  content: string;
  reasoning?: string;
  labAnalysis?: LabAnalysis;
  proactive?: ProactiveMessage;
  /** Tool calls observed during this assistant turn (for inline trace). */
  toolCalls?: ToolCall[];
  /** Screenings scheduled during this assistant turn (for ScheduleCard). */
  scheduledScreenings?: ScheduleRow[];
  /** Locally-generated timestamp for user bubbles. */
  sentAt?: string;
};

type ProfileSnapshot = Record<string, unknown>;

type ScreeningEntry = {
  kind: string;
  recommended_by: string;
  due_by: string | null;
  queued_at?: string;
};

type StreamEvent =
  | { type: "message_delta"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; output?: Record<string, unknown>; error?: string }
  | { type: "profile_snapshot"; profile: ProfileSnapshot }
  | { type: "screenings_snapshot"; screenings: ScreeningEntry[] }
  | { type: "biomarkers_snapshot"; biomarkers: Biomarker[] }
  | { type: "memory_snapshot"; memory: unknown }
  | { type: "timeline_snapshot"; timeline: TimelineEvent[] }
  | {
      type: "timeline_event";
      event_type: string;
      payload: Record<string, unknown>;
      occurred_on: string;
      created_at: string;
    }
  | { type: "lab_analysis"; analysis: LabAnalysis }
  | {
      type: "proactive_message";
      text: string;
      context_refs: string[];
      next_step: string;
      months_later?: number;
    }
  | { type: "reasoning_start" }
  | { type: "reasoning_delta"; text: string }
  | { type: "reasoning_stop" }
  | { type: "done" }
  | { type: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// The Managed-Agents variant of the simulate endpoint is read from the env
// so Juan Manuel can flip it without a redeploy. Defaults to the
// Messages-API endpoint that already ships.
const PROACTIVE_ENDPOINT =
  process.env.NEXT_PUBLIC_PROACTIVE_ENDPOINT ?? "/api/simulate-months-later";

// ---------------------------------------------------------------------------
// Humanizers for the ScreeningCalendar
// ---------------------------------------------------------------------------

const SCREENING_LABELS: Record<string, string> = {
  mammography: "Mammography",
  mammography_early_start: "Early mammography",
  pap_smear: "Pap smear",
  colonoscopy: "Colonoscopy",
  prostate_psa: "PSA (prostate)",
  fasting_glucose: "Fasting glucose",
  lipid_panel: "Lipid panel",
  blood_pressure: "Blood pressure",
  lung_cancer_ldct: "Low-dose chest CT",
  coronary_artery_calcium: "Coronary calcium score",
  lipoprotein_a: "Lp(a)",
  depression_phq9: "Depression (PHQ-9)",
  anxiety_gad7: "Anxiety (GAD-7)",
  cardiometabolic_checkup_mx: "PrevenIMSS checkup",
};

// Map the most common dotted-path profile keys to readable English labels.
// Keys we haven't anticipated fall through to a Title-Cased version of the
// last path segment so the panel never renders raw snake_case.
const PROFILE_LABELS: Record<string, string> = {
  name: "Name",
  age: "Age",
  sex: "Sex",
  gender: "Gender",
  date_of_birth: "Date of birth",
  occupation: "Occupation",
  "family_history.breast_cancer_mother": "Mother had breast cancer",
  "family_history.breast_cancer_mother_age_at_death":
    "Age when mother died of breast cancer",
  "family_history.breast_cancer_sister": "Sister had breast cancer",
  "family_history.heart_attack_father": "Father had heart attack",
  "family_history.heart_attack_mother": "Mother had heart attack",
  "family_history.colon_cancer": "Family history of colon cancer",
  "family_history.diabetes": "Family history of diabetes",
  "family_history.alzheimer": "Family history of Alzheimer's",
  "family_history.stroke": "Family history of stroke",
  "concerns.sleep": "Working on: sleep",
  "concerns.weight": "Working on: weight",
  "concerns.stress": "Working on: stress",
  "concerns.longevity": "Working on: longevity",
  "concerns.risk": "Working on: understanding my risk",
  "concerns.cancer_risk": "Working on: cancer risk",
  "concerns.heart": "Working on: heart health",
  "lifestyle.smoker": "Smoker",
  "lifestyle.ex_smoker": "Former smoker",
  "lifestyle.exercise": "Exercise",
  "lifestyle.diet": "Diet",
  "lifestyle.alcohol": "Alcohol",
  "reproductive.pregnancy_status": "Pregnancy status",
  "reproductive.menopause": "Menopause status",
};

// Human-readable label for a profile key, with a clean Title-Case fallback.
function humanizeProfileKey(field: string): string {
  if (PROFILE_LABELS[field]) return PROFILE_LABELS[field];
  const last = field.includes(".") ? field.split(".").slice(-1)[0] : field;
  return last
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format a profile value so booleans and nested objects read nicely
// instead of leaking `true` or stringified JSON. Returns null when the
// label already carries the information and the value is redundant.
function formatProfileValue(field: string, value: unknown): string | null {
  if (value === true) {
    // Label already names the fact. Showing "true" is noise.
    return null;
  }
  if (value === false) {
    return "no";
  }
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (field === "age") return `${value} years`;
    return String(value);
  }
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function humanizeKind(kind: string): string {
  if (SCREENING_LABELS[kind]) return SCREENING_LABELS[kind];
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Extract a first name from the live-profile panel so ProactiveLetter
// can greet the user by name. The backend uses a soft contract — the
// key varies — so we probe a handful of likely candidates and fall
// back to the first word of any name-like value.
function firstNameFromProfile(profile: Record<string, unknown>): string | null {
  const keys = ["first_name", "preferred_name", "given_name", "name", "full_name"];
  for (const k of keys) {
    const v = profile[k];
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim().split(/\s+/)[0];
    }
  }
  return null;
}

function formatDueBy(due: string | null | undefined): string {
  if (!due) return "No specific date";
  // Parse YYYY-MM-DD safely (avoid TZ drift).
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(due);
  if (!m) return due;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const date = new Date(Date.UTC(year, month, 1));
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function screeningKey(s: ScreeningEntry): string {
  return `${s.kind}|${s.recommended_by}|${s.due_by ?? "null"}`;
}

function timelineKey(e: TimelineEvent): string {
  return `${e.event_type}|${e.occurred_on}|${e.created_at}`;
}

function sortScreenings(list: ScreeningEntry[]): ScreeningEntry[] {
  return [...list].sort((a, b) => {
    if (!a.due_by && !b.due_by) return 0;
    if (!a.due_by) return 1;
    if (!b.due_by) return -1;
    return a.due_by.localeCompare(b.due_by);
  });
}

// ---------------------------------------------------------------------------
// Screening calendar
// ---------------------------------------------------------------------------

function ScreeningCalendar({
  screenings,
  recentlyAdded,
}: {
  screenings: ScreeningEntry[];
  recentlyAdded: Set<string>;
}) {
  const sorted = useMemo(() => sortScreenings(screenings), [screenings]);

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
          <h2 className="text-sm font-semibold">Recommended screenings</h2>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">Talk to your doctor about them.</p>
        <p className="mt-0.5 text-[11px] text-zinc-400">
          Preventive checks your companion is tracking.
        </p>
      </div>
      <div className="space-y-2 px-5 py-4">
        {sorted.length === 0 ? (
          <p className="text-xs text-zinc-400">Nothing scheduled yet.</p>
        ) : (
          sorted.map((s) => {
            const key = screeningKey(s);
            const flashing = recentlyAdded.has(key);
            return (
              <div
                key={key}
                className={
                  "rounded-lg border px-3 py-2.5 transition-colors " +
                  (flashing
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-zinc-200 bg-zinc-50")
                }
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium text-zinc-900">
                    {humanizeKind(s.kind)}
                  </div>
                  <div
                    className={
                      "shrink-0 text-xs tabular-nums " +
                      (s.due_by ? "text-zinc-700" : "text-zinc-400")
                    }
                  >
                    {formatDueBy(s.due_by)}
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {s.recommended_by}
                </div>
              </div>
            );
          })
        )}
        <p className="pt-1 text-[11px] text-zinc-400">
          Your doctor will confirm timing and eligibility.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile panel body (shared between desktop aside and mobile sheet)
// ---------------------------------------------------------------------------

function ProfileBody({
  profile,
  recentlyChanged,
}: {
  profile: ProfileSnapshot;
  recentlyChanged: Set<string>;
}) {
  return (
    <div className="space-y-2 px-5 py-4">
      {Object.keys(profile).length === 0 ? (
        <p className="text-xs text-zinc-400">
          Nothing here yet — talk to me and this fills in.
        </p>
      ) : (
        Object.entries(profile).map(([field, value]) => {
          const label = humanizeProfileKey(field);
          const displayValue = formatProfileValue(field, value);
          return (
            <div
              key={field}
              className={
                "rounded-md border px-3 py-2 text-xs transition-colors " +
                (recentlyChanged.has(field)
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-zinc-200 bg-zinc-50")
              }
            >
              <div className="text-[11px] font-medium text-zinc-900">
                {label}
              </div>
              {displayValue !== null && (
                <div className="mt-0.5 text-[12px] text-zinc-600">
                  {displayValue}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HabitsBlock — lifestyle / habits / concerns section for the profile panel.
// Only renders when at least one relevant field is populated.
// ---------------------------------------------------------------------------

const HABITS_FIELDS = new Set([
  "lifestyle.smoker",
  "lifestyle.ex_smoker",
  "lifestyle.exercise",
  "lifestyle.diet",
  "lifestyle.alcohol",
  "lifestyle.tobacco",
  "concerns.sleep",
  "concerns.weight",
  "concerns.longevity",
  "concerns.stress",
  "concerns.risk",
  "concerns.cancer_risk",
  "concerns.heart",
]);

function HabitsBlock({
  profile,
  recentlyChanged,
}: {
  profile: ProfileSnapshot;
  recentlyChanged: Set<string>;
}) {
  const entries = Object.entries(profile).filter(([field, value]) => {
    if (!HABITS_FIELDS.has(field)) return false;
    if (value === false || value === null || value === undefined || value === "") return false;
    return true;
  });

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-500" aria-hidden />
          <h2 className="text-sm font-semibold">Habits in follow-up</h2>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">Lifestyle context your companion is tracking.</p>
      </div>
      <div className="space-y-2 px-5 py-4">
        {entries.map(([field, value]) => {
          const label = humanizeProfileKey(field);
          const displayValue = formatProfileValue(field, value);
          return (
            <div
              key={field}
              className={
                "rounded-md border px-3 py-2 text-xs transition-colors " +
                (recentlyChanged.has(field)
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-zinc-200 bg-zinc-50")
              }
            >
              <div className="text-[11px] font-medium text-zinc-900">{label}</div>
              {displayValue !== null && (
                <div className="mt-0.5 text-[12px] text-zinc-600">{displayValue}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WelcomeCard — the cold-entry moment. Invites the judge (or any new user)
// to try the companion with their own life, not a scripted Laura tour.
// ---------------------------------------------------------------------------

const WELCOME_EXAMPLES: { label: string; text: string }[] = [
  {
    label: "Sleep",
    text: "I'm 38 and I want to sleep better.",
  },
  {
    label: "Longevity",
    text: "I'm 52 with my first grandkid coming. I want to stick around.",
  },
  {
    label: "Labs",
    text: "Just got my labs back. Can we look at them together?",
  },
  {
    label: "Smartwatch",
    text: "Here's a photo of my Apple Watch screen — help me read it.",
  },
];

function WelcomeCard({
  onPickExample,
}: {
  onPickExample: (text: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "var(--hc-accent-50, #ecfdf5)",
            color: "var(--hc-accent-700, #047857)",
          }}
          aria-hidden
        >
          <Heart className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
            Welcome.
          </h3>
          <p className="text-[11px] text-zinc-500">Your Health Companion</p>
        </div>
      </div>
      <p className="mt-3 text-[14.5px] leading-[1.55] text-zinc-800">
        I&rsquo;m here to help you stay well — not to diagnose, not to
        prescribe, and always to point you back to your doctor when
        something matters.
      </p>
      <p className="mt-2 text-[14.5px] leading-[1.55] text-zinc-800">
        Tell me a little about you. What&rsquo;s been on your mind?
      </p>
      <p className="mt-3 text-[12.5px] leading-[1.55] text-zinc-500">
        Or drop a lab PDF or a photo of any reading right into the chat.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {WELCOME_EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onPickExample(ex.text)}
            aria-label={ex.text}
            style={{ animationDelay: `${i * 80}ms` }}
            className="hc-fade-up group inline-flex max-w-full items-start gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2 text-left text-[13px] leading-snug text-zinc-700 transition hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-zinc-900"
          >
            <span className="mt-0.5 inline-flex shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 group-hover:border-emerald-200 group-hover:text-emerald-700">
              {ex.label}
            </span>
            <span className="min-w-0 break-words">{ex.text}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.08em] text-zinc-400">
        Tap an example to drop it in the composer — edit before you send.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom sheet
// ---------------------------------------------------------------------------

function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "fixed inset-0 z-40 md:hidden " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={
          "absolute inset-0 bg-zinc-900/30 transition-opacity duration-200 " +
          (open ? "opacity-100" : "opacity-0")
        }
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          "absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-out " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 shrink-0 rounded-full bg-zinc-300" />
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 pb-3 pt-2">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-xs text-zinc-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function ChatExperience() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const demoBypass = useDemoBypass();

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  const handleStartFresh = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_URL}/api/demo/reset`, {
        method: "POST",
        headers,
      });
    } catch {
      // Even if the backend call fails we still clear the local view.
    }
    setMessages([]);
    setProfile({});
    setRecentlyChanged(new Set());
    setScreenings([]);
    setRecentlyAddedScreenings(new Set());
    setBiomarkers([]);
    setTrackingSeries({});
    setTimeline([]);
    setRecentlyAddedTimeline(new Set());
    setReasoningActiveIndex(null);
    setReasoningSheetMsg(null);
    setErrorToast(null);
    setInput("");
    setFreshToast("Starting a fresh thread — nothing stored.");
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({});
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const [screenings, setScreenings] = useState<ScreeningEntry[]>([]);
  const [recentlyAddedScreenings, setRecentlyAddedScreenings] = useState<Set<string>>(
    new Set()
  );
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [trackingSeries, setTrackingSeries] = useState<Record<string, TrackingSeries>>({});
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [recentlyAddedTimeline, setRecentlyAddedTimeline] = useState<Set<string>>(
    new Set()
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [reasoningActiveIndex, setReasoningActiveIndex] = useState<number | null>(null);
  const [reasoningSheetMsg, setReasoningSheetMsg] =
    useState<ChatMessage | null>(null);
  // Opt-in: off by default, enabled from /settings. When off the "See
  // reasoning" buttons hide. The reasoning itself still streams into
  // ReasoningSheet state and stays in the per-message audit record.
  // Default ON so judges and first-time visitors see the "See reasoning"
  // disclosure without having to flip a toggle in /settings. Only
  // explicitly disabling it ("false" in storage) hides the link. Server-
  // side render starts with true to match the post-mount default.
  const [showReasoning, setShowReasoning] = useState<boolean>(true);
  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem("hc:showReasoning");
        setShowReasoning(raw !== "false");
      } catch {
        setShowReasoning(true);
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "hc:showReasoning") read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const [sheet, setSheet] = useState<
    null | "profile" | "screenings" | "timeline" | "upload"
  >(null);
  const [fadeActive, setFadeActive] = useState(false);
  // Brief confirmation toast shown after "Start fresh" clears state.
  const [freshToast, setFreshToast] = useState<string | null>(null);
  useEffect(() => {
    if (!freshToast) return;
    const t = setTimeout(() => setFreshToast(null), 2400);
    return () => clearTimeout(t);
  }, [freshToast]);
  // Soft, non-blocking surface for transient backend hiccups.
  // Replaces the previous red inline error block in the chat transcript
  // and the LabDropZone red box. Auto-dismiss is longer (4s) than the
  // success toast because errors merit reading.
  const [errorToast, setErrorToast] = useState<string | null>(null);
  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 4000);
    return () => clearTimeout(t);
  }, [errorToast]);
  const [fadeLabel, setFadeLabel] = useState("3 months later");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const simulatePendingRef = useRef<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Close mobile menu on click-outside or Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Hydrate every right-column widget on mount so a page reload does not
  // wipe the user's accumulated state — the backend still has it, the UI
  // just needs to ask. Timeline, profile, screenings, biomarkers in one go.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const results = await Promise.allSettled([
          fetch(`${API_URL}/api/timeline`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/profile`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/screenings`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/biomarkers`, { headers }).then((r) => r.json()),
          fetch(`${API_URL}/api/trends`, { headers }).then((r) => r.json()),
        ]);
        if (cancelled) return;

        const [tl, pr, sc, bm, tr] = results;
        if (tl.status === "fulfilled" && Array.isArray(tl.value?.timeline)) {
          setTimeline(tl.value.timeline as TimelineEvent[]);
        }
        if (pr.status === "fulfilled" && pr.value?.profile) {
          setProfile(pr.value.profile as ProfileSnapshot);
        }
        if (sc.status === "fulfilled" && Array.isArray(sc.value?.screenings)) {
          setScreenings(sc.value.screenings as ScreeningEntry[]);
        }
        if (bm.status === "fulfilled" && Array.isArray(bm.value?.biomarkers)) {
          setBiomarkers(bm.value.biomarkers as Biomarker[]);
        }
        if (tr.status === "fulfilled" && tr.value?.series) {
          setTrackingSeries(
            tr.value.series as Record<string, TrackingSeries>,
          );
        }
      } catch {
        // Silent — first chat turn will repopulate via snapshot events.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the tracking sparklines in sync when biomarkers grow. Refetches
  // /api/trends (which carries the grouped labels + reference ranges) on
  // every change to the biomarker count, so a lab upload or chat-logged
  // value lights up the sidebar without a page reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/trends`, { headers });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.series) {
          setTrackingSeries(json.series as Record<string, TrackingSeries>);
        }
      } catch {
        // noop — next snapshot will repaint.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [biomarkers.length]);

  const flashField = useCallback((field: string) => {
    setRecentlyChanged((prev) => new Set(prev).add(field));
    setTimeout(() => {
      setRecentlyChanged((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 1800);
  }, []);

  const flashScreening = useCallback((key: string) => {
    setRecentlyAddedScreenings((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setRecentlyAddedScreenings((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1800);
  }, []);

  const flashTimeline = useCallback((key: string) => {
    setRecentlyAddedTimeline((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setRecentlyAddedTimeline((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2400);
  }, []);

  // ---------------------------------------------------------------------
  // Shared SSE event handler — used by chat, lab drop zone, and simulate.
  // ---------------------------------------------------------------------

  const applyEvent = useCallback(
    (event: StreamEvent) => {
      if (event.type === "message_delta") {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" || last?.role === "proactive") {
            copy[copy.length - 1] = { ...last, content: last.content + event.text };
          }
          return copy;
        });
      } else if (event.type === "tool_use") {
        // Attach a "running" tool call entry to the current assistant turn so
        // the in-thread ToolTraceCard lights up as the calls arrive. Keep
        // the top-level side effects (profile / screening / biomarker) in
        // sync with the dedicated panels on the right column.
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];
          if (last && (last.role === "assistant" || last.role === "proactive")) {
            const existing = last.toolCalls ?? [];
            copy[lastIdx] = {
              ...last,
              toolCalls: [
                ...existing,
                {
                  id: event.id,
                  name: event.name,
                  input: event.input,
                  status: "running",
                },
              ],
            };
          }
          return copy;
        });

        if (event.name === "save_profile_field") {
          const field = String((event.input as Record<string, unknown>).field ?? "");
          const value = (event.input as Record<string, unknown>).value;
          if (field) {
            setProfile((prev) => ({ ...prev, [field]: value }));
            flashField(field);
          }
        } else if (event.name === "schedule_screening") {
          const inp = event.input as Record<string, unknown>;
          const kind = typeof inp.kind === "string" ? inp.kind : "";
          const recommended_by =
            typeof inp.recommended_by === "string" ? inp.recommended_by : "";
          const due_by =
            typeof inp.due_by === "string" ? inp.due_by : null;
          if (kind) {
            const entry: ScreeningEntry = { kind, recommended_by, due_by };
            const key = screeningKey(entry);
            setScreenings((prev) => {
              if (prev.some((s) => screeningKey(s) === key)) return prev;
              return [...prev, entry];
            });
            flashScreening(key);

            // Also stash a human-friendly row on the current assistant turn,
            // so the inline ScheduleCard can render alongside the prose.
            const row: ScheduleRow = {
              kind,
              name: humanizeKind(kind),
              when: formatDueBy(due_by),
              sub: recommended_by || "Routine preventive check.",
            };
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              const last = copy[lastIdx];
              if (
                last &&
                (last.role === "assistant" || last.role === "proactive")
              ) {
                const existing = last.scheduledScreenings ?? [];
                // Dedupe by kind|when so repeated tool calls don't stack.
                if (
                  !existing.some(
                    (r) => r.kind === row.kind && r.when === row.when
                  )
                ) {
                  copy[lastIdx] = {
                    ...last,
                    scheduledScreenings: [...existing, row],
                  };
                }
              }
              return copy;
            });
          }
        } else if (event.name === "log_biomarker") {
          const inp = event.input as Biomarker;
          setBiomarkers((prev) => [...prev, inp]);
        }
      } else if (event.type === "tool_result") {
        // Flip the matching call from "running" -> "done" so the dot turns
        // emerald in the in-thread ToolTraceCard.
        setMessages((prev) => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i -= 1) {
            const m = copy[i];
            if (!m.toolCalls) continue;
            const hit = m.toolCalls.findIndex((c) => c.id === event.id);
            if (hit !== -1) {
              const next = m.toolCalls.slice();
              next[hit] = { ...next[hit], status: "done" };
              copy[i] = { ...m, toolCalls: next };
              break;
            }
          }
          return copy;
        });
      } else if (event.type === "profile_snapshot") {
        setProfile(event.profile);
      } else if (event.type === "screenings_snapshot") {
        setScreenings((prev) => {
          const seen = new Set(prev.map(screeningKey));
          const merged = [...prev];
          for (const s of event.screenings) {
            const k = screeningKey(s);
            if (!seen.has(k)) {
              merged.push(s);
              seen.add(k);
              flashScreening(k);
            }
          }
          return merged;
        });
      } else if (event.type === "biomarkers_snapshot") {
        setBiomarkers(event.biomarkers);
      } else if (event.type === "timeline_snapshot") {
        setTimeline((prev) => {
          const seen = new Set(prev.map(timelineKey));
          const merged = [...prev];
          for (const e of event.timeline) {
            const k = timelineKey(e);
            if (!seen.has(k)) {
              merged.push(e);
              seen.add(k);
              flashTimeline(k);
            }
          }
          return merged;
        });
      } else if (event.type === "timeline_event") {
        const entry: TimelineEvent = {
          event_type: event.event_type,
          payload: event.payload,
          occurred_on: event.occurred_on,
          created_at: event.created_at,
        };
        const k = timelineKey(entry);
        setTimeline((prev) => {
          if (prev.some((e) => timelineKey(e) === k)) return prev;
          return [...prev, entry];
        });
        flashTimeline(k);
      } else if (event.type === "lab_analysis") {
        // Attach the structured analysis to the last assistant message, or
        // append a new one if none is in flight.
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];
          if (last && last.role === "assistant") {
            copy[lastIdx] = { ...last, labAnalysis: event.analysis };
            return copy;
          }
          copy.push({
            role: "assistant",
            content: "",
            labAnalysis: event.analysis,
          });
          return copy;
        });
      } else if (event.type === "proactive_message") {
        const payload: ProactiveMessage = {
          text: event.text,
          context_refs: event.context_refs ?? [],
          next_step: event.next_step ?? "",
          months_later: event.months_later,
        };
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];
          // If we were streaming into a placeholder "proactive" bubble,
          // upgrade it with the structured payload. Otherwise append.
          if (last && last.role === "proactive") {
            copy[lastIdx] = {
              ...last,
              proactive: payload,
              // Prefer the streamed text we already have.
              content: last.content || payload.text,
            };
            return copy;
          }
          copy.push({
            role: "proactive",
            content: payload.text,
            proactive: payload,
          });
          return copy;
        });
      } else if (event.type === "reasoning_start") {
        setMessages((prev) => {
          const idx = prev.length - 1;
          if (idx >= 0 && (prev[idx].role === "assistant" || prev[idx].role === "proactive")) {
            setReasoningActiveIndex(idx);
          }
          return prev;
        });
      } else if (event.type === "reasoning_delta") {
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          const last = copy[lastIdx];
          if (last?.role === "assistant" || last?.role === "proactive") {
            copy[lastIdx] = {
              ...last,
              reasoning: (last.reasoning ?? "") + event.text,
            };
          }
          return copy;
        });
      } else if (event.type === "reasoning_stop") {
        setReasoningActiveIndex(null);
      } else if (event.type === "error") {
        setErrorToast(event.message);
      }
    },
    [flashField, flashScreening, flashTimeline]
  );

  // ---------------------------------------------------------------------
  // Chat send
  // ---------------------------------------------------------------------

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    const sentAt = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed, sentAt },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setErrorToast(null);

    // Placeholder for the streamed assistant reply.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Only send the role/content pairs the API expects.
      const wirePayload = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: wirePayload }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          if (!raw.startsWith("data:")) continue;
          const payload = raw.slice(5).trim();
          if (!payload) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(payload) as StreamEvent;
          } catch {
            continue;
          }
          applyEvent(event);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorToast(message);
    } finally {
      setBusy(false);
      setReasoningActiveIndex(null);
    }
  }, [input, busy, messages, applyEvent]);

  // ---------------------------------------------------------------------
  // Lab drop-zone plumbing
  // ---------------------------------------------------------------------

  const onLabStart = useCallback((file: File) => {
    setBusy(true);
    setErrorToast(null);
    setSheet(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Uploaded a lab report · ${file.name}`,
      },
      { role: "assistant", content: "" },
    ]);
  }, []);

  const onLabEvent = useCallback(
    (raw: Record<string, unknown>) => {
      applyEvent(raw as StreamEvent);
    },
    [applyEvent]
  );

  const onLabError = useCallback((msg: string) => {
    setErrorToast(msg);
  }, []);

  const onLabDone = useCallback(() => {
    setBusy(false);
    setReasoningActiveIndex(null);
  }, []);

  // ---------------------------------------------------------------------
  // Simulate-months-later trigger
  // ---------------------------------------------------------------------

  const runSimulate = useCallback(async () => {
    if (busy) return;
    const months = 3;
    setErrorToast(null);
    setBusy(true);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Open a placeholder proactive bubble so streaming text has a home.
      setMessages((prev) => [...prev, { role: "proactive", content: "" }]);

      const response = await fetch(`${API_URL}${PROACTIVE_ENDPOINT}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ months }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Proactive simulate failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          if (!raw.startsWith("data:")) continue;
          const payload = raw.slice(5).trim();
          if (!payload) continue;
          try {
            const event = JSON.parse(payload) as StreamEvent;
            applyEvent(event);
          } catch {
            // keepalive or malformed — skip.
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorToast(message);
    } finally {
      setBusy(false);
      setReasoningActiveIndex(null);
    }
  }, [busy, applyEvent]);

  const triggerSimulate = useCallback(() => {
    if (busy || fadeActive) return;
    const months = 3;
    simulatePendingRef.current = months;
    setFadeLabel(`${months} months later`);
    setFadeActive(true);
  }, [busy, fadeActive]);

  const onFadeMidpoint = useCallback(() => {
    // Fire the network call while the overlay is opaque so the judges feel
    // the cut; the stream lands visually just as the overlay fades out.
    void runSimulate();
  }, [runSimulate]);

  const onFadeComplete = useCallback(() => {
    setFadeActive(false);
    simulatePendingRef.current = null;
  }, []);

  const openReasoning = useCallback((m: ChatMessage) => {
    setReasoningSheetMsg(m);
  }, []);
  const closeReasoning = useCallback(() => {
    setReasoningSheetMsg(null);
  }, []);

  const profileCount = Object.keys(profile).length;
  const screeningCount = screenings.length;
  const timelineCount = timeline.length;

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-zinc-50 text-zinc-900"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-tight tracking-tight md:truncate md:text-xl">
              Health Companion
            </h1>
            <p className="hidden text-xs text-zinc-500 sm:block">
              Wellness, not a medical device. Never diagnoses, never prescribes,
              always refers to your doctor.
            </p>
            <p className="mt-0.5 text-[10.5px] leading-tight text-zinc-500 sm:hidden">
              Wellness, not a medical device.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={triggerSimulate}
              disabled={busy || fadeActive}
              aria-label="Simulate three months later"
              title="Simulate: 3 months later"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-dashed border-zinc-300 bg-white px-3 text-[11px] font-medium text-zinc-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3.5a6.5 6.5 0 1 0 6.32 8.06.75.75 0 1 1 1.46.35A8 8 0 1 1 10 2a7.97 7.97 0 0 1 6 2.74V3.75a.75.75 0 0 1 1.5 0V7a.75.75 0 0 1-.75.75H13.5a.75.75 0 0 1 0-1.5h1.81A6.47 6.47 0 0 0 10 3.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">Simulate: 3 months later</span>
              <span className="sm:hidden">+3 months</span>
            </button>

            {/* Hamburger — mobile only */}
            <div ref={mobileMenuRef} className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 active:bg-zinc-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden />
                )}
              </button>

              {mobileMenuOpen && (
                <div
                  role="menu"
                  className="fixed right-3 top-14 z-50 w-52 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  <Link
                    href="/trends"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Trends
                  </Link>
                  <Link
                    href="/bridge"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    title="Preview of the clinician-facing surface"
                  >
                    The Bridge
                  </Link>
                  {(messages.length > 0 || Object.keys(profile).length > 0) && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleStartFresh();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      Start fresh
                    </button>
                  )}
                  <Link
                    href="/how-this-works"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    How this works
                  </Link>
                  <Link
                    href="/privacy"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Your privacy
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Settings
                  </Link>
                  {user?.email && (
                    <div className="border-t border-zinc-100 px-4 py-2.5">
                      <p
                        className="truncate text-xs text-zinc-400"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/trends"
              className="hidden text-xs text-zinc-500 hover:text-zinc-900 md:inline"
            >
              Trends
            </Link>
            <Link
              href="/bridge"
              className="hidden text-xs text-zinc-500 hover:text-zinc-900 md:inline"
              title="Preview of the clinician-facing surface"
            >
              The Bridge
            </Link>
            {(messages.length > 0 || Object.keys(profile).length > 0) && (
              <button
                type="button"
                onClick={() => void handleStartFresh()}
                className="hidden min-h-[32px] items-center rounded-full border border-dashed border-zinc-300 bg-white px-3 text-[11px] font-medium text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 md:inline-flex"
                aria-label="Reset demo state"
                title="Clear everything and start a new thread"
              >
                Start fresh
              </button>
            )}
            <Link
              href="/how-this-works"
              className="hidden text-xs text-zinc-500 hover:text-zinc-900 md:inline"
            >
              How this works
            </Link>
            <Link
              href="/privacy"
              className="hidden text-xs text-zinc-500 hover:text-zinc-900 md:inline"
            >
              Your privacy
            </Link>
            <Link
              href="/settings"
              className="hidden text-xs text-zinc-500 hover:text-zinc-900 md:inline"
            >
              Settings
            </Link>
            {user?.email && (
              <span
                className="hidden max-w-[180px] truncate text-xs text-zinc-500 md:inline"
                title={user.email}
              >
                {user.email}
              </span>
            )}
            {/* Avatar — reads photo from localStorage, falls back to initials.
                Wrapped in a div so the desktop-only visibility cannot be
                overridden by the Avatar's own internal display class. */}
            <div className="hidden md:inline-flex">
              <Avatar
                name={
                  profile && typeof profile.name === "string"
                    ? (profile.name as string)
                    : user?.email ?? undefined
                }
                size={32}
              />
            </div>
            {user?.email && !demoBypass && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                aria-label="Sign out"
                className="inline-flex min-h-[36px] items-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 active:bg-zinc-100"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {freshToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 transform"
        >
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800 shadow-sm">
            {freshToast}
          </div>
        </div>
      )}

      {errorToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="pointer-events-none fixed left-1/2 top-20 z-50 max-w-[min(90vw,520px)] -translate-x-1/2 transform"
        >
          <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-900 shadow-sm">
            {errorToast}
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:px-6 md:py-6">
        {/* Chat surface */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm md:h-[calc(100vh-160px)]">
          <div
            ref={transcriptRef}
            className="flex-1 space-y-5 overflow-y-auto px-4 py-4 md:px-6 md:py-5"
          >
            {messages.length === 0 && (
              <WelcomeCard onPickExample={(text) => setInput(text)} />
            )}
            {messages.map((m, i) => {
              const hasReasoning =
                (m.role === "assistant" || m.role === "proactive") &&
                !!m.reasoning &&
                m.reasoning.length > 0;
              const isReasoningActive = reasoningActiveIndex === i;

              // USER — right-aligned accent-filled bubble.
              if (m.role === "user") {
                return (
                  <div
                    key={i}
                    className="ml-auto flex max-w-[86%] flex-col items-end"
                  >
                    <div
                      className="px-3.5 py-2.5 text-[14.5px] leading-[1.5] text-white"
                      style={{
                        background: "var(--hc-accent-600)",
                        borderRadius: "18px 18px 4px 18px",
                      }}
                    >
                      {m.content}
                    </div>
                    {m.sentAt && (
                      <div
                        className="mt-1 text-right text-[10px] text-muted-foreground"
                        style={{
                          fontFamily:
                            "var(--font-geist-mono, ui-monospace)",
                        }}
                      >
                        {m.sentAt}
                      </div>
                    )}
                  </div>
                );
              }

              // PROACTIVE — when months_later >= 3, render the full-height
              // ProactiveLetter. Shorter gaps keep the compact in-thread card.
              if (m.role === "proactive") {
                const mo =
                  typeof m.proactive?.months_later === "number"
                    ? m.proactive.months_later
                    : 0;
                const useLetter = !!m.proactive && mo >= 3;
                const firstName = firstNameFromProfile(profile);
                return (
                  <div
                    key={i}
                    className="mr-auto flex w-full flex-col items-start gap-2"
                  >
                    {m.proactive && useLetter ? (
                      <ProactiveLetter
                        message={m.proactive}
                        firstName={firstName}
                      />
                    ) : m.proactive ? (
                      <ProactiveMessageCard message={m.proactive} />
                    ) : (
                      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                        {m.content || (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>
                    )}
                    {(hasReasoning || isReasoningActive) && (
                      <button
                        type="button"
                        onClick={() => openReasoning(m)}
                        aria-label="Show clinical reasoning"
                        className="inline-flex min-h-[28px] items-center gap-1 px-0 text-[12px] font-medium transition-colors hover:underline"
                        style={{ color: "var(--hc-amber-fg)" }}
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        <span>See reasoning</span>
                        {isReasoningActive && (
                          <span className="ml-1 flex items-center gap-1 text-amber-500">
                            <span className="hc-pulse inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span className="italic">thinking…</span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              }

              // ASSISTANT — prose companion message (no bubble), optional
              // ToolTraceCard underneath, optional ScheduleCard for
              // screenings scheduled in this turn, plus the "See reasoning"
              // link when extended thinking is available.
              const showTypingDots =
                busy &&
                !m.content &&
                !m.labAnalysis?.panel_summary &&
                !hasReasoning &&
                (m.toolCalls?.length ?? 0) === 0;

              return (
                <div
                  key={i}
                  className="mr-auto flex w-full flex-col items-start gap-2"
                >
                  {/* Companion header + prose */}
                  <div className="w-full px-1">
                    <div className="mb-1.5 flex items-center gap-2">
                      <div
                        className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white"
                        style={{ background: "var(--hc-accent-600)" }}
                        aria-hidden
                      >
                        <Heart className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Your companion
                      </span>
                    </div>
                    {showTypingDots ? (
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <p className="m-0 max-w-[85%] whitespace-pre-wrap text-[15px] leading-[1.55] tracking-[-0.005em] text-zinc-900 dark:text-zinc-100">
                        {m.content || m.labAnalysis?.panel_summary || ""}
                      </p>
                    )}
                  </div>

                  {/* Inline tool-use trace — memory made visible. */}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="w-full">
                      <ToolTraceCard calls={m.toolCalls} />
                    </div>
                  )}

                  {/* Structured follow-up when this turn scheduled screenings */}
                  {m.scheduledScreenings &&
                    m.scheduledScreenings.length > 0 && (
                      <div className="w-full">
                        <ScheduleCard
                          rows={m.scheduledScreenings}
                          showReasoning={showReasoning}
                          onSeeReasoning={() => openReasoning(m)}
                          onLater={() => {
                            // Non-destructive: ScheduleCard is ephemeral in
                            // the transcript; the right-column calendar
                            // still holds the canonical list.
                          }}
                          onAddToPlan={() => {
                            // The right-column calendar already reflects
                            // these; treat this as acknowledgement.
                          }}
                        />
                      </div>
                    )}

                  {/* Lab table (Act 2) */}
                  {m.labAnalysis && (
                    <div className="w-full">
                      <LabTable analysis={m.labAnalysis} />
                    </div>
                  )}

                  {/* See reasoning link — opens the full ReasoningSheet.
                      Only renders when the Settings toggle is on. */}
                  {showReasoning &&
                    (hasReasoning || isReasoningActive) &&
                    !(m.scheduledScreenings && m.scheduledScreenings.length > 0) && (
                      <button
                        type="button"
                        onClick={() => openReasoning(m)}
                        aria-label="Show clinical reasoning"
                        className="inline-flex min-h-[28px] items-center gap-1 px-1 text-[12px] font-medium transition-colors hover:underline"
                        style={{ color: "var(--hc-accent-700)" }}
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        <span>See reasoning</span>
                        {isReasoningActive && (
                          <span className="ml-1 flex items-center gap-1 text-zinc-400">
                            <span className="hc-pulse inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
                            <span className="italic">thinking…</span>
                          </span>
                        )}
                      </button>
                    )}
                </div>
              );
            })}
          </div>

          {/* Mobile-only pills row (above composer) */}
          <div className="flex gap-2 overflow-x-auto border-t border-zinc-200 px-3 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setSheet("profile")}
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            >
              <span>Profile</span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                {profileCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSheet("screenings")}
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            >
              <span>Recommended screenings</span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                {screeningCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSheet("timeline")}
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            >
              <span>Timeline</span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                {timelineCount}
              </span>
            </button>
            <EmergencyPill variant="inline" />
            <button
              type="button"
              onClick={() => setSheet((s) => (s === "upload" ? null : "upload"))}
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
              aria-label="Upload labs"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 0 1 .75.75v7.69l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.22 2.22V3.75A.75.75 0 0 1 10 3Zm-6 12a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 15Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Upload labs</span>
            </button>
          </div>

          {/* Mobile-only collapsible drop zone (above composer) */}
          {sheet === "upload" && (
            <div className="border-t border-zinc-200 px-3 py-3 md:hidden">
              <LabDropZone
                compact
                note={input}
                onStart={onLabStart}
                onStreamEvent={onLabEvent}
                onError={onLabError}
                onDone={onLabDone}
              />
            </div>
          )}

          {/* Composer — pill-shaped, blurred footer, paperclip + send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="border-t border-zinc-200 px-3 py-3 backdrop-blur-md md:px-4"
            style={{
              background: "color-mix(in srgb, var(--background) 92%, transparent)",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-muted py-1.5 pl-3.5 pr-1.5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  // Paperclip — points to the LabDropZone flow. On mobile,
                  // open the upload sheet; on desktop, nudge the user to
                  // the right-column drop-zone.
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setSheet("upload");
                  } else {
                    setErrorToast(
                      "To upload labs, drop a PDF into the panel on the right."
                    );
                  }
                }}
                aria-label="Attach a lab report"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <Paperclip className="h-[18px] w-[18px]" aria-hidden />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  messages.length === 0
                    ? "Tell me something about you. I'm listening."
                    : "Tell me more…"
                }
                className="min-h-[36px] flex-1 border-0 bg-transparent p-0 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                disabled={busy}
                autoFocus
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "var(--hc-accent-600)" }}
              >
                <Send className="h-[14px] w-[14px]" aria-hidden />
              </button>
            </div>
          </form>
        </section>

        {/* Desktop right column: profile (sticky-ish) + screenings + drop + timeline */}
        <aside className="hidden md:flex md:h-[calc(100vh-160px)] md:flex-col md:gap-4 md:overflow-y-auto">
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={
                    profile && typeof profile.name === "string"
                      ? (profile.name as string)
                      : undefined
                  }
                  size={36}
                />
                <div>
                  <h2 className="text-sm font-semibold">Your profile</h2>
                  <p className="text-xs text-zinc-500">
                    Fills in as we talk. Powered by visible tool use.
                  </p>
                </div>
              </div>
            </div>
            <ProfileBody profile={profile} recentlyChanged={recentlyChanged} />
          </div>
          <BiomarkerTrackingList series={trackingSeries} />
          <ScreeningCalendar
            screenings={screenings}
            recentlyAdded={recentlyAddedScreenings}
          />
          <HabitsBlock profile={profile} recentlyChanged={recentlyChanged} />
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <LabDropZone
              note={input}
              onStart={onLabStart}
              onStreamEvent={onLabEvent}
              onError={onLabError}
              onDone={onLabDone}
            />
          </div>
          <HealthTimeline
            events={timeline}
            recentlyAdded={recentlyAddedTimeline}
          />
        </aside>
      </main>

      {/* Mobile sheets */}
      <BottomSheet
        open={sheet === "profile"}
        onClose={() => setSheet(null)}
        title="Your profile"
        subtitle="Fills in as we talk."
      >
        {/* Avatar at top of mobile profile sheet */}
        <div className="flex items-center gap-3 px-5 pb-2 pt-4">
          <Avatar
            name={
              profile && typeof profile.name === "string"
                ? (profile.name as string)
                : undefined
            }
            size={48}
          />
          {profile && typeof profile.name === "string" && profile.name ? (
            <span className="text-sm font-semibold text-zinc-900">
              {profile.name as string}
            </span>
          ) : null}
        </div>
        <ProfileBody profile={profile} recentlyChanged={recentlyChanged} />
        <div className="px-5 pb-4">
          <BiomarkerTrackingList series={trackingSeries} />
        </div>
        <HabitsBlock profile={profile} recentlyChanged={recentlyChanged} />
      </BottomSheet>
      <BottomSheet
        open={sheet === "screenings"}
        onClose={() => setSheet(null)}
        title="Recommended screenings"
        subtitle="Talk to your doctor about them."
      >
        <div className="px-5 py-4">
          {screenings.length === 0 ? (
            <p className="text-xs text-zinc-400">Nothing scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {sortScreenings(screenings).map((s) => {
                const key = screeningKey(s);
                const flashing = recentlyAddedScreenings.has(key);
                return (
                  <div
                    key={key}
                    className={
                      "rounded-lg border px-3 py-2.5 transition-colors " +
                      (flashing
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-zinc-200 bg-zinc-50")
                    }
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-900">
                        {humanizeKind(s.kind)}
                      </div>
                      <div
                        className={
                          "shrink-0 text-xs tabular-nums " +
                          (s.due_by ? "text-zinc-700" : "text-zinc-400")
                        }
                      >
                        {formatDueBy(s.due_by)}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">
                      {s.recommended_by}
                    </div>
                  </div>
                );
              })}
              <p className="pt-1 text-[11px] text-zinc-400">
                Your doctor will confirm timing and eligibility.
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
      <BottomSheet
        open={sheet === "timeline"}
        onClose={() => setSheet(null)}
        title="Timeline"
        subtitle="Everything your companion remembers."
      >
        <HealthTimeline
          events={timeline}
          recentlyAdded={recentlyAddedTimeline}
          embedded
        />
      </BottomSheet>

      {/* Months-later overlay */}
      <MonthsLaterFade
        active={fadeActive}
        label={fadeLabel}
        onMidpoint={onFadeMidpoint}
        onComplete={onFadeComplete}
      />

      {/* See-reasoning sheet — iOS-style on mobile, centered modal on desktop */}
      <ReasoningSheet
        open={reasoningSheetMsg !== null}
        onClose={closeReasoning}
        reasoning={reasoningSheetMsg?.reasoning ?? ""}
        subtitle={
          reasoningSheetMsg?.scheduledScreenings &&
          reasoningSheetMsg.scheduledScreenings.length > 0
            ? `Why ${reasoningSheetMsg.scheduledScreenings[0].name.toLowerCase()} ${reasoningSheetMsg.scheduledScreenings[0].when.toLowerCase()}`
            : undefined
        }
      />

      {/* Emergency affordance — floating bottom-left on desktop. Mobile copy
          lives inline in the pills row above the composer. */}
      <EmergencyPill variant="floating" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session guard wrapper (default export)
// ---------------------------------------------------------------------------

function ChatSkeleton() {
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-zinc-50 text-zinc-900"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:px-6 md:py-6">
        <section className="flex min-h-[60vh] flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex-1 space-y-3 px-4 py-4 md:px-6 md:py-5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
          </div>
        </section>
        <aside className="hidden md:flex md:flex-col md:gap-4">
          <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        </aside>
      </main>
    </div>
  );
}

// Demo bypass — for a judge hitting `?demo=1` (or any build compiled with
// NEXT_PUBLIC_DEMO_BYPASS_AUTH=true) we skip the Supabase session guard and
// render ChatExperience immediately. Keeps the cold-entry experience truly
// one-click and survives any future flakiness in the Supabase session
// hand-off. No backend auth headers are forged — the chat endpoint is
// tolerant of missing tokens in the demo-only deployment.
function useDemoBypass(): boolean {
  const [bypass, setBypass] = useState<boolean>(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_BYPASS_AUTH === "true") {
      setBypass(true);
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1") setBypass(true);
    } catch {
      // noop
    }
  }, []);
  return bypass;
}

export default function ChatPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const demoBypass = useDemoBypass();

  useEffect(() => {
    if (demoBypass) return;
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router, demoBypass]);

  if (!demoBypass && (loading || !session)) {
    return <ChatSkeleton />;
  }

  return <ChatExperience />;
}
