// Health Companion design tokens
// Mirrors apps/web/src/app/globals.css and extends with the app's semantic palette:
// zinc base · emerald accents · amber proactive · red reserved for critical/emergency
// Geist Sans + Geist Mono typography.

window.HC_TOKENS = {
  // Semantic colors (light)
  light: {
    bg: '#ffffff',
    bgSubtle: '#fafaf9',
    bgMuted: '#f4f4f5',          // zinc-100
    fg: '#18181b',                // zinc-900
    fgMuted: '#71717a',           // zinc-500
    fgSubtle: '#a1a1aa',          // zinc-400
    border: '#e4e4e7',            // zinc-200
    borderStrong: '#d4d4d8',      // zinc-300
    card: '#ffffff',
    // Proactive = amber
    amberBg: '#fffbeb',
    amberBorder: '#fde68a',
    amberFg: '#92400e',
    // Lab / sensor = blue
    blueBg: '#eff6ff',
    blueBorder: '#bfdbfe',
    blueFg: '#1d4ed8',
    // Critical = red (reserved)
    redBg: '#fef2f2',
    redBorder: '#fecaca',
    redFg: '#b91c1c',
  },
  dark: {
    bg: '#0a0a0a',
    bgSubtle: '#0f0f10',
    bgMuted: '#18181b',
    fg: '#fafafa',
    fgMuted: '#a1a1aa',
    fgSubtle: '#71717a',
    border: '#27272a',
    borderStrong: '#3f3f46',
    card: '#131316',
    amberBg: 'rgba(120, 80, 20, 0.18)',
    amberBorder: 'rgba(251, 191, 36, 0.28)',
    amberFg: '#fbbf24',
    blueBg: 'rgba(30, 64, 150, 0.18)',
    blueBorder: 'rgba(96, 165, 250, 0.28)',
    blueFg: '#93c5fd',
    redBg: 'rgba(120, 20, 20, 0.2)',
    redBorder: 'rgba(239, 68, 68, 0.3)',
    redFg: '#fca5a5',
  },
  // Accent hue palette options — emerald / teal / moss
  accents: {
    emerald: { // default per repo convention
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
      500: '#10b981', 600: '#059669', 700: '#047857',
    },
    teal: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
      500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    },
    moss: { // warm, earthy — good for clinical-journal feel
      50: '#f6f7ed', 100: '#e9edd3', 200: '#d4dea7',
      500: '#7c9158', 600: '#627a44', 700: '#4e6137',
    },
  },
  // Spacing scale (4px base)
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80],
  radius: { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 },
  // Type scale (Geist Sans, Geist Mono)
  fontSans: `"Geist", "Geist Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`,
  fontMono: `"Geist Mono", "SF Mono", ui-monospace, Menlo, monospace`,
  type: {
    display: { size: 28, lh: 1.15, weight: 600, tracking: '-0.02em' },
    title:   { size: 20, lh: 1.25, weight: 600, tracking: '-0.01em' },
    heading: { size: 16, lh: 1.35, weight: 600, tracking: '0' },
    body:    { size: 15, lh: 1.5,  weight: 400, tracking: '0' },
    small:   { size: 13, lh: 1.45, weight: 400, tracking: '0' },
    micro:   { size: 11, lh: 1.4,  weight: 500, tracking: '0.04em' },
    mono:    { size: 12, lh: 1.4,  weight: 400, tracking: '0' },
  },
  // Motion
  motion: {
    fast: '150ms cubic-bezier(.4,0,.2,1)',
    base: '240ms cubic-bezier(.4,0,.2,1)',
    slow: '420ms cubic-bezier(.22,.61,.36,1)',
    settle: '720ms cubic-bezier(.22,.61,.36,1)',
  },
};
