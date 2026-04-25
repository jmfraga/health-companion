"use client";

/**
 * Avatar — centralised user avatar.
 *
 * Reads `hc_profile_photo` from localStorage after mount (SSR-safe).
 * Listens for the custom event `hc-profile-photo-changed` so header and
 * panel update live when the user picks/removes a photo in /settings.
 *
 * If no photo is set, renders a zinc circle with the first 1–2 initials of
 * `name` (or "?" when name is absent).
 */

import { useEffect, useState } from "react";

const LS_KEY = "hc_profile_photo";
const CHANGE_EVENT = "hc-profile-photo-changed";

function initials(name?: string): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
}

export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  // Start with null (renders initials on server and first paint).
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    // Read from localStorage only on client.
    const read = () => {
      try {
        setPhoto(window.localStorage.getItem(LS_KEY));
      } catch {
        setPhoto(null);
      }
    };
    read();

    // Live-update when /settings dispatches the change event.
    const onChanged = () => read();
    window.addEventListener(CHANGE_EVENT, onChanged);
    return () => window.removeEventListener(CHANGE_EVENT, onChanged);
  }, []);

  const label = name ? `${name}'s avatar` : "User avatar";
  const fontSize = Math.max(10, Math.round(size * 0.36));

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={label}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ${className}`}
      style={{ width: size, height: size, fontSize }}
    >
      {initials(name)}
    </span>
  );
}
