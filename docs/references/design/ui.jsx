// Shared UI primitives for Health Companion screens.
// Reads theme + accent from window.HC_CTX (set by app.jsx).

function useHC() {
  const [ctx, setCtx] = React.useState(() => window.HC_CTX);
  React.useEffect(() => {
    const h = () => setCtx({ ...window.HC_CTX });
    window.addEventListener('hc:ctx', h);
    return () => window.removeEventListener('hc:ctx', h);
  }, []);
  const t = window.HC_TOKENS[ctx.theme];
  const accent = window.HC_TOKENS.accents[ctx.accent];
  return { theme: ctx.theme, accent: ctx.accent, t, a: accent, dark: ctx.theme === 'dark' };
}

// ───────── App chrome: top bar, body, bottom tab bar ─────────
function AppBar({ title, subtitle, left, right, onLeft }) {
  const { t } = useHC();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px 12px', borderBottom: `0.5px solid ${t.border}`,
      background: t.bg,
    }}>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-start' }}>
        {left && (
          <button onClick={onLeft} style={{
            border: 'none', background: 'transparent', padding: 6, borderRadius: 999,
            color: t.fgMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{left}</button>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: t.fg, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.fgMuted, marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function TabBar({ active = 'chat', onChange = () => {} }) {
  const { t, a, dark } = useHC();
  const tabs = [
    { id: 'chat', label: 'Chat', icon: IconChat },
    { id: 'timeline', label: 'Timeline', icon: IconTimeline },
    { id: 'labs', label: 'Labs', icon: IconLabs },
    { id: 'you', label: 'You', icon: IconPerson },
  ];
  return (
    <div style={{
      display: 'flex', borderTop: `0.5px solid ${t.border}`,
      padding: '6px 8px 18px', background: dark ? 'rgba(10,10,11,0.92)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
    }}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 0', color: isActive ? a[dark ? 200 : 700] : t.fgMuted,
          }}>
            <tab.icon size={22} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: '0.02em' }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────── Icons (lucide-like, minimal inline SVG) ─────────
const IconBase = ({ children, size = 18, stroke = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const IconChat = p => <IconBase {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></IconBase>;
const IconTimeline = p => <IconBase {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconBase>;
const IconLabs = p => <IconBase {...p}><path d="M10 2v7.5L4 20a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 20l-6-10.5V2"/><path d="M8 2h8"/></IconBase>;
const IconPerson = p => <IconBase {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></IconBase>;
const IconBack = p => <IconBase {...p}><polyline points="15 18 9 12 15 6"/></IconBase>;
const IconClose = p => <IconBase {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></IconBase>;
const IconSend = p => <IconBase {...p}><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></IconBase>;
const IconPaperclip = p => <IconBase {...p}><path d="M21 12.5L12 21a6 6 0 0 1-8.5-8.5L12 4a4 4 0 0 1 5.7 5.7L9 18a2 2 0 0 1-2.8-2.8L14 7"/></IconBase>;
const IconSparkle = p => <IconBase {...p}><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"/></IconBase>;
const IconTool = p => <IconBase {...p}><path d="M14.7 6.3a4 4 0 0 1 5 5L11 20a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8z"/><path d="m7 17 2-2"/></IconBase>;
const IconCheck = p => <IconBase {...p}><polyline points="20 6 9 17 4 12"/></IconBase>;
const IconLock = p => <IconBase {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconBase>;
const IconCal = p => <IconBase {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></IconBase>;
const IconDoc = p => <IconBase {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></IconBase>;
const IconChevron = p => <IconBase {...p}><polyline points="9 18 15 12 9 6"/></IconBase>;
const IconInfo = p => <IconBase {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></IconBase>;
const IconHeart = p => <IconBase {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.7a5.5 5.5 0 0 0 0-7.7z"/></IconBase>;

// ───────── Common components ─────────
function Chip({ children, tone = 'muted', compact }) {
  const { t, a, dark } = useHC();
  const tones = {
    muted:  { bg: t.bgMuted, fg: t.fgMuted, bd: 'transparent' },
    amber:  { bg: t.amberBg, fg: t.amberFg, bd: t.amberBorder },
    blue:   { bg: t.blueBg,  fg: t.blueFg,  bd: t.blueBorder },
    accent: { bg: dark ? 'rgba(16,120,80,0.2)' : a[50], fg: dark ? a[200] : a[700], bd: dark ? 'rgba(16,120,80,0.3)' : a[200] },
    red:    { bg: t.redBg, fg: t.redFg, bd: t.redBorder },
  };
  const c = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: compact ? '1px 7px' : '3px 9px', borderRadius: 999,
      fontSize: 10.5, fontWeight: 500, letterSpacing: '0.03em',
      background: c.bg, color: c.fg, border: `0.5px solid ${c.bd}`, textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Card({ children, style, tone = 'plain', onClick }) {
  const { t, a, dark } = useHC();
  const tones = {
    plain: { bg: t.card, bd: t.border },
    amber: { bg: t.amberBg, bd: t.amberBorder },
    blue: { bg: t.blueBg, bd: t.blueBorder },
    accent: { bg: dark ? 'rgba(16,120,80,0.12)' : a[50], bd: dark ? 'rgba(16,120,80,0.3)' : a[200] },
    muted: { bg: t.bgMuted, bd: t.border },
  };
  const c = tones[tone];
  return (
    <div onClick={onClick} style={{
      background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 14,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function Button({ children, variant = 'primary', size = 'md', onClick, style, icon }) {
  const { t, a, dark } = useHC();
  const sizes = {
    sm: { h: 30, px: 12, fs: 12.5 },
    md: { h: 38, px: 16, fs: 14 },
    lg: { h: 46, px: 20, fs: 15 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: a[dark ? 500 : 600], fg: '#fff', bd: 'transparent' },
    secondary: { bg: t.bgMuted, fg: t.fg, bd: t.border },
    ghost: { bg: 'transparent', fg: t.fg, bd: 'transparent' },
    outline: { bg: 'transparent', fg: t.fg, bd: t.borderStrong },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs, fontWeight: 500,
      background: v.bg, color: v.fg, border: `1px solid ${v.bd}`,
      borderRadius: 999, cursor: 'pointer', display: 'inline-flex',
      alignItems: 'center', gap: 6, letterSpacing: '-0.005em',
      fontFamily: window.HC_TOKENS.fontSans,
      transition: `all ${window.HC_TOKENS.motion.fast}`,
      ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

function SectionLabel({ children, style }) {
  const { t } = useHC();
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: t.fgMuted,
      fontFamily: window.HC_TOKENS.fontSans,
      ...style,
    }}>{children}</div>
  );
}

function Divider() {
  const { t } = useHC();
  return <div style={{ height: 0.5, background: t.border, width: '100%' }} />;
}

Object.assign(window, {
  useHC, AppBar, TabBar, Chip, Card, Button, SectionLabel, Divider,
  IconBack, IconClose, IconSend, IconPaperclip, IconSparkle, IconTool,
  IconCheck, IconLock, IconCal, IconDoc, IconChevron, IconInfo, IconHeart,
  IconChat, IconTimeline, IconLabs, IconPerson,
});
