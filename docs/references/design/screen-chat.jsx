// Screen 1: Meeting Laura — hybrid chat (bubbles for Laura, structured cards from companion)
// + a collapsible side panel that animates tool calls as they arrive.

function ScreenChat({ state = 'final', onOpenReasoning }) {
  // states: 'listening' (profile mid-fill), 'final' (calendar card shown), 'reasoning'
  const { t, a, dark } = useHC();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <AppBar
        title="Companion"
        subtitle="First conversation · just now"
        left={<span style={{ fontSize: 13, fontWeight: 500 }}>Back</span>}
        right={<IconInfo size={20} />}
      />

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Companion opening — prose, not a bubble */}
          <div style={{ padding: '4px 4px 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999, background: a[dark ? 500 : 600],
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <IconHeart size={12} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>Your companion</span>
            </div>
            <p style={{
              fontSize: 15, lineHeight: 1.55, color: t.fg, margin: 0, letterSpacing: '-0.005em',
            }}>Hi Laura. I'm your health companion. Tell me a little about yourself — I'll listen, and you can keep adding as we go.</p>
          </div>

          {/* Laura's message — right-aligned bubble */}
          <div style={{ alignSelf: 'flex-end', maxWidth: '86%' }}>
            <div style={{
              background: a[dark ? 500 : 600], color: '#fff',
              padding: '10px 14px', borderRadius: '18px 18px 4px 18px',
              fontSize: 14.5, lineHeight: 1.5,
            }}>I'm 44. My mom died of breast cancer at 52.</div>
            <div style={{ fontSize: 10, color: t.fgMuted, textAlign: 'right', marginTop: 4, fontFamily: window.HC_TOKENS.fontMono }}>9:41</div>
          </div>

          {/* Tool-use inline trace */}
          <Card tone="muted" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <IconTool size={12} style={{ color: t.fgMuted }} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.fgMuted }}>
                Reading what you said
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: window.HC_TOKENS.fontMono, fontSize: 11.5 }}>
              <ToolLine fg={t.fg} muted={t.fgMuted} done
                name="save_profile_field" args="age: 44" />
              <ToolLine fg={t.fg} muted={t.fgMuted} done
                name="save_profile_field" args="family_history.breast_cancer: mother, age 52" />
              <ToolLine fg={t.fg} muted={t.fgMuted} done
                name="fetch_recommendations_for_age_sex" args="age:44, sex:F, fhx:breast_ca" />
            </div>
          </Card>

          {/* Companion response — prose acknowledgement */}
          <div style={{ padding: '4px' }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: t.fg, margin: 0 }}>
              I'm sorry about your mom, Laura. Fifty-two is young. That history matters for you — let me write it down and think about what it means for your own screening.
            </p>
          </div>

          {/* Structured card: screening calendar */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 14px 10px', borderBottom: `0.5px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCal size={15} style={{ color: a[dark ? 200 : 700] }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>A starting schedule</span>
              </div>
              <Chip tone="accent" compact>3 items</Chip>
            </div>
            <div>
              {[
                { name: 'Mammography', when: 'Next month', sub: 'Then yearly. Earlier than the typical guideline because of your mom.', tone: 'accent' },
                { name: 'Colonoscopy', when: 'At 45', sub: 'Routine baseline. We have time to prepare for this one.', tone: 'muted' },
                { name: 'Cervical Pap + HPV', when: 'If it\'s been >3 yrs', sub: 'We can check your records together.', tone: 'muted' },
              ].map((row, i, arr) => (
                <div key={row.name} style={{
                  padding: '11px 14px',
                  borderBottom: i < arr.length - 1 ? `0.5px solid ${t.border}` : 'none',
                  display: 'flex', gap: 10,
                }}>
                  <div style={{
                    marginTop: 5, width: 8, height: 8, borderRadius: 999,
                    background: row.tone === 'accent' ? a[dark ? 500 : 600] : t.fgSubtle, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: t.fg }}>{row.name}</span>
                      <span style={{ fontSize: 11.5, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono }}>{row.when}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: t.fgMuted, marginTop: 2, lineHeight: 1.45 }}>{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '10px 14px', borderTop: `0.5px solid ${t.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: dark ? 'rgba(255,255,255,0.02)' : t.bgSubtle,
            }}>
              <button onClick={onOpenReasoning} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                color: a[dark ? 200 : 700], fontSize: 12, fontWeight: 500,
              }}>
                <IconSparkle size={13} />
                See reasoning
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="ghost" size="sm">Later</Button>
                <Button variant="primary" size="sm" icon={<IconCheck size={13}/>}>Add to plan</Button>
              </div>
            </div>
          </Card>

          {/* Gentle closing */}
          <div style={{ padding: '2px 4px' }}>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: t.fgMuted, margin: 0 }}>
              I'll remember all of this. We can keep going whenever you want.
            </p>
          </div>
        </div>

        {/* Composer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: dark ? 'rgba(10,10,11,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)', padding: '10px 14px 14px',
          borderTop: `0.5px solid ${t.border}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 6px 8px 14px', background: t.bgMuted,
            borderRadius: 999, border: `0.5px solid ${t.border}`,
          }}>
            <IconPaperclip size={18} style={{ color: t.fgMuted, flexShrink: 0 }} />
            <input placeholder="Tell me more…" style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: t.fg, fontFamily: window.HC_TOKENS.fontSans,
            }} />
            <div style={{
              width: 32, height: 32, borderRadius: 999, background: a[dark ? 500 : 600],
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <IconSend size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolLine({ name, args, done, running, fg, muted }) {
  const { a, dark } = useHC();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        width: 6, height: 6, borderRadius: 999,
        background: done ? a[dark ? 500 : 600] : muted,
        flexShrink: 0, marginTop: 4,
      }} />
      <span style={{ color: fg, fontWeight: 500 }}>{name}</span>
      <span style={{ color: muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>({args})</span>
    </div>
  );
}

Object.assign(window, { ScreenChat });
