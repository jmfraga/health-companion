"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

type ProfileSnapshot = Record<string, unknown>;

type StreamEvent =
  | { type: "message_delta"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; output?: Record<string, unknown>; error?: string }
  | { type: "profile_snapshot"; profile: ProfileSnapshot }
  | { type: "reasoning_start" }
  | { type: "reasoning_delta"; text: string }
  | { type: "reasoning_stop" }
  | { type: "done" }
  | { type: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({});
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Index of the assistant message that is currently streaming reasoning,
  // or null when no reasoning is in flight. Drives the pulse on the
  // "See reasoning" collapsed label.
  const [reasoningActiveIndex, setReasoningActiveIndex] = useState<number | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
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
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            const field = String((event.input as Record<string, unknown>).field ?? "");
            const value = (event.input as Record<string, unknown>).value;
            if (field) {
              setProfile((prev) => ({ ...prev, [field]: value }));
              flashField(field);
            }
          } else if (event.type === "profile_snapshot") {
            setProfile(event.profile);
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
  }, [input, busy, messages, flashField]);

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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Health Companion</h1>
            <p className="text-xs text-zinc-500">
              Wellness, not a medical device. Never diagnoses, never prescribes, always refers to your doctor.
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            sprint 1 — plumbing
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[1fr_320px]">
        <section className="flex h-[calc(100vh-160px)] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div
            ref={transcriptRef}
            className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
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
                        ? "rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-sm text-white"
                        : "rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-2.5 text-sm"
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
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
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
                        <div className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
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

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2 border-t border-zinc-200 px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about yourself..."
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
              disabled={busy}
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {busy ? "…" : "Send"}
            </button>
          </form>
        </section>

        <aside className="flex h-[calc(100vh-160px)] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold">Your profile</h2>
            <p className="text-xs text-zinc-500">
              Fills in as we talk. Powered by visible tool use.
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
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
        </aside>
      </main>
    </div>
  );
}
