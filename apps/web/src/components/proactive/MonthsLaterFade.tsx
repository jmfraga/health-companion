"use client";

import { useEffect, useState } from "react";

type Props = {
  active: boolean;
  label: string;
  /** Called once the overlay is fully opaque — parent should kick off the
   *  work that belongs "behind" the fade (e.g. open the SSE stream). */
  onMidpoint?: () => void;
  /** Called once the overlay has faded back out. */
  onComplete?: () => void;
};

type Phase = "idle" | "fade-in" | "hold" | "fade-out";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function MonthsLaterFade({
  active,
  label,
  onMidpoint,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const go = (next: Phase, delay: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setPhase(next);
        }, delay)
      );
    };

    if (reduced) {
      // Instant cut, hold the label briefly, then fire midpoint + complete.
      setPhase("hold");
      timers.push(
        setTimeout(() => {
          if (!cancelled) onMidpoint?.();
        }, 50)
      );
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setPhase("idle");
            onComplete?.();
          }
        }, 600)
      );
    } else {
      // fade-in (500 ms) -> hold (500 ms, fire midpoint) -> fade-out (500 ms)
      setPhase("fade-in");
      go("hold", 500);
      timers.push(
        setTimeout(() => {
          if (!cancelled) onMidpoint?.();
        }, 500)
      );
      go("fade-out", 1000);
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setPhase("idle");
            onComplete?.();
          }
        }, 1500)
      );
    }

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
    // Only re-run when `active` flips. onMidpoint / onComplete are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced]);

  if (phase === "idle") return null;

  const opaque = phase === "hold" || phase === "fade-in";
  const transitionClass = reduced
    ? ""
    : "transition-opacity duration-500 ease-in-out";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={
        "pointer-events-none fixed inset-0 z-[60] flex items-center justify-center " +
        transitionClass +
        " " +
        (opaque ? "opacity-100" : "opacity-0")
      }
      style={{ backgroundColor: "rgba(9, 9, 11, 0.94)" }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
          Time passes
        </div>
        <div className="text-2xl font-light tracking-tight text-zinc-50 md:text-3xl">
          {label}
        </div>
      </div>
    </div>
  );
}

export default MonthsLaterFade;
