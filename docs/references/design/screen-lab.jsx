// Screen 2: Lab upload moment — the drop-zone with Opus reading the PDF.
function ScreenLabUpload({ phase = 'reading' }) {
  // phases: 'empty' | 'reading' (pdf shown, tool calls animating) | 'ready'
  const { t, a, dark } = useHC();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <AppBar title="Add a lab" subtitle="Your data stays yours" left={<IconBack size={20}/>} right={<IconLock size={18} style={{color: t.fgMuted}}/>} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Drop zone with uploaded PDF */}
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 48, height: 60, borderRadius: 6, background: dark ? '#1a1a1c' : '#fff',
              border: `1px solid ${t.border}`, flexShrink: 0, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconDoc size={22} style={{ color: t.fgMuted }} />
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                background: a[dark ? 500 : 600], color: '#fff', fontSize: 8,
                fontWeight: 700, padding: '2px 5px', borderRadius: 4, letterSpacing: '0.06em',
                fontFamily: window.HC_TOKENS.fontMono,
              }}>PDF</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: t.fg }}>Lab_Results_Apr_2026.pdf</div>
              <div style={{ fontSize: 11.5, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono, marginTop: 2 }}>1.2 MB · uploaded just now</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Chip tone="blue" compact>Lab report</Chip>
                <Chip tone="muted" compact>Encrypted at rest</Chip>
              </div>
            </div>
          </div>
        </Card>

        {/* What the companion is doing */}
        <div>
          <SectionLabel style={{ marginBottom: 8, paddingLeft: 2 }}>Reading your labs</SectionLabel>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { label: 'Opening the PDF multimodally', done: true, sub: 'Opus 4.7 · vision' },
              { label: 'Extracting values', done: true, sub: '14 biomarkers · high confidence' },
              { label: 'Cross-referencing your profile', done: true, sub: 'maternal breast cancer · age 44' },
              { label: 'Drafting what to say', done: false, sub: 'writing…' },
            ].map((step, i, arr) => (
              <div key={i} style={{
                padding: '11px 14px',
                borderBottom: i < arr.length - 1 ? `0.5px solid ${t.border}` : 'none',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                  background: step.done ? a[dark ? 500 : 600] : 'transparent',
                  border: step.done ? 'none' : `1.5px solid ${t.borderStrong}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {step.done ? <IconCheck size={11} style={{color: '#fff', strokeWidth: 3}}/> :
                    <div style={{
                      width: 7, height: 7, borderRadius: 999, background: a[dark ? 200 : 700],
                      animation: 'hcPulse 1.2s ease-in-out infinite',
                    }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, color: t.fg, fontWeight: 500 }}>{step.label}</div>
                  <div style={{ fontSize: 11.5, color: t.fgMuted, marginTop: 1, fontFamily: window.HC_TOKENS.fontMono }}>{step.sub}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* One finding surfaced early */}
        <Card tone="amber" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.amberFg }}>
              Worth a conversation
            </span>
            <span style={{ fontFamily: window.HC_TOKENS.fontMono, fontSize: 11, color: t.amberFg }}>118 mg/dL</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>Fasting glucose is a little above normal.</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: t.fg, opacity: 0.85 }}>
            WHO calls 100–125 prediabetes. It's not diabetes, and it's a category that usually responds well to changes in how you eat and move.
            I'll put it on the list for your next check-in with your doctor.
          </div>
        </Card>

        <p style={{ fontSize: 11.5, color: t.fgMuted, textAlign: 'center', margin: '4px 8px', lineHeight: 1.5 }}>
          I never diagnose or prescribe. I educate, contextualize, and refer you back to your doctor.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLabUpload });
