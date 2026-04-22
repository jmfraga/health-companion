"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Supabase JS v2 with `detectSessionInUrl: true` will itself parse the
    // code / hash from the URL and exchange it for a session on init. We just
    // need to wait for that to land and then redirect.
    async function finish() {
      try {
        // Pass the full URL so Supabase can exchange the `code` query param
        // when PKCE is used. For implicit-flow hashes, getSession() will pick
        // them up automatically.
        if (typeof window !== "undefined" && window.location.search.includes("code=")) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (exchangeError && !cancelled) {
            setError(exchangeError.message);
            return;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          router.replace("/");
        } else {
          // No session — OAuth probably errored. Let the auth state listener
          // below try once more before giving up.
          setTimeout(async () => {
            if (cancelled) return;
            const retry = await supabase.auth.getSession();
            if (retry.data.session) {
              router.replace("/");
            } else {
              setError("Could not complete sign-in. Please try again.");
            }
          }, 500);
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      }
    }

    void finish();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        router.replace("/");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-50 px-4 text-zinc-900">
      <div className="flex flex-col items-center gap-4">
        {!error ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms]" />
              </span>
            </div>
            <p className="text-sm text-zinc-600">Signing you in…</p>
          </>
        ) : (
          <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            <p className="mb-2 font-medium">Sign-in didn&apos;t complete.</p>
            <p className="text-xs leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-zinc-900 px-4 text-xs font-medium text-white"
            >
              Back to sign-in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
