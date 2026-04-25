"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileText } from "lucide-react";

import { getAccessToken } from "@/lib/supabase";
import type { LabAnalysis, LabValue } from "@/components/shared/types";
import { WorthAConversationCard } from "@/components/labs/WorthAConversationCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — plenty for a lab PDF.

type StreamEventHandler = (event: Record<string, unknown>) => void;

type Props = {
  /** The composer value; forwarded as a `note` with the upload. */
  note?: string;
  /** Fires for every SSE event parsed from `/api/ingest-pdf`. */
  onStreamEvent: StreamEventHandler;
  /** Fires once when the upload is queued and the stream is opening. */
  onStart?: (file: File) => void;
  /** Fires on any fatal error (network, non-2xx, or SSE error event). */
  onError?: (message: string) => void;
  /** Fires when the stream finishes (done event or reader exhausted). */
  onDone?: () => void;
  /** Compact variant — used inside the mobile flyout above the composer. */
  compact?: boolean;
  className?: string;
};

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// The four scripted phases the reading-state animates through.
// Opus doesn't emit phase events yet, so steps 1→2→3 advance on fixed
// timers after upload starts. Step 4 stays pulsing until the stream
// closes (done or error).
const READING_STEPS: ReadonlyArray<{ label: string; sub: string }> = [
  {
    label: "Opening the PDF multimodally",
    sub: "Opus 4.7 · vision",
  },
  {
    label: "Extracting values",
    sub: "14 biomarkers · high confidence",
  },
  {
    label: "Cross-referencing your profile",
    sub: "your profile · age / family history",
  },
  {
    label: "Drafting what to say",
    sub: "writing…",
  },
];

// stepIndex is the index of the currently-active (pulsing) step; anything
// before it is "done". Advances on real `phase` SSE events emitted by the
// backend (`opening_pdf` → `extracting_values` → `cross_referencing` →
// `drafting_response`). We never regress — if a phase arrives out of order
// (e.g., `cross_referencing` before `extracting_values` because the model
// chose save_profile_field first), we take the max observed index. A gentle
// fallback timer advances 0 → 1 after 1.2 s if the backend has not emitted
// anything yet, so the UI never feels frozen on a slow cold start.
const PHASE_TO_INDEX: Record<string, number> = {
  opening_pdf: 0,
  extracting_values: 1,
  cross_referencing: 2,
  drafting_response: 3,
};

function useReadingPhase(busy: boolean, phase: string | null) {
  const [stepIndex, setStepIndex] = useState(0);

  // Reset on upload start.
  useEffect(() => {
    if (!busy) {
      setStepIndex(0);
    }
  }, [busy]);

  // Advance monotonically as real phase events arrive.
  useEffect(() => {
    if (!busy || !phase) return;
    const idx = PHASE_TO_INDEX[phase];
    if (typeof idx === "number") {
      setStepIndex((prev) => (idx > prev ? idx : prev));
    }
  }, [busy, phase]);

  // Gentle fallback: if the first phase never fires within 1.2 s of an
  // upload, drift to step 1 so the UI isn't stuck on "Opening the PDF".
  useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => {
      setStepIndex((prev) => (prev === 0 ? 1 : prev));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [busy]);

  return stepIndex;
}

// ---------------------------------------------------------------------------
// ReadingSteps — the 4-step animated breakdown shown during upload.
// ---------------------------------------------------------------------------

function ReadingSteps({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {READING_STEPS.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div
            key={step.label}
            className={
              "flex items-center gap-2.5 px-3.5 py-[11px] " +
              (i < READING_STEPS.length - 1 ? "border-b border-zinc-200" : "")
            }
          >
            <span
              aria-hidden
              className={
                "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full " +
                (done
                  ? "bg-[var(--hc-accent-600)]"
                  : "border-[1.5px] border-zinc-300 bg-transparent")
              }
            >
              {done ? (
                <Check
                  className="h-[11px] w-[11px] text-white"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : active ? (
                <span
                  className="hc-pulse h-[7px] w-[7px] rounded-full bg-[var(--hc-accent-700)]"
                  aria-hidden
                />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-zinc-900">
                {step.label}
              </div>
              <div className="mt-0.5 font-mono text-[11.5px] text-zinc-500">
                {step.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilePreviewCard — the 48x60 filing-card with PDF badge + chips.
// ---------------------------------------------------------------------------

function FilePreviewCard({ file }: { file: File }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="relative flex h-[60px] w-[48px] shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white"
        >
          <FileText className="h-[22px] w-[22px] text-zinc-500" />
          <span
            className="absolute -bottom-1 -right-1 rounded bg-[var(--hc-accent-600)] px-1.5 py-[2px] font-mono text-[8px] font-bold tracking-[0.06em] text-white"
          >
            PDF
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium text-zinc-900">
            {file.name}
          </div>
          <div className="mt-0.5 font-mono text-[11.5px] text-zinc-500">
            {prettyBytes(file.size)} · uploaded just now
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: "var(--hc-blue-bg)",
                color: "var(--hc-blue-fg)",
                border: "0.5px solid var(--hc-blue-border)",
              }}
            >
              Lab report
            </span>
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              Encrypted at rest
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worth-a-conversation derivation
// ---------------------------------------------------------------------------

function pickConversationFinding(
  analysis: LabAnalysis
): WorthFinding | null {
  // Prefer an explicit talk_to_doctor / urgent flag with its own message.
  const flag = (analysis.flags ?? []).find(
    (f) => f.severity === "talk_to_doctor" || f.severity === "urgent"
  );

  if (flag) {
    // Try to pair it with a borderline value referenced in value_refs.
    const ref =
      analysis.values.find(
        (v) =>
          flag.value_refs.includes(v.test) && v.status === "borderline"
      ) ?? analysis.values.find((v) => flag.value_refs.includes(v.test));
    return {
      title: flag.message,
      body:
        ref?.interpretation ??
        "I'll put it on the list for your next check-in with your doctor.",
      metricValue:
        ref?.value != null
          ? String(ref.value)
          : ref?.value_text ?? null,
      metricUnit: ref?.unit ?? null,
    };
  }

  // Otherwise surface the first borderline biomarker.
  const borderline = analysis.values.find((v) => v.status === "borderline");
  if (borderline) {
    return {
      title: titleFromValue(borderline),
      body: borderline.interpretation,
      metricValue:
        borderline.value != null
          ? String(borderline.value)
          : borderline.value_text ?? null,
      metricUnit: borderline.unit ?? null,
    };
  }

  return null;
}

type WorthFinding = {
  title: string;
  body: string;
  metricValue: string | null;
  metricUnit: string | null;
};

function titleFromValue(v: LabValue): string {
  return `${v.test} is a little above normal.`;
}

export function LabDropZone({
  note,
  onStreamEvent,
  onStart,
  onError,
  onDone,
  compact = false,
  className,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [finding, setFinding] = useState<WorthFinding | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stepIndex = useReadingPhase(busy, phase);

  const handleStreamEvent = useCallback(
    (event: Record<string, unknown>) => {
      onStreamEvent(event);
      if (event.type === "phase" && typeof event.phase === "string") {
        setPhase(event.phase);
      } else if (event.type === "lab_analysis" && event.analysis) {
        const analysis = event.analysis as LabAnalysis;
        if (analysis && Array.isArray(analysis.values)) {
          const f = pickConversationFinding(analysis);
          if (f) setFinding(f);
        }
      }
    },
    [onStreamEvent]
  );

  const upload = useCallback(
    async (picked: File) => {
      if (busy) return;
      // Accept PDFs and photos. The photo path enables the equity feature:
      // a user snaps a picture of their bathroom scale, their aunt's BP
      // monitor, a glucometer display — the backend's image task-frame
      // addendum tells Opus 4.7 to read the device and log the value.
      const accepted = new Set([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ]);
      if (!accepted.has(picked.type)) {
        const msg =
          "We accept PDFs or photos (JPEG, PNG, WebP, HEIC). Other file types won't work.";
        setLocalError(msg);
        onError?.(msg);
        return;
      }
      if (picked.size > MAX_BYTES) {
        const kind = picked.type.startsWith("image/") ? "photo" : "PDF";
        const msg = `That ${kind} is too large (limit ${prettyBytes(MAX_BYTES)}).`;
        setLocalError(msg);
        onError?.(msg);
        return;
      }

      setFile(picked);
      setLocalError(null);
      setFinding(null);
      setPhase(null);
      setBusy(true);
      onStart?.(picked);

      try {
        const token = await getAccessToken();
        const form = new FormData();
        form.append("file", picked);
        if (note && note.trim().length > 0) {
          form.append("note", note.trim());
        }

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/ingest-pdf`, {
          method: "POST",
          headers,
          body: form,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Upload failed (${response.status})`);
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
              const event = JSON.parse(payload) as Record<string, unknown>;
              handleStreamEvent(event);
              if (event.type === "error" && typeof event.message === "string") {
                setLocalError(event.message);
                onError?.(event.message);
              }
            } catch {
              // Swallow a malformed keepalive; the stream continues.
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLocalError(msg);
        onError?.(msg);
      } finally {
        setBusy(false);
        // Clear the <input type="file"> so the same file can be picked
        // again. Without this the `change` event never fires on a
        // second pick of the same filename.
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        onDone?.();
      }
    },
    [busy, note, onStart, handleStreamEvent, onError, onDone]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      void upload(files[0]);
    },
    [upload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onBrowse = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const base =
    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors " +
    (dragOver
      ? "border-zinc-400 bg-zinc-50"
      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50");

  const padding = compact ? "px-4 py-4" : "px-5 py-6";

  // When we have a file + reading is in progress, show the rich
  // reading-state (file preview + 4 steps). When reading finishes and
  // a borderline/urgent finding surfaced, keep the preview + worth-a-
  // conversation card until the user drops another file.
  const showReadingState = busy && file !== null;
  const showFindingState = !busy && file !== null && finding !== null;

  return (
    <div className={className}>
      {!compact && !showReadingState && !showFindingState && (
        <div className="mb-2 px-1">
          <h3 className="text-sm font-semibold text-zinc-900">Share anything with a reading</h3>
          <p className="text-xs text-zinc-500">
            Lab PDF · photo of a smartwatch, blood pressure cuff, prescription label — anything readable.
          </p>
        </div>
      )}

      {showReadingState && file ? (
        <div className="flex flex-col gap-3">
          <FilePreviewCard file={file} />
          <div>
            <div className="mb-1.5 pl-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
              Reading your labs
            </div>
            <ReadingSteps activeIndex={stepIndex} />
          </div>
        </div>
      ) : showFindingState && file ? (
        <div className="flex flex-col gap-3">
          <FilePreviewCard file={file} />
          {finding && (
            <WorthAConversationCard
              title={finding.title}
              body={finding.body}
              metricValue={finding.metricValue}
              metricUnit={finding.metricUnit}
            />
          )}
          <p className="mx-2 text-center text-[11.5px] leading-[1.5] text-zinc-500">
            I never diagnose or prescribe. I educate, contextualize, and refer
            you back to your doctor.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="self-center text-[12px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
          >
            Upload another PDF
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a file or photo, or click to browse"
          aria-busy={busy}
          onClick={onBrowse}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onBrowse();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={base + " " + padding + " cursor-pointer select-none"}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={busy}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-7 w-7 text-zinc-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V4m0 0 4 4m-4-4-4 4m-4 6v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
            />
          </svg>
          {file ? (
            <>
              <div className="text-sm font-medium text-zinc-900">
                {file.name}
              </div>
              <div className="text-xs text-zinc-500">
                {prettyBytes(file.size)} · preview on request
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">
                Drop another PDF to replace.
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-zinc-700">
                Drop a file or photo here
              </div>
              <div className="text-xs text-zinc-500">
                or tap to choose
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden input so browse works even from the finding state */}
      {(showReadingState || showFindingState) && (
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy}
        />
      )}

      {/* Errors surface via the parent-level toast (onError callback). */}
    </div>
  );
}

export default LabDropZone;
