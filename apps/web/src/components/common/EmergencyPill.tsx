"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { DetailOverlay } from "@/components/common/DetailOverlay";

type Props = {
  /**
   * When the pill lives inside the mobile pills row, the fixed-bottom-left
   * styling is suppressed so the pill flows with its siblings.
   */
  variant?: "floating" | "inline";
};

/**
 * EmergencyPill — the calm visible affordance the orchestrator's safety
 * posture needs. One click surfaces region-specific numbers (US / MX /
 * EU / UK). Zinc palette with a single red accent on the phone numbers.
 */
export function EmergencyPill({ variant = "floating" }: Props) {
  const [open, setOpen] = useState(false);

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

  const floatingClasses =
    "fixed bottom-4 left-4 z-30 hidden md:inline-flex";

  const inlineClasses = "flex min-h-[44px] shrink-0 px-3 text-sm md:hidden";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Emergency resources"
        className={
          baseClasses +
          " " +
          (variant === "floating" ? floatingClasses : inlineClasses)
        }
      >
        <AlertCircle
          className={
            "shrink-0 text-red-600 " +
            (variant === "inline" ? "h-4 w-4" : "h-3.5 w-3.5")
          }
          aria-hidden
        />
        <span>Emergency?</span>
      </button>
      <DetailOverlay
        open={open}
        onClose={() => setOpen(false)}
        title="If this is an emergency"
      >
        <div className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed text-zinc-700">
          <p className="text-zinc-600">
            Your companion is not a substitute for emergency care. If you or
            someone near you needs urgent help, please use the appropriate
            local line below.
          </p>
          <RegionBlock
            region="United States"
            items={[
              { label: "911", note: "any emergency" },
              { label: "988", note: "Suicide and Crisis Lifeline" },
              { label: "1-800-273-8255", note: "legacy crisis line" },
            ]}
          />
          <RegionBlock
            region="México"
            items={[
              { label: "911", note: "cualquier emergencia" },
              { label: "55-5259-8121", note: "SAPTEL, crisis emocional" },
            ]}
          />
          <RegionBlock
            region="European Union"
            items={[{ label: "112", note: "any emergency" }]}
          />
          <RegionBlock
            region="United Kingdom"
            items={[
              { label: "999", note: "any emergency" },
              { label: "111", note: "NHS non-emergency" },
            ]}
          />
          <p className="border-t border-zinc-200 pt-4 text-xs text-zinc-500">
            If you&apos;re not sure, calling your local emergency number is the
            right call.
          </p>
        </div>
      </DetailOverlay>
    </>
  );
}

function RegionBlock({
  region,
  items,
}: {
  region: string;
  items: { label: string; note: string }[];
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {region}
      </h3>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold tabular-nums text-red-600">
              {item.label}
            </span>
            <span className="text-xs text-zinc-600">— {item.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EmergencyPill;
