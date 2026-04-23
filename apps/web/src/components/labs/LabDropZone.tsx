"use client";

import { useCallback, useRef, useState } from "react";

import { getAccessToken } from "@/lib/supabase";

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const upload = useCallback(
    async (picked: File) => {
      if (busy) return;
      if (picked.type !== "application/pdf") {
        const msg = "Please drop a PDF file.";
        setLocalError(msg);
        onError?.(msg);
        return;
      }
      if (picked.size > MAX_BYTES) {
        const msg = `That PDF is too large (limit ${prettyBytes(MAX_BYTES)}).`;
        setLocalError(msg);
        onError?.(msg);
        return;
      }

      setFile(picked);
      setLocalError(null);
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
              onStreamEvent(event);
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
    [busy, note, onStart, onStreamEvent, onError, onDone]
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
      : busy
        ? "border-zinc-200 bg-zinc-50"
        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50");

  const padding = compact ? "px-4 py-4" : "px-5 py-6";

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-2 px-1">
          <h3 className="text-sm font-semibold text-zinc-900">Upload lab PDF</h3>
          <p className="text-xs text-zinc-500">
            Drop a report and your companion will read it with you.
          </p>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop a PDF or click to browse"
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
          accept="application/pdf"
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
          className={"h-7 w-7 " + (busy ? "text-zinc-300" : "text-zinc-400")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V4m0 0 4 4m-4-4-4 4m-4 6v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
          />
        </svg>
        {busy ? (
          <>
            <div className="text-sm font-medium text-zinc-700">
              Reading {file?.name ?? "your PDF"}…
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
              <span className="ml-1">streaming</span>
            </div>
          </>
        ) : file ? (
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
              Drop a PDF here
            </div>
            <div className="text-xs text-zinc-500">
              or tap to choose a file
            </div>
          </>
        )}
      </div>

      {localError && !busy && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {localError}
        </div>
      )}
    </div>
  );
}

export default LabDropZone;
