import { useState, useEffect, useCallback } from 'react'
import { Spinner } from './UI'

// ── Icons ─────────────────────────────────────────────────────────────────
function SignalIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function RefreshIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function ChevronDown() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg> }
function ChevronUp() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg> }
function ZapIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function MailIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function SearchIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PlusIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function SettingsIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }

// ── Helpers ───────────────────────────────────────────────────────────────
function ltClass(days) {
  if (days >= 90) return '#E24B4A'
  if (days >= 30) return '#BA7517'
  return '#3B6D11'
}
function ltSuffix(days) {
  if (days >= 90) return ' · Cold'
  if (days >= 30) return ' · Warm'
  return ''
}
function strengthColor(s) {
  if (s === 'high') return { bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A', bar: '#E24B4A' }
  if (s === 'med')  return { bg: '#FAEEDA', color: '#854F0B', dot: '#EF9F27', bar: '#EF9F27' }
  if (s === 'low')  return { bg: '#EAF3DE', color: '#3B6D11', dot: '#639922', bar: '#639922' }
  return { bg: '#F1EFE8', color: '#5F5E5A', dot: '#B4B2A9', bar: '#B4B2A9' }
}
function strengthLabel(s) {
  if (s === 'high') return 'High'
  if (s === 'med')  return 'Medium'
  if (s === 'low')  return 'Low'
  return 'No signal'
}
function ageBarWidth(days) {
  if (!days && days !== 0) return 0
  return Math.min(100, Math.round((Math.max(0, 30 - days) / 30) * 100))
}
function ageBarColor(days) {
  if (days === null || days === undefined) return '#B4B2A9'
  if (days <= 3)  return '#E24B4A'
  if (days <= 7)  return '#EF9F27'
  if (days <= 14) return '#BA7517'
  return '#639922'
}
function sigTagStyle(type) {
  if (type === 'intent') return { background: '#E6F1FB', color: '#185FA5' }
  if (type === 'news')   return { background: '#EEEDFE', color: '#3C3489' }
  if (type === 'scoop')  return { background: '#E1F5EE', color: '#0F6E56' }
  if (type === 'risk')   return { background: '#FCEBEB', color: '#A32D2D' }
  return { background: '#F1EFE8', color: '#5F5E5A' }
}

const SUGGESTED_TOPICS = [
  'CRM software', 'Sales automation', 'Lead generation', 'Marketing automation',
  'Data enrichment', 'Account-based marketing', 'Revenue intelligence',
  'Sales engagement', 'Customer success', 'Business intelligence',
]

// ── Topic Setup Modal ─────────────────────────────────────────────────────
function TopicSetup({ onSave, initial = [] }) {
  const [topics, setTopics] = useState(initial.length ? initial : [])
  const [input, setInput] = useState('')

  function addTopic(t) {
    const clean = t.trim()
    if (clean && !topics.includes(clean) && topics.length < 10) {
      setTopics([...topics, clean])
      setInput('')
    }
  }
  function removeTopic(t) { setTopics(topics.filter(x => x !== t)) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', fontFamily: '"IBM Plex Sans", sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <SignalIcon />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Configure Intent Topics</h2>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          Tell ZoomInfo what your buyers research. These topics power the intent signals in your Signal Feed.
        </p>

        {/* Selected topics */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, minHeight: 36 }}>
          {topics.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#E6F1FB', color: '#185FA5', fontSize: 12, fontWeight: 500 }}>
              {t}
              <button onClick={() => removeTopic(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#185FA5', padding: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
            </span>
          ))}
          {!topics.length && <span style={{ fontSize: 12, color: '#cbd5e1' }}>No topics added yet</span>}
        </div>

        {/* Add custom topic */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTopic(input)}
            placeholder="Type a topic and press Enter…"
            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <button onClick={() => addTopic(input)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            Add
          </button>
        </div>

        {/* Suggested topics */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Common topics</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTED_TOPICS.map(t => (
              <button key={t} onClick={() => addTopic(t)}
                disabled={topics.includes(t)}
                style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', background: topics.includes(t) ? '#f8fafc' : '#fff', color: topics.includes(t) ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 500, cursor: topics.includes(t) ? 'default' : 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => onSave(topics)} disabled={!topics.length}
            style={{ padding: '9px 20px', borderRadius: 8, background: topics.length ? '#0f172a' : '#e2e8f0', color: topics.length ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 600, border: 'none', cursor: topics.length ? 'pointer' : 'default' }}>
            Save & Load Signals
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function SignalFeed({ showToast }) {
  const [mode, setModeState] = useState(() => localStorage.getItem('sf_mode') || null)
  const [topics, setTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_topics') || '[]') } catch { return [] }
  })
  const [showTopicSetup, setShowTopicSetup] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [sigFilter, setSigFilter] = useState('all')
  const [dayFilter, setDayFilter] = useState(0)
  const [strFilter, setStrFilter] = useState('all')

  const needsSetup = !mode || !topics.length

  const load = useCallback(async (m, t) => {
    const token = localStorage.getItem('zi_token')
    if (!token) { showToast('Set your ZoomInfo token in Integrations first', 'error'); return }
    setLoading(true)
    setExpanded(null)
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mode: m, topics: t }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to load signals', 'error'); return }
      setAccounts(data.accounts || [])
      setLastRefresh(new Date())
    } catch (e) { showToast('Network error loading signals', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  function handleSaveTopics(t) {
    localStorage.setItem('sf_topics', JSON.stringify(t))
    setTopics(t)
    setShowTopicSetup(false)
    if (mode) load(mode, t)
  }

  function handleSetMode(m) {
    localStorage.setItem('sf_mode', m)
    setModeState(m)
    if (topics.length) load(m, topics)
    else setShowTopicSetup(true)
  }

  // Filter accounts
  const filtered = accounts.filter(a => {
    if (sigFilter !== 'all' && !a.sigs.includes(sigFilter)) return false
    if (dayFilter > 0 && a.lt < dayFilter) return false
    if (strFilter === 'high' && a.strength !== 'high') return false
    if (strFilter === 'med' && !['high','med'].includes(a.strength)) return false
    return true
  })

  const highCount = accounts.filter(a => a.strength === 'high').length
  const coldCount = accounts.filter(a => a.lt >= 90).length
  const freshSig  = accounts.filter(a => a.sigAge !== null && a.sigAge <= 7).length
  const riskCount = accounts.filter(a => a.sigs.includes('risk')).length

  const isGrow = mode === 'grow'
  const accentColor = isGrow ? '#0F6E56' : '#185FA5'
  const accentBg    = isGrow ? '#E1F5EE' : '#E6F1FB'
  const accentBorder= isGrow ? '#1D9E75' : '#378ADD'

  // ── Mode selector screen ─────────────────────────────────────────────
  if (!mode) {
    return (
      <div style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
        {showTopicSetup && <TopicSetup onSave={handleSaveTopics} initial={topics} />}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <SignalIcon />
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Signal Feed</h2>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>ZoomInfo intent, news, and scoops — inside your CRM.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 600 }}>
          {[
            { key: 'prospect', label: 'Prospect', desc: 'Accounts showing buying signals. Best time to reach out is now.', color: '#185FA5', bg: '#E6F1FB', border: '#378ADD' },
            { key: 'grow',     label: 'Grow',     desc: 'Customers showing expansion signals. Protect and expand your base.', color: '#0F6E56', bg: '#E1F5EE', border: '#1D9E75' },
          ].map(m => (
            <div key={m.key} onClick={() => handleSetMode(m.key)}
              style={{ border: `1.5px solid ${m.border}`, borderRadius: 12, padding: '20px 22px', cursor: 'pointer', background: m.bg, transition: 'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.01)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>You can switch modes anytime.</p>
      </div>
    )
  }

  // ── Topic setup prompt ───────────────────────────────────────────────
  if (!topics.length && !showTopicSetup) {
    return (
      <div style={{ fontFamily: '"IBM Plex Sans", sans-serif', maxWidth: 500 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Set up intent topics</div>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
            Tell ZoomInfo what your buyers research so we can surface accounts showing buying intent.
          </p>
          <button onClick={() => setShowTopicSetup(true)}
            style={{ padding: '9px 20px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Configure Topics
          </button>
        </div>
        {showTopicSetup && <TopicSetup onSave={handleSaveTopics} initial={topics} />}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
      {showTopicSetup && <TopicSetup onSave={handleSaveTopics} initial={topics} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 3 }}>
              {['prospect','grow'].map(m => (
                <button key={m} onClick={() => handleSetMode(m)}
                  style={{ padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: mode === m ? `1px solid ${m==='grow'?'#1D9E75':'#378ADD'}` : 'none', background: mode === m ? (m==='grow'?'#E1F5EE':'#E6F1FB') : 'transparent', color: mode === m ? (m==='grow'?'#0F6E56':'#185FA5') : '#64748b', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75', animation: 'sfpulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {lastRefresh ? `Refreshed ${Math.round((Date.now()-lastRefresh)/60000)||'<1'} min ago · ZoomInfo data` : 'ZoomInfo data'}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {isGrow ? 'Grow' : 'Prospect'} — {accounts.length} accounts in your feed
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTopicSetup(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            <SettingsIcon /> Topics
          </button>
          <button onClick={() => load(mode, topics)} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? <Spinner size={11} /> : <RefreshIcon />} Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total accounts', value: accounts.length, sub: 'in feed', color: '#0f172a' },
          { label: 'High signal',    value: highCount,        sub: 'act today', color: '#A32D2D' },
          { label: 'Gone cold',      value: coldCount,        sub: '90+ days', color: '#854F0B' },
          isGrow
            ? { label: 'Champion risks', value: riskCount,   sub: 'need action', color: '#A32D2D' }
            : { label: 'Fresh signals',  value: freshSig,    sub: 'last 7 days', color: accentColor },
        ].map(s => (
          <div key={s.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: '"IBM Plex Mono", monospace' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signal:</span>
        {[['all','All'],['intent','Intent'],['news','News'],['scoop','Scoops'],['risk','Risk']].map(([v,l]) => (
          <button key={v} onClick={() => setSigFilter(v)}
            style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: `1px solid ${sigFilter===v?accentBorder:'#e2e8f0'}`, background: sigFilter===v?accentBg:'#fff', color: sigFilter===v?accentColor:'#64748b', cursor: 'pointer' }}>
            {l}
          </button>
        ))}
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 8 }}>Last touched:</span>
        <select onChange={e => setDayFilter(+e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#374151' }}>
          <option value="0">Any time</option>
          <option value="30">30+ days ago</option>
          <option value="60">60+ days ago</option>
          <option value="90">90+ days ago</option>
        </select>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 8 }}>Strength:</span>
        <select onChange={e => setStrFilter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#374151' }}>
          <option value="all">All</option>
          <option value="high">High only</option>
          <option value="med">High + Med</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 0', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          <Spinner size={18} />
          Loading ZoomInfo signals for your accounts…
        </div>
      )}

      {/* Empty — needs refresh */}
      {!loading && !accounts.length && (
        <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>—</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No signals loaded yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Click Refresh to pull ZoomInfo signals for your accounts.</div>
          <button onClick={() => load(mode, topics)}
            style={{ padding: '9px 20px', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Load Signals
          </button>
        </div>
      )}

      {/* Empty — filters */}
      {!loading && accounts.length > 0 && !filtered.length && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>No accounts match your current filters.</div>
          <button onClick={() => { setSigFilter('all'); setDayFilter(0); setStrFilter('all') }}
            style={{ fontSize: 12, color: accentColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '4px 2fr 100px 1.5fr 1.4fr 90px 1.3fr 24px', gap: 0, background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '8px 14px', alignItems: 'center' }}>
            {['','Account','Score','Signals','Last touched','Signal age','Actions',''].map((h,i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((a, i) => {
            const sc = strengthColor(a.strength)
            const isExp = expanded === i
            const act1 = isGrow ? (a.sigs.includes('risk') ? 'Re-introduce' : 'Expand') : (a.lt >= 90 ? 'Re-engage' : 'Call')

            return (
              <div key={a.id}>
                <style>{`@keyframes sfpulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
                <div onClick={() => setExpanded(isExp ? null : i)}
                  style={{ display: 'grid', gridTemplateColumns: '4px 2fr 100px 1.5fr 1.4fr 90px 1.3fr 24px', gap: 0, padding: '11px 14px', alignItems: 'center', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: isExp ? '#f8fafc' : '#fff', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = '#fff' }}>

                  {/* Urgency bar */}
                  <div style={{ width: 3, height: 34, borderRadius: 2, background: sc.bar, flexShrink: 0 }} />

                  {/* Company */}
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.meta || '—'}</div>
                  </div>

                  {/* Score */}
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                      {strengthLabel(a.strength)} {a.score > 0 ? `· ${a.score}` : ''}
                    </span>
                  </div>

                  {/* Signal tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {a.sigs.length ? a.sigs.map((s, si) => (
                      <span key={si} style={{ ...sigTagStyle(s), display: 'inline-block', padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                        {a.sigLabels[si]}
                      </span>
                    )) : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                  </div>

                  {/* Last touched */}
                  <div style={{ fontSize: 12, color: ltClass(a.lt), fontWeight: a.lt >= 30 ? 500 : 400 }}>
                    {a.ltLabel}{ltSuffix(a.lt)}
                  </div>

                  {/* Signal age bar */}
                  <div>
                    {a.sigAge !== null ? (
                      <div>
                        <div style={{ width: 70, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', border: '1px solid #f1f5f9', marginBottom: 3 }}>
                          <div style={{ height: '100%', width: `${ageBarWidth(a.sigAge)}%`, background: ageBarColor(a.sigAge), borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.sigAgeLabel}</div>
                      </div>
                    ) : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={e => e.stopPropagation()}
                      style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${accentBorder}`, background: accentBg, color: accentColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {act1 === 'Call' ? <ZapIcon /> : <ZapIcon />} {act1}
                    </button>
                    <button onClick={e => e.stopPropagation()}
                      style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MailIcon /> Email
                    </button>
                  </div>

                  {/* Expand chevron */}
                  <div style={{ color: '#94a3b8', display: 'flex', justifyContent: 'flex-end' }}>
                    {isExp ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {/* Expand panel */}
                {isExp && (
                  <div style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <div style={{ padding: '14px 18px' }}>
                      {/* Why today */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                        <SignalIcon />
                        <div>
                          <div style={{ fontSize: 12, color: '#0C447C', lineHeight: 1.6, fontWeight: 500 }}>
                            {a.sigs.length
                              ? `${a.sigs.includes('risk') ? 'Champion risk detected' : 'Signal firing'}: ${a.sigLabels[0]}.`
                              : 'No active signals this week.'}
                            {a.lt >= 90 ? ` Account has been cold for ${a.ltLabel}.` : ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>
                            <strong>Suggested:</strong>{' '}
                            {a.sigs.includes('risk') ? 'Re-introduce before a competitor does. Find the new contact on ZoomInfo.' :
                             a.sigs.includes('intent') ? 'Reach out today — they are actively researching. Strike while intent is high.' :
                             a.sigs.includes('news') ? 'Reference the news as a reason to connect. Budget may have changed.' :
                             a.lt >= 90 ? 'Re-engage with a light value-add touchpoint. No pitch needed.' :
                             'Maintain momentum with a check-in.'}
                          </div>
                        </div>
                      </div>

                      {/* Three columns */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {/* ZI signals */}
                        <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>ZoomInfo signals</div>
                          {[['Intent', a.intent],['News', a.news],['Scoops', a.scoop]].map(([k,v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f8fafc', gap: 8 }}>
                              <span style={{ color: '#94a3b8', flexShrink: 0 }}>{k}</span>
                              <span style={{ color: '#0f172a', fontWeight: 500, textAlign: 'right', lineHeight: 1.4 }}>{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* CRM context */}
                        <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>CRM context</div>
                          {[
                            ['Deal status', a.deal],
                            ['Last touched', a.ltLabel + ltSuffix(a.lt)],
                            ['ZI Company ID', a.zi_company_id || 'Not enriched'],
                          ].map(([k,v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #f8fafc', gap: 8 }}>
                              <span style={{ color: '#94a3b8', flexShrink: 0 }}>{k}</span>
                              <span style={{ color: a.sigs.includes('risk') && k === 'Deal status' ? '#A32D2D' : '#0f172a', fontWeight: 500, textAlign: 'right' }}>{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick actions</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { label: isGrow ? (a.sigs.includes('risk') ? 'Re-introduce' : 'Expand deal') : (a.lt >= 90 ? 'Re-engage' : 'Call now'), icon: <ZapIcon />, primary: true },
                              { label: 'Send email',    icon: <MailIcon /> },
                              { label: 'Find contact',  icon: <SearchIcon /> },
                              { label: 'Add to workflow', icon: <PlusIcon /> },
                            ].map(b => (
                              <button key={b.label}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: b.primary ? 600 : 500, border: b.primary ? `1px solid ${accentBorder}` : '1px solid #e2e8f0', background: b.primary ? accentBg : '#fff', color: b.primary ? accentColor : '#374151', cursor: 'pointer', textAlign: 'left' }}>
                                {b.icon} {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
