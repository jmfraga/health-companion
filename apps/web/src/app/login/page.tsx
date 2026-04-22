"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If they already have a session, bounce them home.
  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, session, router]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setBusy("google");
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (signInError) {
        setError(signInError.message);
        setBusy(null);
      }
      // On success Supabase redirects the browser — no need to reset state.
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setBusy(null);
    }
  }, []);

  const handleDemo = useCallback(async () => {
    setError(null);
    setBusy("demo");
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        setError(
          signInError.message.includes("disabled") ||
            signInError.message.toLowerCase().includes("anonymous")
            ? "Demo access isn't enabled yet. Ask Juan Manuel to turn on Anonymous sign-ins in Supabase."
            : signInError.message
        );
        setBusy(null);
        return;
      }
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setBusy(null);
    }
  }, [router]);

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 px-4 text-zinc-900"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <main className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Health Companion
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              A friend who knows health. Here to help you stay well — in the
              language you actually speak.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy !== null}
              className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-[15px] font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              <span>
                {busy === "google" ? "Opening Google…" : "Continue with Google"}
              </span>
            </button>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[15px] font-medium text-zinc-400"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M16.365 1.43c0 1.14-.45 2.23-1.18 3.03-.78.86-2.05 1.53-3.09 1.45-.14-1.11.42-2.27 1.12-3.02.79-.85 2.13-1.48 3.15-1.46zM21.5 17.22c-.56 1.28-.83 1.85-1.55 2.98-1 1.58-2.42 3.55-4.17 3.57-1.56.02-1.96-1.01-4.07-1-2.11.01-2.55 1.02-4.11 1-1.75-.02-3.1-1.8-4.1-3.38-2.8-4.44-3.1-9.65-1.37-12.42 1.23-1.97 3.17-3.12 4.99-3.12 1.86 0 3.03 1.02 4.57 1.02 1.5 0 2.41-1.02 4.56-1.02 1.63 0 3.35.89 4.57 2.42-4.02 2.2-3.36 7.94.68 7.95z" />
              </svg>
              <span>Continue with Apple</span>
              <span className="ml-1 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Soon
              </span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
              {error}
            </div>
          )}

          <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-500">
            Your data is encrypted at rest and in transit. You can export or
            delete everything, anytime.
          </p>

          <div className="mt-5 border-t border-zinc-100 pt-4 text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={busy !== null}
              className="text-[12px] font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "demo" ? "Entering…" : "Enter as demo user"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-400">
          Wellness, not a medical device. Never diagnoses, never prescribes.
        </p>
      </main>
    </div>
  );
}
