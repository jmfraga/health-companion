"use client";

import { Wrench } from "lucide-react";

import { Card } from "@/components/ui/card";

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "running" | "done";
};

/**
 * Compact helper that renders an args dict as `key: value` pairs, joined
 * by commas. Values are stringified with JSON to keep arrays/objects legible.
 */
function formatArgs(input: Record<string, unknown>): string {
  const entries = Object.entries(input);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => {
      if (v == null) return `${k}: ∅`;
      if (typeof v === "string") return `${k}: ${v}`;
      if (typeof v === "number" || typeof v === "boolean")
        return `${k}: ${v}`;
      try {
        return `${k}: ${JSON.stringify(v)}`;
      } catch {
        return `${k}: …`;
      }
    })
    .join(", ");
}

/**
 * ToolTraceCard — an in-thread trace of the tool calls the companion
 * made during the current turn. Styled as the prototype does: a compact
 * muted card with a mono list of `save_profile_field(...)` / `fetch_*(...)`
 * rows, emerald dot when done, zinc dot while still running.
 *
 * Memory is visible: this card stays inline in the transcript, not
 * hidden behind a panel.
 */
export function ToolTraceCard({ calls }: { calls: ToolCall[] }) {
  if (!calls || calls.length === 0) return null;

  return (
    <Card
      size="sm"
      className="border-zinc-200 bg-zinc-50 ring-0 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="px-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Wrench
            className="h-3 w-3 text-muted-foreground"
            aria-hidden
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Reading what you said
          </span>
        </div>
        <div
          className="flex flex-col gap-1.5 text-[11.5px] leading-[1.35]"
          style={{ fontFamily: "var(--font-geist-mono, ui-monospace)" }}
        >
          {calls.map((c) => (
            <div key={c.id} className="flex items-baseline gap-1.5">
              <span
                className={
                  "mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full " +
                  (c.status === "done"
                    ? ""
                    : "animate-pulse bg-zinc-400")
                }
                style={
                  c.status === "done"
                    ? { background: "var(--hc-accent-600)" }
                    : undefined
                }
                aria-hidden
              />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.name}
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                ({formatArgs(c.input)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default ToolTraceCard;
