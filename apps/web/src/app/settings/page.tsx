"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/profile/Avatar";

const REASONING_KEY = "hc:showReasoning";
const PHOTO_KEY = "hc_profile_photo";
const PHOTO_CHANGE_EVENT = "hc-profile-photo-changed";
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB safety guard
const CANVAS_SIZE = 256; // output square in px
const JPEG_QUALITY = 0.85;

/**
 * Settings — first real surface for the preferences that shape the rest of
 * the product. Phase 0 ships the reasoning-visibility toggle so the three-
 * layer reasoning-visibility decision (always-on "why", opt-in disclosure,
 * always-written audit log) is concrete. Every other toggle lands in Phase 1.
 */
/** Resize & center-crop an image File to a 256×256 JPEG data URL. */
async function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unavailable"));
          return;
        }
        // Center-crop: find largest square that fits, centered.
        const { naturalWidth: w, naturalHeight: h } = img;
        const side = Math.min(w, h);
        const sx = (w - side) / 2;
        const sy = (h - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = src;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  // Default ON — matches the chat-page default so the toggle reflects
  // what a fresh visitor actually sees. Only an explicit "false" in
  // localStorage flips it off.
  const [showReasoning, setShowReasoning] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  // Photo state
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REASONING_KEY);
      // Only an explicit "false" turns it off; null/missing = ON.
      setShowReasoning(raw !== "false");
    } finally {
      setHydrated(true);
    }
    // Read photo
    try {
      setPhoto(window.localStorage.getItem(PHOTO_KEY));
    } catch {
      // private browsing — just leave null
    }
  }, []);

  const toggle = () => {
    const next = !showReasoning;
    setShowReasoning(next);
    try {
      window.localStorage.setItem(REASONING_KEY, String(next));
      // Notify the chat page (same-tab) that the preference changed so it
      // can re-read without a reload. The storage event fires on other tabs
      // automatically; we dispatch it manually for the current tab.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: REASONING_KEY,
          newValue: String(next),
        })
      );
    } catch {
      // Private browsing or localStorage disabled — toggle still reflects
      // in-memory state for this session.
    }
  };

  // Photo handlers
  const dispatchPhotoChange = () => {
    window.dispatchEvent(new Event(PHOTO_CHANGE_EVENT));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value so the same file can be re-picked after removal.
    e.target.value = "";
    setPhotoError(null);
    if (file.size > MAX_INPUT_BYTES) {
      setPhotoError("Couldn't read that file — try a smaller photo.");
      return;
    }
    try {
      const dataUrl = await resizeToDataUrl(file);
      window.localStorage.setItem(PHOTO_KEY, dataUrl);
      setPhoto(dataUrl);
      dispatchPhotoChange();
    } catch {
      setPhotoError("Couldn't read that file — try a smaller photo.");
    }
  };

  const removePhoto = () => {
    try {
      window.localStorage.removeItem(PHOTO_KEY);
    } catch {
      // noop
    }
    setPhoto(null);
    setPhotoError(null);
    dispatchPhotoChange();
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Settings
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Your preferences
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            Settings
          </h1>
          <p className="mt-2 text-base text-zinc-600">
            What you see, what the companion does, what we remember.
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Profile photo                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Profile photo</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Optional — shown in your header and profile panel. Stored only in
            this browser; never uploaded anywhere.
          </p>

          <div className="mt-5 flex items-center gap-5">
            {/* 128 × 128 circular preview */}
            <div className="shrink-0">
              <Avatar name={undefined} size={128} />
            </div>

            <div className="flex flex-col gap-3">
              {/* Hidden native file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Choose profile photo"
                onChange={onFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[36px] items-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100"
              >
                {photo ? "Change photo" : "Choose photo"}
              </button>

              {photo && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Remove photo
                </button>
              )}

              {photoError && (
                <p role="alert" className="text-xs text-rose-600">
                  {photoError}
                </p>
              )}

              <p className="text-xs text-zinc-400">
                JPEG, PNG, or WEBP · resized to 256 × 256 in your browser
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Reasoning visibility                                                */}
        {/* ------------------------------------------------------------------ */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">
            Show reasoning in conversations
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Every clinical turn has an audit layer — the model's own
            reasoning. When this is on, you&apos;ll see a small &quot;See
            reasoning&quot; button next to the companion&apos;s replies and
            structured cards. Opening it shows the clinical note the model
            drafted while thinking about you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            It&apos;s off by default. Most users don&apos;t need to audit
            every turn, and raw reasoning can be distracting. Your
            companion still writes the reasoning &mdash; it&apos;s always in
            the audit log your doctor can review if you share it. Turning
            this on just surfaces it in your conversation.
          </p>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-900">
                Show &quot;See reasoning&quot;
              </div>
              <div className="text-xs text-zinc-500">
                {hydrated
                  ? showReasoning
                    ? "On — the button shows next to clinical replies."
                    : "Off — reasoning stays written in the audit log only."
                  : " "}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showReasoning}
              aria-label="Show reasoning in conversations"
              onClick={toggle}
              disabled={!hydrated}
              className={
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-wait " +
                (showReasoning ? "" : "border border-zinc-300 bg-zinc-200")
              }
              style={
                showReasoning
                  ? { background: "var(--hc-accent-600)" }
                  : undefined
              }
            >
              <span
                aria-hidden
                className={
                  "pointer-events-none block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform " +
                  (showReasoning ? "translate-x-5" : "translate-x-0.5")
                }
              />
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">Coming soon</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            These settings are on the roadmap for the private beta:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
              <span>
                <strong className="font-medium">Language override.</strong>{" "}
                Default follows your device; override in conversation or here.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
              <span>
                <strong className="font-medium">Hide sections.</strong>{" "}
                Vaccines and other surfaces you&apos;d rather not engage with.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
              <span>
                <strong className="font-medium">Export or delete your data.</strong>{" "}
                One click, no questions, thirty-day server wipe.
              </span>
            </li>
          </ul>
        </section>

        <footer className="mt-8 flex items-center justify-between text-xs text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-900">
            Your privacy
          </Link>
          <Link href="/how-this-works" className="hover:text-zinc-900">
            How this works
          </Link>
        </footer>
      </main>
    </div>
  );
}
