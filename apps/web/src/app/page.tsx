"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
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
  | { type: "memory_snapshot"; memory: unknown }
  | { type: "reasoning_start" }
  | { type: "reasoning_delta"; text: string }
  | { type: "reasoning_stop" }
  | { type: "done" }
  | { type: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

function humanizeKind(kind: string): string {
  if (SCREENING_LABELS[kind]) return SCREENING_LABELS[kind];
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
        <h2 className="text-sm font-semibold">Screenings</h2>
        <p className="text-xs text-zinc-500">
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
        <p className="text-xs text-zinc-400">Nothing here yet.</p>
      ) : (
        Object.entries(profile).map(([field, value]) => (
          <div
            key={field}
            className={
              "rounded-md border px-3 py-2 text-xs transition-colors " +
              (recentlyChanged.has(field)
                ? "border-emerald-300 bg-emerald-50"
                : "border-zinc-200 bg-zinc-50")
            }
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {field}
            </div>
            <div className="mt-0.5 font-mono text-zinc-900">
              {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </div>
          </div>
        ))
      )}
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

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({});
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const [screenings, setScreenings] = useState<ScreeningEntry[]>([]);
  const [recentlyAddedScreenings, setRecentlyAddedScreenings] = useState<Set<string>>(
    new Set()
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoningActiveIndex, setReasoningActiveIndex] = useState<number | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
  const [sheet, setSheet] = useState<null | "profile" | "screenings">(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    setError(null);

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

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: nextMessages }),
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

          if (event.type === "message_delta") {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: last.content + event.text };
              }
              return copy;
            });
          } else if (event.type === "tool_use") {
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
              }
            }
          } else if (event.type === "profile_snapshot") {
            setProfile(event.profile);
          } else if (event.type === "screenings_snapshot") {
            // Reconcile: add any we missed without disturbing flash state.
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
          } else if (event.type === "reasoning_start") {
            setMessages((prev) => {
              const idx = prev.length - 1;
              if (idx >= 0 && prev[idx].role === "assistant") {
                setReasoningActiveIndex(idx);
              }
              return prev;
            });
          } else if (event.type === "reasoning_delta") {
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              const last = copy[lastIdx];
              if (last?.role === "assistant") {
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
            setError(event.message);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setBusy(false);
      setReasoningActiveIndex(null);
    }
  }, [input, busy, messages, flashField, flashScreening]);

  const toggleReasoning = useCallback((idx: number) => {
    setExpandedReasoning((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const profileCount = Object.keys(profile).length;
  const screeningCount = screenings.length;

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-zinc-50 text-zinc-900"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
              Health Companion
            </h1>
            <p className="hidden text-xs text-zinc-500 sm:block">
              Wellness, not a medical device. Never diagnoses, never prescribes,
              always refers to your doctor.
            </p>
            <p className="text-[11px] text-zinc-500 sm:hidden">
              Wellness, not a medical device.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {user?.email && (
              <span
                className="hidden max-w-[180px] truncate text-xs text-zinc-500 md:inline"
                title={user.email}
              >
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="inline-flex min-h-[36px] items-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:px-6 md:py-6">
        {/* Chat surface */}
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm md:h-[calc(100vh-160px)]">
          <div
            ref={transcriptRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6 md:py-5"
          >
            {messages.length === 0 && (
              <div className="rounded-lg bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
                Say hi and tell me a little about yourself. Try:
                <span className="mt-2 block font-mono text-xs text-zinc-600">
                  &quot;I&apos;m 40, male, my dad had a heart attack at 60.&quot;
                </span>
              </div>
            )}
            {messages.map((m, i) => {
              const hasReasoning =
                m.role === "assistant" && !!m.reasoning && m.reasoning.length > 0;
              const isReasoningActive = reasoningActiveIndex === i;
              const isExpanded = expandedReasoning.has(i);
              return (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto flex max-w-[85%] flex-col items-end"
                      : "mr-auto flex max-w-[85%] flex-col items-start"
                  }
                >
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-[15px] leading-snug text-white md:text-sm"
                        : "rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-[15px] leading-snug md:text-sm"
                    }
                  >
                    {m.content ||
                      (m.role === "assistant" && busy && !hasReasoning ? (
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
                        </span>
                      ) : (
                        ""
                      ))}
                  </div>
                  {(hasReasoning || (m.role === "assistant" && isReasoningActive)) && (
                    <div className="mt-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(i)}
                        aria-expanded={isExpanded}
                        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className={
                            "h-3 w-3 transition-transform " +
                            (isExpanded ? "rotate-90" : "rotate-0")
                          }
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.44 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l3.75 4.25a.75.75 0 0 1 0 1.04l-3.75 4.25a.75.75 0 0 1-1.1.02Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>See reasoning</span>
                        {isReasoningActive && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                            <span className="italic">thinking…</span>
                          </span>
                        )}
                      </button>
                      {isExpanded && hasReasoning && (
                        <div className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2.5 text-[13px] leading-relaxed text-zinc-500 md:text-xs">
                          {m.reasoning}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Mobile-only pills row (above composer) */}
          <div className="flex gap-2 border-t border-zinc-200 px-3 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setSheet("profile")}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            >
              <span>Your profile</span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                {profileCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSheet("screenings")}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100"
            >
              <span>Screenings</span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                {screeningCount}
              </span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t border-zinc-200 px-3 py-3 md:px-4"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about yourself..."
              className="min-h-[44px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base outline-none transition focus:border-zinc-400 md:text-sm"
              disabled={busy}
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="min-h-[44px] min-w-[64px] rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </section>

        {/* Desktop right column: profile (sticky-ish) + screenings below */}
        <aside className="hidden md:flex md:h-[calc(100vh-160px)] md:flex-col md:gap-4 md:overflow-y-auto">
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-sm font-semibold">Your profile</h2>
              <p className="text-xs text-zinc-500">
                Fills in as we talk. Powered by visible tool use.
              </p>
            </div>
            <ProfileBody profile={profile} recentlyChanged={recentlyChanged} />
          </div>
          <ScreeningCalendar
            screenings={screenings}
            recentlyAdded={recentlyAddedScreenings}
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
        <ProfileBody profile={profile} recentlyChanged={recentlyChanged} />
      </BottomSheet>
      <BottomSheet
        open={sheet === "screenings"}
        onClose={() => setSheet(null)}
        title="Screenings"
        subtitle="Preventive checks your companion is tracking."
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

export default function ChatPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return <ChatSkeleton />;
  }

  return <ChatExperience />;
}
