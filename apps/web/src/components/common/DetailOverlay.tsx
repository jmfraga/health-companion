"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

/**
 * DetailOverlay — a modal surface the companion uses whenever an entry
 * carries enough detail that the inline accordion would cramp it.
 *
 * Desktop (≥ md): centered, 85vw / 80vh, rounded-2xl, subtle backdrop.
 * Mobile (< md): full-screen, slides up from the bottom.
 *
 * Accessible-enough for the hackathon: Escape closes, backdrop-click
 * closes, focus moves into the panel on open, scroll is locked on
 * the body while open.
 */
export function DetailOverlay({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the overlay so Escape + tabs behave.
    const raf = requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);

  // Simple focus trap — keep Tab inside the overlay while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className={
        "fixed inset-0 z-50 " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={
          "absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-200 " +
          (open ? "opacity-100" : "opacity-0")
        }
      />
      {/* Panel container */}
      <div
        className={
          "absolute inset-0 flex flex-col md:items-center md:justify-center " +
          (open ? "" : "pointer-events-none")
        }
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Details"}
          tabIndex={-1}
          className={
            // Mobile: full-screen, slides up. Desktop: centered card.
            "flex w-full flex-col bg-white shadow-xl outline-none transition-transform duration-200 ease-out " +
            "h-[100dvh] md:h-auto md:max-h-[80vh] md:w-[85vw] md:max-w-5xl md:rounded-2xl " +
            (open ? "translate-y-0" : "translate-y-full md:translate-y-0 md:opacity-0")
          }
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Header: title + close. Close sits right on desktop, left on mobile. */}
          <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 md:px-5 md:py-4">
            {/* Mobile close — left */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 md:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 md:text-base">
              {title ?? ""}
            </h2>
            {/* Desktop close — right */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 md:inline-flex"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {/* Body scrolls */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailOverlay;
