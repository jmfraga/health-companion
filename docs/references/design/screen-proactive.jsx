// Screen 4: Three-months-later proactive landing — a letter that becomes the home.
function ScreenProactive() {
  const { t, a, dark } = useHC();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
      background: dark ? 'linear-gradient(180deg, #0a0a0a 0%, #131316 100%)' : 'linear-gradient(180deg, #fefce8 0%, #ffffff 50%)',
    }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          July 18 · 8:14
        </div>
        <IconClose size={18} style={{ color: t.fgMuted }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 32px' }}>
        {/* Pill */}
        <div style={{ marginBottom: 18 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: t.amberBg, color: t.amberFg,
            border: `0.5px solid ${t.amberBorder}`,
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
            Three months later
          </span>
        </div>

        {/* The letter */}
        <div style={{ fontFamily: window.HC_TOKENS.fontSans }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: t.fg, lineHeight: 1.15, marginBottom: 18 }}>
            Good morning, Laura.
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: t.fg, margin: '0 0 14px' }}>
            You turn 45 next month.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: t.fg, margin: '0 0 14px' }}>
            Remember what we talked about the first day — your mom, and that first mammography we said we'd do before your 45th? It's time.
          </p>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: t.fgMuted, margin: '0 0 22px' }}>
            I pulled two clinics near you. Want me to hold a slot, or would you rather pick a day first?
          </p>
        </div>

        {/* What I remember */}
        <Card tone="amber" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.amberFg, marginBottom: 8 }}>
            What I'm holding onto
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['family history of breast cancer (your mother)', 'first mammography before 45', 'fasting glucose 118 in April', 'we said we\'d re-check in 3 months'].map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', padding: '4px 9px',
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                border: `0.5px solid ${t.amberBorder}`, borderRadius: 999,
                fontSize: 11.5, color: t.fg, fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} icon={<IconCal size={16}/>}>
            Hold a mammography slot
          </Button>
          <Button variant="outline" size="md" style={{ width: '100%', justifyContent: 'center' }}>
            Show me both clinics
          </Button>
          <Button variant="ghost" size="sm" style={{ alignSelf: 'center' }}>Not now</Button>
        </div>

        {/* Progress note (memory made visible) */}
        <Divider/>
        <div style={{ paddingTop: 16 }}>
          <SectionLabel style={{ marginBottom: 8 }}>While we were quiet</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: t.fg, lineHeight: 1.5 }}>
            <MiniRow dot={a[dark?500:600]} label="Walking plan" val="4 of 5 days · most weeks" />
            <MiniRow dot={dark?'#60a5fa':'#2563eb'} label="Glucose re-check" val="108 mg/dL · down from 118" />
            <MiniRow dot={dark?'#fbbf24':'#d97706'} label="Two check-ins" val="April 30 · May 22" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniRow({ dot, label, val }) {
  const { t } = useHC();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <div style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: t.fg }}>{label}</span>
      <span style={{ fontFamily: window.HC_TOKENS.fontMono, fontSize: 11.5, color: t.fgMuted }}>{val}</span>
    </div>
  );
}

// Screen 5: See-reasoning disclosure (bonus)
function ScreenReasoning() {
  const { t, a, dark } = useHC();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <AppBar title="See reasoning" subtitle="Why mammography next month" left={<IconClose size={20}/>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <Card tone="muted" style={{ padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.fgMuted, marginBottom: 6 }}>
            Thinking · Opus 4.7
          </div>
          <div style={{ fontFamily: window.HC_TOKENS.fontMono, fontSize: 12, lineHeight: 1.55, color: t.fg }}>
            Maternal breast cancer at <b>52</b> (1st-degree, premenopausal).<br/>
            USPSTF baseline: mammography from <b>40</b> biennially.<br/>
            NCCN family-history modifier: start <b>10 years before</b> the first-degree relative's diagnosis, or at <b>40</b>, whichever is later.<br/>
            52 − 10 = <b>42</b>. Laura is <b>44</b>. → She's already inside the recommended window.
          </div>
        </Card>

        <Card style={{ padding: 14 }}>
          <SectionLabel style={{ marginBottom: 6 }}>What I'm proposing</SectionLabel>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: t.fg }}>
            A first mammography before her 45th birthday, then yearly. This is earlier than the standard guideline for someone without family history — the maternal signal is the reason.
          </div>
        </Card>

        <Card tone="blue" style={{ padding: 14 }}>
          <SectionLabel style={{ marginBottom: 6, color: t.blueFg }}>Sources I'm leaning on</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: t.fg, lineHeight: 1.6 }}>
            <li>USPSTF 2024 — breast cancer screening</li>
            <li>NCCN v.2.2025 — high-risk assessment</li>
            <li>Dr. Fraga's clinical voice guide (internal)</li>
          </ul>
        </Card>

        <Card tone="amber" style={{ padding: 12 }}>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: t.fg }}>
            <b>I'm not a doctor.</b> I'm educating and referring — the final call is yours and your physician's. If something here doesn't fit your situation, say so, and I'll adjust what I remember.
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenProactive, ScreenReasoning });
