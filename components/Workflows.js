import { useState, useEffect } from 'react'

// ── Icons ─────────────────────────────────────────────────────────────────
function PlayIcon()    { return <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
function PlusIcon()    { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function ChevronIcon({ open }) { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg> }
function TrashIcon()   { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function CheckIcon()   { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> }
function XIcon()       { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function ClockIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function ZapIcon()     { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function UsersIcon()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function TrendIcon()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function SpinnerIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg> }
function ListIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function BuildingIcon(){ return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }

// ── Workflow Templates ────────────────────────────────────────────────────
const WORKFLOW_TEMPLATES = [
  {
    type: 'funded_leader_fast_track',
    label: 'Funded Leader Fast-Track',
    badge: 'New Business',
    badgeColor: '#6366f1',
    icon: <ZapIcon />,
    tagline: 'Surface funded companies where a new exec just took the helm',
    description: 'Finds private companies that raised capital recently AND have a new C-Level or VP — the sharpest buying signal in B2B. Filtered by accuracy score, data freshness, and company type so only high-confidence, actionable leads make the cut.',
    signals: [
      'Funding event within a configurable window',
      'New executive started within N days',
      'Contact accuracy score ≥ 85 — stale records excluded',
      'Private companies only — higher vendor-switch propensity',
      'Results sorted by accuracy score, best leads first',
    ],
    defaultConfig: {
      funding_days: 90,
      leader_days: 60,
      employee_min: 20,
      employee_max: 1000,
      accuracy_score_min: 85,
      last_updated_months: 6,
      company_type: 'private',
      growth_rate_min: '',
      funding_amount_min: '',
      funding_amount_max: '',
      country: 'United States',
      industries: '',
      require_email: true,
      require_phone: false,
      results_per_run: 25,
      schedule: 'weekly',
    },
    configFields: [
      { key: 'funding_days',        label: 'Funding recency (days back)',          type: 'number', hint: 'Flag companies that raised within this many days' },
      { key: 'leader_days',         label: 'Executive start recency (days back)',   type: 'number', hint: 'Only execs who joined within this many days' },
      { key: 'employee_min',        label: 'Min company size (employees)',          type: 'number', hint: 'Smallest company to surface' },
      { key: 'employee_max',        label: 'Max company size (employees)',          type: 'number', hint: 'Largest company to surface' },
      { key: 'accuracy_score_min',  label: 'Min contact accuracy score (70–99)',    type: 'number', hint: 'Raise to 90+ for highest-confidence contacts only' },
      { key: 'last_updated_months', label: 'Max data age (months)',                 type: 'number', hint: 'Exclude contacts not updated within this window' },
      { key: 'growth_rate_min',     label: 'Min 1yr headcount growth (%)',          type: 'number', hint: 'e.g. 15 = only companies growing 15%+ YoY' },
      { key: 'funding_amount_min',  label: 'Min funding amount ($K)',               type: 'number', hint: 'e.g. 5000 = at least $5M raised' },
      { key: 'funding_amount_max',  label: 'Max funding amount ($K)',               type: 'number', hint: 'Leave blank for no upper limit' },
      { key: 'country',             label: 'Target country',                        type: 'text',   hint: 'e.g. United States, United Kingdom' },
      { key: 'industries',          label: 'Target industries (keywords)',           type: 'text',   hint: 'e.g. Software, Fintech, Healthcare IT' },
      { key: 'results_per_run',     label: 'Max results per run',                   type: 'number', hint: 'Max 100' },
      { key: 'require_email',       label: 'Require verified email',                type: 'toggle' },
      { key: 'require_phone',       label: 'Require direct phone',                  type: 'toggle' },
      { key: 'schedule',            label: 'Run schedule',                          type: 'select', options: ['manual','daily','weekly','monthly'] },
    ],
  },
  {
    type: 'lookalike_account_builder',
    label: 'Lookalike Account Builder',
    badge: 'New Business',
    badgeColor: '#f59e0b',
    icon: <UsersIcon />,
    tagline: 'Clone your best customers into a qualified prospect list',
    description: 'Uses closed-won deals as reference accounts and finds companies matching their firmographic fingerprint — same industry, size, business model, growth stage. Every lookalike is batch-enriched so accounts enter CRM with website, phone, revenue, and ZoomInfo Company ID pre-filled.',
    signals: [
      'Powered by your closed-won deal history',
      'ZoomInfo AI similarity scoring (0–100)',
      'Filter by score threshold, geography, and size',
      'Full firmographic enrichment on every lookalike',
      'ZoomInfo Company ID saved — one-click enrichment later',
    ],
    defaultConfig: {
      max_wins: 5,
      max_lookalikes: 15,
      min_similarity: 65,
      filter_country: '',
      employee_min: '',
      employee_max: '',
      schedule: 'manual',
    },
    configFields: [
      { key: 'max_wins',       label: 'Reference accounts (recent wins)',    type: 'number', hint: 'How many recent closed-won deals to use as the model' },
      { key: 'max_lookalikes', label: 'Lookalikes per reference account',    type: 'number', hint: 'Max accounts to find per reference company' },
      { key: 'min_similarity', label: 'Minimum fit score (%)',               type: 'number', hint: 'Only surface accounts scoring above this threshold' },
      { key: 'filter_country', label: 'Filter by country',                  type: 'text',   hint: 'Leave blank for global; e.g. United States' },
      { key: 'employee_min',   label: 'Min company size (employees)',        type: 'number', hint: 'Smallest lookalike to include' },
      { key: 'employee_max',   label: 'Max company size (employees)',        type: 'number', hint: 'Largest lookalike to include' },
      { key: 'schedule',       label: 'Run schedule',                        type: 'select', options: ['manual','weekly','monthly'] },
    ],
  },
  {
    type: 'account_growth_monitor',
    label: 'Account Growth Monitor',
    badge: 'Expansion',
    badgeColor: '#10b981',
    icon: <TrendIcon />,
    tagline: 'Detect expansion signals inside your existing customer accounts',
    description: 'Monitors all customer accounts for three actionable expansion signals: a new executive hire (first 90 days = highest vendor evaluation window), department headcount growth above your threshold, and untapped budget in departments you don\'t currently sell to.',
    signals: [
      'New executive hires — filtered by accuracy score',
      'Department headcount growth above your threshold',
      'Untapped dept budget vs. current deal value',
      'ZoomInfo Person ID saved on every new leader signal',
      'Deduplicates — never surfaces the same signal twice',
    ],
    defaultConfig: {
      new_leader_days: 30,
      growth_threshold: 20,
      accuracy_score_min: 80,
      target_seniority: 'C Level Exec,VP Level Exec',
      check_new_leaders: true,
      check_growth: true,
      check_whitespace: true,
      schedule: 'manual',
    },
    configFields: [
      { key: 'new_leader_days',    label: 'Executive change window (days)',      type: 'number', hint: 'Flag execs who joined within this many days' },
      { key: 'growth_threshold',   label: 'Headcount growth threshold (%)',      type: 'number', hint: 'Minimum dept growth % to surface a signal' },
      { key: 'accuracy_score_min', label: 'Min contact accuracy score (70–99)',  type: 'number', hint: 'Filter out low-confidence leader signals' },
      { key: 'check_new_leaders',  label: 'Monitor executive changes',           type: 'toggle' },
      { key: 'check_growth',       label: 'Monitor headcount growth',            type: 'toggle' },
      { key: 'check_whitespace',   label: 'Monitor budget white space',          type: 'toggle' },
      { key: 'schedule',           label: 'Run schedule',                        type: 'select', options: ['manual','weekly','monthly'] },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso), diff = Date.now() - d
  if (diff < 60000)    return 'Just now'
  if (diff < 3600000)  return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtNum(n) {
  if (!n && n !== 0) return null
  const num = Number(n)
  if (isNaN(num)) return null
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(0) + 'K'
  return '$' + num
}

function Pill({ label, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '18', border: '1px solid ' + color + '30', padding: '1px 7px', borderRadius: 20, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{label}</span>
}

function AccuracyBadge({ score }) {
  if (!score) return null
  const color  = score >= 90 ? '#059669' : score >= 80 ? '#d97706' : '#dc2626'
  const bg     = score >= 90 ? '#f0fdf4' : score >= 80 ? '#fffbeb' : '#fef2f2'
  const border = score >= 90 ? '#bbf7d0' : score >= 80 ? '#fde68a' : '#fecaca'
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: '1px solid ' + border, padding: '1px 6px', borderRadius: 20, fontFamily: '"IBM Plex Mono", monospace' }}>⬤ {score}</span>
}

function StatusDot({ status }) {
  const colors = { active: '#10b981', error: '#ef4444', running: '#f59e0b', draft: '#94a3b8', paused: '#94a3b8' }
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: colors[status] || '#94a3b8', boxShadow: status === 'active' ? '0 0 6px #10b98166' : status === 'running' ? '0 0 6px #f59e0b66' : 'none', flexShrink: 0 }} />
}

function buildCompanyPayload(src, source) {
  return {
    name:         src.company_name,
    zi_company_id:src.zi_company_id ? String(src.zi_company_id) : null,
    type:         'prospect',
    source,
    website:      src.company_website || null,
    phone:        src.company_phone   || null,
    industry:     src.company_industry || src.industry || null,
    employees:    src.company_employees ? String(src.company_employees) : (src.company_employee_range || null),
    revenue:      src.company_revenue   ? String(src.company_revenue)   : (src.company_revenue_range  || null),
    city:         src.company_city   || null,
    state:        src.company_state  || null,
    country:      src.company_country || src.country || null,
    street:       src.company_street || null,
    zip_code:     src.company_zip    || null,
    description:  src.company_description || null,
    logo:         src.company_logo   || null,
    founded_year: src.company_founded ? String(src.company_founded) : null,
    enriched:     !!(src.company_website || src.company_employees || src.company_revenue),
  }
}

// ── Create Workflow Modal ─────────────────────────────────────────────────
function CreateWorkflowModal({ onClose, onCreate }) {
  const [step,     setStep]     = useState('pick')
  const [selected, setSelected] = useState(null)
  const [name,     setName]     = useState('')
  const [config,   setConfig]   = useState({})
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  function pickTemplate(tpl) { setSelected(tpl); setName(tpl.label); setConfig({ ...tpl.defaultConfig }); setStep('configure') }
  function updateConfig(key, val) { setConfig(prev => ({ ...prev, [key]: val })) }

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch('/api/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), type: selected.type, config, status: 'active', run_count: 0 }) })
      const data = await res.json()
      if (res.ok) { onCreate(data); onClose() }
      else { setError(data.error || 'Failed to save workflow') }
    } catch (e) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: step === 'pick' ? 760 : 580, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {step === 'configure' && <button onClick={() => setStep('pick')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>← Back</button>}
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: '"IBM Plex Sans", sans-serif' }}>{step === 'pick' ? 'New Workflow' : selected?.label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{step === 'pick' ? 'Choose an automation for your pipeline' : selected?.tagline}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, marginTop: 2 }}><XIcon /></button>
        </div>

        {step === 'pick' && (
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {WORKFLOW_TEMPLATES.map(tpl => (
              <button key={tpl.type} onClick={() => pickTemplate(tpl)} style={{ textAlign: 'left', background: '#fafafa', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = tpl.badgeColor; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 20px ' + tpl.badgeColor + '22' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: tpl.badgeColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tpl.badgeColor }}>{tpl.icon}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: tpl.badgeColor, background: tpl.badgeColor + '18', padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase' }}>{tpl.badge}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 5, lineHeight: 1.3 }}>{tpl.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>{tpl.tagline}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {tpl.signals.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#475569' }}>
                      <span style={{ color: tpl.badgeColor, marginTop: 1, flexShrink: 0 }}>✓</span><span>{s}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'configure' && selected && (
          <div style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workflow Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: '"IBM Plex Sans", sans-serif' }}
                onFocus={e => e.target.style.borderColor = selected.badgeColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Precision Filters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.configFields.map(field => (
                  <div key={field.key}>
                    {field.type === 'toggle' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{field.label}</div>
                        <button onClick={() => updateConfig(field.key, !config[field.key])} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', transition: 'background 0.2s', background: config[field.key] ? selected.badgeColor : '#cbd5e1', position: 'relative', flexShrink: 0 }}>
                          <span style={{ position: 'absolute', top: 2, left: config[field.key] ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </button>
                      </div>
                    ) : field.type === 'select' ? (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{field.label}</label>
                        <select value={config[field.key] ?? field.options[0]} onChange={e => updateConfig(field.key, e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                          {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{field.label}</label>
                        <input type={field.type} value={config[field.key] ?? ''} onChange={e => updateConfig(field.key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = selected.badgeColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        {field.hint && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{field.hint}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
              {error && <div style={{ width: '100%', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 12 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ padding: '10px 18px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: saving ? '#94a3b8' : selected.badgeColor, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? <><SpinnerIcon /> Creating…</> : <><CheckIcon /> Create Workflow</>}
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Run Results Panel ─────────────────────────────────────────────────────
function RunResultsPanel({ results, workflow, onClose, onAddToCRM }) {
  const tpl        = WORKFLOW_TEMPLATES.find(t => t.type === workflow.type)
  const [added,    setAdded]    = useState(new Set())
  const [addingAll,setAddingAll]= useState(false)
  const isExpansion = workflow.type === 'account_growth_monitor' || workflow.type === 'expansion_playbook'
  const items       = results.signals || results.results || []

  async function addItem(item, index) {
    if (added.has(index)) return
    await onAddToCRM(item, workflow.type)
    setAdded(prev => new Set([...prev, index]))
  }
  async function addAll() {
    setAddingAll(true)
    for (let i = 0; i < items.length; i++) if (!added.has(i)) await addItem(items[i], i)
    setAddingAll(false)
  }

  const signalColors = { new_leader: '#ef4444', team_growth: '#f59e0b', budget_whitespace: '#10b981' }
  const signalLabels = { new_leader: '🔴 New Leader', team_growth: '🟡 Team Growth', budget_whitespace: '🟢 Budget White Space' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 740, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{workflow.name} — Results</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                <span style={{ color: tpl?.badgeColor, fontWeight: 700 }}>{items.length} {isExpansion ? 'signals' : 'records'} found</span>
                {results.logs?.length > 0 && <span style={{ marginLeft: 8, color: '#94a3b8' }}>· {results.logs[results.logs.length - 1]}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {items.length > 0 && !isExpansion && (
                <button onClick={addAll} disabled={addingAll || added.size === items.length} style={{ padding: '8px 14px', background: tpl?.badgeColor || '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {addingAll ? <SpinnerIcon /> : <PlusIcon />} {added.size === items.length ? 'All Added ✓' : 'Add All to CRM'}
                </button>
              )}
              <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#374151', fontSize: 12, fontWeight: 500 }}>Close</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 56 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 4 }}>No results found</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Try relaxing your filters — lower accuracy threshold or extend recency window</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ border: '1.5px solid ' + (added.has(i) ? '#bbf7d0' : '#e2e8f0'), borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, background: added.has(i) ? '#f0fdf4' : '#fff', transition: 'all 0.2s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isExpansion ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: signalColors[item.signal_type] || '#6366f1' }}>{signalLabels[item.signal_type] || item.signal_type}</span>
                          {item.company_name && <span style={{ fontSize: 12, color: '#94a3b8' }}>· {item.company_name}</span>}
                          {item.accuracy_score && <AccuracyBadge score={item.accuracy_score} />}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 3 }}>{item.signal_title}</div>
                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{item.signal_detail}</div>
                        {item.contact_name && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#6366f1' }}>{item.contact_name.charAt(0)}</div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.contact_name}</span>
                            {item.contact_title && <span style={{ fontSize: 12, color: '#94a3b8' }}>· {item.contact_title}</span>}
                            {item.zi_person_id && <span style={{ fontSize: 10, color: '#6366f1', fontFamily: '"IBM Plex Mono", monospace', background: '#eef2ff', padding: '1px 5px', borderRadius: 6 }}>ZI #{item.zi_person_id}</span>}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{item.first_name ? item.first_name + ' ' + (item.last_name || '') : item.company_name}</span>
                          {item.accuracy_score  && <AccuracyBadge score={item.accuracy_score} />}
                          {item.similarity_score && <Pill label={item.similarity_score + '% match'} color={tpl?.badgeColor || '#f59e0b'} />}
                          {item.management_level && <Pill label={item.management_level} color="#6366f1" />}
                        </div>
                        {item.job_title && <div style={{ fontSize: 12, color: '#475569', marginBottom: 5 }}>{item.job_title}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          {item.company_name && <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><BuildingIcon /> {item.company_name}</span>}
                          {item.company_industry && <span style={{ fontSize: 11, color: '#94a3b8' }}>· {item.company_industry}</span>}
                          {(item.company_employees || item.company_employee_range) && <span style={{ fontSize: 11, color: '#94a3b8' }}>· {item.company_employees ? Number(item.company_employees).toLocaleString() : item.company_employee_range} emp</span>}
                          {item.company_revenue && fmtNum(item.company_revenue) && <span style={{ fontSize: 11, color: '#94a3b8' }}>· {fmtNum(item.company_revenue)} rev</span>}
                        </div>
                        {/* Identifier + signal strip */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {item.has_email     && <span style={{ fontSize: 10, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 10 }}>✓ Email</span>}
                          {item.has_direct_phone && <span style={{ fontSize: 10, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 10 }}>✓ Direct phone</span>}
                          {item.has_mobile    && <span style={{ fontSize: 10, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 10 }}>✓ Mobile</span>}
                          {item.zi_contact_id && <span style={{ fontSize: 10, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '1px 6px', borderRadius: 10, fontFamily: '"IBM Plex Mono", monospace' }}>ZI Person #{item.zi_contact_id}</span>}
                          {item.zi_company_id && <span style={{ fontSize: 10, color: '#0891b2', background: '#ecfeff', border: '1px solid #a5f3fc', padding: '1px 6px', borderRadius: 10, fontFamily: '"IBM Plex Mono", monospace' }}>ZI Co #{item.zi_company_id}</span>}
                          {item.company_funding_recent && <span style={{ fontSize: 10, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: 10 }}>💰 {fmtNum(Number(item.company_funding_recent) * 1000)} raised</span>}
                          {item.reference_company && <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '1px 6px', borderRadius: 10 }}>↯ like {item.reference_company}</span>}
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => addItem(item, i)} disabled={added.has(i)} style={{ padding: '7px 12px', border: '1.5px solid ' + (added.has(i) ? '#10b981' : '#e2e8f0'), borderRadius: 7, background: added.has(i) ? '#f0fdf4' : '#fff', color: added.has(i) ? '#10b981' : '#374151', fontSize: 12, fontWeight: 600, cursor: added.has(i) ? 'default' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    {added.has(i) ? <><CheckIcon /> Added</> : <><PlusIcon /> Add to CRM</>}
                  </button>
                </div>
              ))}
            </div>
          )}

          {results.logs?.length > 0 && (
            <div style={{ marginTop: 16, padding: 14, background: '#0f172a', borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: '"IBM Plex Mono", monospace' }}>Execution Log</div>
              {results.logs.map((log, i) => <div key={i} style={{ fontSize: 11, color: log.startsWith('✓') ? '#10b981' : log.startsWith('⚠') ? '#f59e0b' : '#94a3b8', fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1.8 }}>{log}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Workflow Leads View ───────────────────────────────────────────────────
const SOURCE_META = {
  'workflow:funded_leader_fast_track':  { label: 'Funded Leader Fast-Track',  color: '#6366f1' },
  'workflow:new_money':                 { label: 'Funded Leader Fast-Track',  color: '#6366f1' },
  'workflow:lookalike_account_builder': { label: 'Lookalike Account Builder', color: '#f59e0b' },
  'workflow:win_expander':              { label: 'Lookalike Account Builder', color: '#f59e0b' },
  'workflow:account_growth_monitor':    { label: 'Account Growth Monitor',    color: '#10b981' },
  'workflow:expansion_playbook':        { label: 'Account Growth Monitor',    color: '#10b981' },
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { label: (source || '').replace('workflow:', ''), color: '#94a3b8' }
  return <Pill label={meta.label} color={meta.color} />
}

function WorkflowLeadsView() {
  const [tab,       setTab]       = useState('contacts')
  const [contacts,  setContacts]  = useState([])
  const [companies, setCompanies] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [cr, cor] = await Promise.all([
        fetch('/api/contacts').then(r => r.json()),
        fetch('/api/companies').then(r => r.json()),
      ])
      setContacts((Array.isArray(cr)  ? cr  : []).filter(c => c.source?.startsWith('workflow:')))
      setCompanies((Array.isArray(cor) ? cor : []).filter(c => c.source?.startsWith('workflow:')))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: '#94a3b8' }}><SpinnerIcon /></div>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Workflow Contacts',  value: contacts.length,                                                   color: '#6366f1' },
          { label: 'With ZI Person ID',  value: contacts.filter(c => c.zi_contact_id || c.zi_person_id).length,   color: '#059669' },
          { label: 'Workflow Companies', value: companies.length,                                                   color: '#f59e0b' },
          { label: 'With ZI Company ID', value: companies.filter(c => c.zi_company_id).length,                    color: '#059669' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
        {[{ key: 'contacts', label: 'Contacts (' + contacts.length + ')' }, { key: 'companies', label: 'Companies (' + companies.length + ')' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#0f172a' : '#94a3b8', background: 'none', border: 'none', borderBottom: '2px solid ' + (tab === t.key ? '#0f172a' : 'transparent'), marginBottom: -1, cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'contacts' && (
        contacts.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No workflow contacts yet</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Run a workflow and click "Add to CRM" to populate this view</div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Name', 'Title', 'Company', 'ZI Person ID', 'Workflow', 'Added'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < contacts.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#6366f1', flexShrink: 0 }}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                        <span style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{c.first_name} {c.last_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{c.job_title || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{c.company_name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {(c.zi_contact_id || c.zi_person_id)
                        ? <span style={{ fontSize: 11, color: '#6366f1', fontFamily: '"IBM Plex Mono", monospace', background: '#eef2ff', padding: '2px 7px', borderRadius: 6 }}>{c.zi_contact_id || c.zi_person_id}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><SourceBadge source={c.source} /></td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'companies' && (
        companies.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No workflow companies yet</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Run a workflow and click "Add to CRM" to populate this view</div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Company', 'Industry', 'Employees', 'Revenue', 'ZI Company ID', 'Website', 'Workflow', 'Added'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < companies.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.logo && <img src={c.logo} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4 }} onError={e => e.target.style.display = 'none'} />}
                        <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{c.industry || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{c.employees || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{c.revenue ? (fmtNum(Number(c.revenue)) || c.revenue) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.zi_company_id
                        ? <span style={{ fontSize: 11, color: '#0891b2', fontFamily: '"IBM Plex Mono", monospace', background: '#ecfeff', padding: '2px 7px', borderRadius: 6 }}>{c.zi_company_id}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.website ? <a href={c.website.startsWith('http') ? c.website : 'https://' + c.website} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: 11 }}>{c.website.replace(/^https?:\/\//, '')}</a> : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><SourceBadge source={c.source} /></td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

// ── Main Workflows Component ──────────────────────────────────────────────
export default function Workflows() {
  const [mainTab,        setMainTab]        = useState('automations')
  const [workflows,      setWorkflows]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showCreate,     setShowCreate]     = useState(false)
  const [runningId,      setRunningId]      = useState(null)
  const [runResults,     setRunResults]     = useState(null)
  const [activeWorkflow, setActiveWorkflow] = useState(null)
  const [expandedId,     setExpandedId]     = useState(null)
  const [toast,          setToast]          = useState(null)

  function showToast(msg, type = 'success') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  async function fetchWorkflows() {
    try {
      const res  = await fetch('/api/workflows')
      const data = await res.json()
      setWorkflows(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchWorkflows() }, [])

  async function runWorkflow(workflow) {
    const token = localStorage.getItem('zi_token')
    if (!token) { showToast('Set your ZoomInfo token first', 'error'); return }
    setRunningId(workflow.id)
    try {
      // For lookalike workflows, pre-fetch similar companies via ZI search API
      let lookalikePrefetch = null
      if (workflow.type === 'lookalike_account_builder' || workflow.type === 'win_expander') {
        // Fetch closed-won deals with zi_company_ids
        const dealsRes = await fetch('/api/deals?stage=closed_won')
        const deals = Array.isArray(await dealsRes.json()) ? await dealsRes.json() : []
        // Actually re-fetch since we already consumed the response
        const dealsRes2 = await fetch('/api/deals?stage=closed_won')
        const dealsData = await dealsRes2.json()
        const wonDeals = Array.isArray(dealsData) ? dealsData.slice(0, workflow.config?.max_wins || 5) : []

        const prefetchMap = {}
        for (const deal of wonDeals) {
          const ziId = deal.zi_company_id || deal.company_zi_id
          if (!ziId) continue
          try {
            // Use ZI find_similar companies via search endpoint
            const simRes = await fetch(`/api/zi-similar?companyId=${ziId}&token=${encodeURIComponent(token)}&pageSize=${workflow.config?.max_lookalikes || 15}`)
            if (simRes.ok) {
              const simData = await simRes.json()
              prefetchMap[ziId] = simData.companies || []
            }
          } catch {}
        }
        lookalikePrefetch = prefetchMap
      }

      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflow.id, token, lookalikePrefetch })
      })
      const data = await res.json()
      if (res.ok) {
        setRunResults(data); setActiveWorkflow(workflow); fetchWorkflows()
        const count = (data.results || data.signals || []).length
        showToast(workflow.name + ': ' + count + ' results found')
      } else { showToast(data.error || 'Run failed', 'error') }
    } catch (e) { showToast('Network error', 'error') }
    finally { setRunningId(null) }
  }

  async function toggleWorkflow(workflow) {
    const s = workflow.status === 'active' ? 'draft' : 'active'
    await fetch('/api/workflows/' + workflow.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) })
    setWorkflows(prev => prev.map(w => w.id === workflow.id ? { ...w, status: s } : w))
  }

  async function deleteWorkflow(id) {
    if (!confirm('Delete this workflow?')) return
    await fetch('/api/workflows/' + id, { method: 'DELETE' })
    setWorkflows(prev => prev.filter(w => w.id !== id))
    showToast('Workflow deleted')
  }

  async function addToCRM(item, workflowType) {
    const isExpansion = workflowType === 'account_growth_monitor' || workflowType === 'expansion_playbook'
    if (isExpansion) return

    const isFunded   = workflowType === 'funded_leader_fast_track' || workflowType === 'new_money'
    const sourceKey  = isFunded ? 'workflow:funded_leader_fast_track' : 'workflow:lookalike_account_builder'

    try {
      // Always save company first (with ZI Company ID for enrichment)
      const coRes  = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildCompanyPayload(item, sourceKey)) })
      const coData = await coRes.json()
      if (!coData.id) { console.error('Company save failed:', coData); return }

      // Funded Leader also saves the contact
      if (isFunded && item.first_name) {
        await fetch('/api/contacts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name:       item.first_name,
            last_name:        item.last_name || '(unknown)',
            job_title:        item.job_title        || null,
            management_level: item.management_level  || null,
            company_id:       coData.id,
            company_name:     item.company_name,
            // Both ZI ID columns — so enrichment works from either
            zi_contact_id:    item.zi_contact_id ? String(item.zi_contact_id) : null,
            zi_person_id:     item.zi_person_id  ? String(item.zi_person_id)  : (item.zi_contact_id ? String(item.zi_contact_id) : null),
            source:           sourceKey,
            enriched:         false,
            city:             item.company_city    || null,
            state:            item.company_state   || null,
            country:          item.company_country || null,
          }),
        })
      }
    } catch (e) { console.error('addToCRM error:', e) }
  }

  const tplMap = Object.fromEntries(WORKFLOW_TEMPLATES.map(t => [t.type, t]))

  return (
    <div style={{ fontFamily: '"IBM Plex Sans", sans-serif', minHeight: '100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: toast.type === 'error' ? '#ef4444' : '#0f172a', color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'error' ? <XIcon /> : <CheckIcon />} {toast.msg}
        </div>
      )}

      {showCreate && <CreateWorkflowModal onClose={() => setShowCreate(false)} onCreate={wf => { setWorkflows(prev => [wf, ...prev]); showToast(wf.name + ' created') }} />}
      {runResults && activeWorkflow && <RunResultsPanel results={runResults} workflow={activeWorkflow} onClose={() => { setRunResults(null); setActiveWorkflow(null) }} onAddToCRM={addToCRM} />}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Workflows</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Precision automations that surface prospects and expansion opportunities using live ZoomInfo data</p>
          </div>
          {mainTab === 'automations' && (
            <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#0f172a', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <PlusIcon /> New Workflow
            </button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        {[{ key: 'automations', label: 'Automations', icon: <ZapIcon /> }, { key: 'leads', label: 'Workflow Leads', icon: <ListIcon /> }].map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13, fontWeight: mainTab === t.key ? 700 : 500, color: mainTab === t.key ? '#0f172a' : '#94a3b8', background: 'none', border: 'none', borderBottom: '2px solid ' + (mainTab === t.key ? '#0f172a' : 'transparent'), marginBottom: -1, cursor: 'pointer' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'leads' && <WorkflowLeadsView />}

      {mainTab === 'automations' && (
        <>
          {workflows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'Total Workflows', value: workflows.length, color: '#6366f1' },
                { label: 'Active',          value: workflows.filter(w => w.status === 'active').length, color: '#10b981' },
                { label: 'Total Runs',      value: workflows.reduce((s, w) => s + (w.run_count || 0), 0), color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {!loading && workflows.length === 0 && (
            <div style={{ background: '#fff', border: '1.5px dashed #e2e8f0', borderRadius: 16, padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>⚡️</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>No workflows yet</div>
              <div style={{ fontSize: 13, color: '#64748b', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>Workflows automate prospecting and account expansion. Create your first to get started.</div>
              <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', background: '#0f172a', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <PlusIcon /> Create First Workflow
              </button>
            </div>
          )}

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: '#94a3b8' }}><SpinnerIcon /></div>}

          {!loading && workflows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workflows.map(workflow => {
                const tpl       = tplMap[workflow.type]
                const isExpanded= expandedId === workflow.id
                const isRunning = runningId  === workflow.id
                return (
                  <div key={workflow.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: (tpl?.badgeColor || '#6366f1') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tpl?.badgeColor || '#6366f1', flexShrink: 0 }}>
                        {tpl?.icon || <ZapIcon />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{workflow.name}</span>
                          <StatusDot status={workflow.status} />
                          {tpl && <Pill label={tpl.badge} color={tpl.badgeColor} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon /> {fmtDate(workflow.last_run_at)}</span>
                          <span>· {workflow.run_count || 0} runs</span>
                          {tpl && <span style={{ color: '#64748b' }}>· {tpl.tagline}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => setExpandedId(isExpanded ? null : workflow.id)} style={{ padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 7, background: isExpanded ? '#f8fafc' : '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500 }}>
                          Config <ChevronIcon open={isExpanded} />
                        </button>
                        <button onClick={() => toggleWorkflow(workflow)} style={{ padding: '7px 12px', border: '1.5px solid ' + (workflow.status === 'active' ? '#10b981' : '#e2e8f0'), borderRadius: 7, background: workflow.status === 'active' ? '#f0fdf4' : '#fff', color: workflow.status === 'active' ? '#10b981' : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          {workflow.status === 'active' ? 'Active' : 'Paused'}
                        </button>
                        <button onClick={() => runWorkflow(workflow)} disabled={isRunning} style={{ padding: '7px 16px', border: 'none', borderRadius: 7, background: isRunning ? '#e2e8f0' : (tpl?.badgeColor || '#6366f1'), color: isRunning ? '#94a3b8' : '#fff', cursor: isRunning ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isRunning ? <><SpinnerIcon /> Running…</> : <><PlayIcon /> Run Now</>}
                        </button>
                        <button onClick={() => deleteWorkflow(workflow.id)} style={{ padding: '7px 9px', border: '1.5px solid #fee2e2', borderRadius: 7, background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><TrashIcon /></button>
                      </div>
                    </div>

                    {isExpanded && tpl && (
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', background: '#fafbfc' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Configuration</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 14 }}>
                          {tpl.configFields.map(field => {
                            const val = workflow.config?.[field.key]
                            if (field.type === 'toggle' && !val) return null
                            return (
                              <div key={field.key} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 13px' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: '"IBM Plex Mono", monospace' }}>{field.type === 'toggle' ? '✓ Enabled' : (val ?? '—')}</div>
                              </div>
                            )
                          })}
                        </div>
                        <button onClick={() => runWorkflow(workflow)} disabled={runningId === workflow.id} style={{ padding: '8px 16px', border: 'none', borderRadius: 7, background: tpl.badgeColor, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <PlayIcon /> Run Now
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && (
            <div style={{ marginTop: 32, padding: '22px 24px', background: '#0f172a', borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.07em' }}>How Workflows Connect to Your CRM</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { icon: '⚡', title: 'Run a Workflow', desc: 'Execute against live ZoomInfo data. Precision filters ensure every result is high-confidence and actionable.' },
                  { icon: '➕', title: 'Add to CRM', desc: 'One click pushes contacts + companies with ZI IDs pre-filled. Enrichment needs no extra matching work.' },
                  { icon: '🔄', title: 'Close the Loop', desc: 'Won deals power Lookalike Builder. Customers trigger Account Growth Monitor. Workflows compound.' },
                ].map(s => (
                  <div key={s.title} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
