"use client";

import { CalendarDays, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ScheduleRow = {
  kind: string;
  name: string;
  when: string;
  sub: string;
};

type Props = {
  rows: ScheduleRow[];
  /** Opens the ReasoningSheet for the current companion turn. */
  onSeeReasoning?: () => void;
  /** Dismiss the structured card ("Later"). */
  onLater?: () => void;
  /** Confirm — adds the screenings to the plan. */
  onAddToPlan?: () => void;
};

/**
 * ScheduleCard — the structured follow-up the companion drops into the
 * transcript when a turn produced one or more `schedule_screening` tool
 * calls. First row is accented (most urgent); the rest are muted.
 *
 * The footer pairs a subtle "See reasoning" link on the left (opens the
 * ReasoningSheet) with Later / Add-to-plan actions on the right.
 */
export function ScheduleCard({
  rows,
  onSeeReasoning,
  onLater,
  onAddToPlan,
}: Props) {
  if (!rows || rows.length === 0) return null;

  return (
    <Card size="sm" className="ring-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays
            className="h-[15px] w-[15px]"
            aria-hidden
            style={{ color: "var(--hc-accent-700)" }}
          />
          <span className="text-[13px] font-semibold text-zinc-900">
            A starting schedule
          </span>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={{
            background: "var(--hc-accent-50)",
            color: "var(--hc-accent-700)",
            border: "0.5px solid var(--hc-accent-200)",
          }}
        >
          {rows.length} {rows.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Rows */}
      <div className="px-0">
        {rows.map((row, i) => {
          const isFirst = i === 0;
          return (
            <div
              key={`${row.kind}-${i}`}
              className={
                "flex gap-2.5 px-4 py-2.5 " +
                (i < rows.length - 1
                  ? "border-b border-zinc-100"
                  : "")
              }
            >
              <div
                className="mt-[6px] h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: isFirst
                    ? "var(--hc-accent-600)"
                    : "#a1a1aa",
                }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13.5px] font-medium text-zinc-900">
                    {row.name}
                  </span>
                  <span
                    className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums"
                    style={{
                      fontFamily: "var(--font-geist-mono, ui-monospace)",
                    }}
                  >
                    {row.when}
                  </span>
                </div>
                <div className="mt-0.5 text-[12.5px] leading-[1.45] text-muted-foreground">
                  {row.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        data-slot="card-footer"
        className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/60 px-4 py-2.5"
      >
        <button
          type="button"
          onClick={onSeeReasoning}
          className="inline-flex items-center gap-1 bg-transparent p-0 text-[12px] font-medium transition-colors hover:underline"
          style={{ color: "var(--hc-accent-700)" }}
        >
          <Sparkles className="h-[13px] w-[13px]" aria-hidden />
          See reasoning
        </button>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={onLater}>
            Later
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onAddToPlan}
            className="border-0 text-white hover:brightness-110"
            style={{ background: "var(--hc-accent-600)" }}
          >
            <Check className="h-[13px] w-[13px]" aria-hidden />
            Add to plan
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ScheduleCard;
