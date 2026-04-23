// Screen 3: Timeline with lab_report entry expanded (clinical journal metaphor).
function ScreenTimeline() {
  const { t, a, dark } = useHC();
  const rail = [
    { date: 'Apr 22', type: 'lab', label: 'Lab report', expanded: true },
    { date: 'Apr 21', type: 'chat', label: 'Onboarding' },
    { date: 'Apr 21', type: 'screening', label: 'Screening scheduled' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.bg }}>
      <AppBar title="Timeline" subtitle="Everything I remember" left={<IconBack size={20}/>} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 80px' }}>
        {/* Rail legend */}
        <div style={{ display: 'flex', gap: 10, padding: '4px 18px 10px', flexWrap: 'wrap' }}>
          <LegendDot color={a[dark?500:600]} label="Companion"/>
          <LegendDot color={dark?'#60a5fa':'#2563eb'} label="Lab"/>
          <LegendDot color={dark?'#fbbf24':'#d97706'} label="You said"/>
        </div>

        <div style={{ position: 'relative', padding: '0 18px' }}>
          <div style={{ position: 'absolute', left: 34, top: 6, bottom: 6, width: 1, background: t.border }} />
          {rail.map((e, i) => <TimelineRow key={i} entry={e} />)}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  const { t } = useHC();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: 999, background: color }} />
      <span style={{ fontSize: 10.5, color: t.fgMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function TimelineRow({ entry }) {
  const { t, a, dark } = useHC();
  const dotColor = entry.type === 'lab' ? (dark?'#60a5fa':'#2563eb')
    : entry.type === 'chat' ? (dark?'#fbbf24':'#d97706')
    : a[dark?500:600];

  return (
    <div style={{ position: 'relative', paddingLeft: 32, paddingBottom: 14 }}>
      <div style={{
        position: 'absolute', left: 12, top: 16, width: 11, height: 11, borderRadius: 999,
        background: dotColor, boxShadow: `0 0 0 3px ${t.bg}`,
      }} />
      <div style={{ fontSize: 10.5, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono, marginBottom: 4, letterSpacing: '0.04em' }}>
        {entry.date.toUpperCase()}
      </div>
      {entry.type === 'lab' && entry.expanded ? <LabExpanded /> : <RowCollapsed entry={entry} />}
    </div>
  );
}

function RowCollapsed({ entry }) {
  const { t } = useHC();
  const map = {
    chat: { title: 'Laura: "I\'m 44, my mom died of breast cancer at 52."', sub: 'First conversation — 9 fields captured' },
    screening: { title: 'Mammography · next month', sub: 'Earlier than guideline · maternal BRCA signal' },
  };
  const row = map[entry.type];
  return (
    <Card style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Chip tone={entry.type === 'chat' ? 'amber' : 'accent'} compact>{entry.label}</Chip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: t.fg, lineHeight: 1.35, fontWeight: 500 }}>{row.title}</div>
        <div style={{ fontSize: 11.5, color: t.fgMuted, marginTop: 2 }}>{row.sub}</div>
      </div>
      <IconChevron size={14} style={{ color: t.fgMuted }} />
    </Card>
  );
}

function LabExpanded() {
  const { t, a, dark } = useHC();
  const values = [
    { test: 'Fasting glucose', val: '118', unit: 'mg/dL', ref: '70–99', status: 'borderline' },
    { test: 'HbA1c', val: '5.9', unit: '%', ref: '<5.7', status: 'borderline' },
    { test: 'LDL', val: '112', unit: 'mg/dL', ref: '<130', status: 'ok' },
    { test: 'HDL', val: '54', unit: 'mg/dL', ref: '>40', status: 'ok' },
    { test: 'Triglycerides', val: '98', unit: 'mg/dL', ref: '<150', status: 'ok' },
  ];
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chip tone="blue" compact>Lab report</Chip>
        <span style={{ fontSize: 11.5, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono }}>Lab del Norte · 14 biomarkers</span>
      </div>
      {/* Panel summary */}
      <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${t.border}`, background: dark ? 'rgba(255,255,255,0.02)' : t.bgSubtle }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: t.fg }}>
          Mostly normal. Fasting glucose at 118 and HbA1c at 5.9% land in the prediabetes range — watchable, reversible, worth a conversation.
        </div>
      </div>
      {/* Biomarker list */}
      <div>
        {values.map((v, i) => (
          <div key={v.test} style={{
            padding: '10px 14px', display: 'grid',
            gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center',
            borderBottom: i < values.length - 1 ? `0.5px solid ${t.border}` : 'none',
          }}>
            <div>
              <div style={{ fontSize: 13, color: t.fg, fontWeight: 500 }}>{v.test}</div>
              <div style={{ fontSize: 10.5, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono, marginTop: 1 }}>ref {v.ref}</div>
            </div>
            <div style={{ fontFamily: window.HC_TOKENS.fontMono, fontSize: 13, color: t.fg, textAlign: 'right' }}>
              {v.val}<span style={{ color: t.fgMuted, marginLeft: 3 }}>{v.unit}</span>
            </div>
            <StatusDot status={v.status} />
          </div>
        ))}
      </div>
      {/* Doctor questions */}
      <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${t.border}`, background: t.amberBg }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.amberFg, marginBottom: 6 }}>
          For your next doctor visit
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: t.fg, lineHeight: 1.55 }}>
          <li>Should we recheck fasting glucose in 3 months?</li>
          <li>Given my mom, does the mammography still fit at age 44?</li>
        </ul>
      </div>
    </Card>
  );
}

function StatusDot({ status }) {
  const { t } = useHC();
  const map = {
    ok: { bg: '#10b981', label: 'ok' },
    borderline: { bg: '#f59e0b', label: 'watch' },
    out_of_range: { bg: '#ef4444', label: 'out' },
  };
  const m = map[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: 999, background: m.bg }} />
      <span style={{ fontSize: 10, color: t.fgMuted, fontFamily: window.HC_TOKENS.fontMono, textTransform: 'uppercase' }}>{m.label}</span>
    </div>
  );
}

Object.assign(window, { ScreenTimeline });
