import React, { useState, useCallback } from 'react'
import { Spinner } from './UI'

function SignalIcon()   { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function RefreshIcon()  { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function ChevronIcon({ open }) { return open ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg> : <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg> }
function BoltIcon()     { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function BuildingIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function SearchIcon()   { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PlusIcon()     { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function GearIcon()     { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }

// exact same button style as rest of CRM
const btnBase = { display:'inline-flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:7, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s', letterSpacing:'-0.01em' }
const btnPrimary = { ...btnBase, background:'#0f172a', color:'#fff', border:'none' }
const btnGhost   = { ...btnBase, background:'#fff', color:'#374151', border:'1px solid #e2e8f0' }
const btnSmall   = { ...btnBase, padding:'4px 10px', fontSize:11.5 }
const btnSmallPrimary = { ...btnSmall, background:'#0f172a', color:'#fff', border:'none' }
const btnSmallGhost   = { ...btnSmall, background:'#fff', color:'#374151', border:'1px solid #e2e8f0' }

// exact same stat card as CRM homepage
const statCard = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'16px 18px' }
const statLabel = { fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }
const statValue = { fontSize:26, fontWeight:800, color:'#0f172a', letterSpacing:'-0.05em', fontFamily:'"IBM Plex Mono", monospace', lineHeight:1 }
const statSub   = { fontSize:11, color:'#94a3b8', marginTop:5 }

// exact same table header/cell as CRM contacts table
const TH = { fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', padding:'11px 16px', textAlign:'left', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }
const TD = { padding:'12px 16px', fontSize:13, color:'#374151', borderBottom:'1px solid #f8fafc', verticalAlign:'middle' }

function strengthConfig(s) {
  // using exact same palette as pipeline stage pills
  if (s === 'high') return { bg:'#fef2f2', color:'#991b1b', dot:'#ef4444', accent:'#ef4444', label:'High' }
  if (s === 'med')  return { bg:'#fffbeb', color:'#92400e', dot:'#f59e0b', accent:'#f59e0b', label:'Medium' }
  if (s === 'low')  return { bg:'#f0fdf4', color:'#166534', dot:'#22c55e', accent:'#22c55e', label:'Low' }
  return { bg:'#f1f5f9', color:'#64748b', dot:'#cbd5e1', accent:'#e2e8f0', label:'No signal' }
}

function ltColor(d) { return d>=90?'#ef4444':d>=30?'#f59e0b':'#10b981' }
function ltSuffix(d) { return d>=90?' · Cold':d>=30?' · Warm':'' }

function sigPill(type) {
  // matching existing badge style in ContactDetail
  if (type==='intent') return { background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }
  if (type==='news')   return { background:'#f5f3ff', color:'#6d28d9', border:'1px solid #ddd6fe' }
  if (type==='scoop')  return { background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0' }
  if (type==='risk')   return { background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca' }
  return { background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }
}

const SUGGESTED = ['CRM software','Sales automation','Lead generation','Marketing automation','Data enrichment','Account-based marketing','Revenue intelligence','Sales engagement','Customer success','Business intelligence']

function TopicModal({ initial, onSave, onClose }) {
  const [topics, setTopics] = useState(initial||[])
  const [input,  setInput]  = useState('')

  function add(t) {
    const v = t.trim()
    if (v && !topics.includes(v) && topics.length < 10) { setTopics(p=>[...p,v]); setInput('') }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:'28px', width:500, boxShadow:'0 8px 40px rgba(0,0,0,0.14)', fontFamily:'"IBM Plex Sans",sans-serif' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Intent Topics</h2>
          <button onClick={onClose} className="btn-ghost" style={{ ...btnGhost, padding:'4px 9px', fontSize:12 }}>✕</button>
        </div>
        <p style={{ margin:'0 0 14px', fontSize:13, color:'#64748b', lineHeight:1.65 }}>
          What does your team sell? ZoomInfo uses these topics to surface which accounts are actively researching right now.
        </p>

        {/* Selected topics */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:38, padding:'8px 10px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0', marginBottom:12 }}>
          {topics.map(t => (
            <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px 3px 12px', borderRadius:20, background:'#0f172a', color:'#fff', fontSize:12, fontWeight:500 }}>
              {t}
              <button onClick={()=>setTopics(p=>p.filter(x=>x!==t))} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, lineHeight:1, fontSize:14, display:'flex', alignItems:'center' }}>×</button>
            </span>
          ))}
          {!topics.length && <span style={{ fontSize:12, color:'#cbd5e1', alignSelf:'center' }}>No topics yet — add some below</span>}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add(input)}
            placeholder="Type a topic and press Enter…"
            style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit', background:'#f8fafc' }}/>
          <button onClick={()=>add(input)} className="btn-primary" style={btnPrimary}>Add</button>
        </div>

        {/* Suggestions */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Common topics</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {SUGGESTED.map(t => (
              <button key={t} onClick={()=>add(t)} disabled={topics.includes(t)} className="btn-ghost"
                style={{ ...btnSmallGhost, opacity:topics.includes(t)?0.35:1, cursor:topics.includes(t)?'default':'pointer' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, borderTop:'1px solid #f1f5f9', paddingTop:16 }}>
          <button onClick={onClose} className="btn-ghost" style={btnGhost}>Cancel</button>
          <button onClick={()=>onSave(topics)} disabled={!topics.length} className="btn-primary"
            style={{ ...btnPrimary, opacity:topics.length?1:0.4, cursor:topics.length?'pointer':'default' }}>
            Save &amp; Reload
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignalFeed({ showToast, onViewCompany, onViewContacts, onZiSearch, onAddDeal }) {
  const [mode,       setModeState] = useState(()=>{ try{return localStorage.getItem('sf_mode')||null}catch{return null} })
  const [topics,     setTopics]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('sf_topics')||'[]')}catch{return []} })
  const [showTopics, setShowTopics]= useState(false)
  const [accounts,   setAccounts]  = useState([])
  const [loading,    setLoading]   = useState(false)
  const [lastRef,    setLastRef]   = useState(null)
  const [expanded,   setExpanded]  = useState(null)
  const [sigF,  setSigF]  = useState('all')
  const [dayF,  setDayF]  = useState(0)
  const [strF,  setStrF]  = useState('all')

  const load = useCallback(async (m, t) => {
    const token = localStorage.getItem('zi_token')
    if (!token) { showToast('Set your ZoomInfo token in Integrations first','error'); return }
    setLoading(true); setExpanded(null)
    try {
      const res  = await fetch('/api/signals', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, mode:m||'all', topics:t||[] }) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error||'Failed to load signals','error'); return }
      setAccounts(data.accounts||[]); setLastRef(new Date())
    } catch { showToast('Network error loading signals','error') }
    finally { setLoading(false) }
  }, [showToast])

  // Auto-load from cache on mount if workflow has already run
  const loadedRef = React.useRef(false)
  React.useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true
      load(mode || 'all', topics)
    }
  }, [])

  function saveTopics(t) {
    try{ localStorage.setItem('sf_topics', JSON.stringify(t)) }catch{}
    setTopics(t); setShowTopics(false)
    if (mode) load(mode, t)
  }

  function handleMode(m) {
    try{ localStorage.setItem('sf_mode', m) }catch{}
    setModeState(m)
    if (topics.length) load(m, topics)
    else setShowTopics(true)
  }

  const filtered = accounts.filter(a => {
    if (sigF !== 'all' && !a.sigs.includes(sigF)) return false
    if (dayF > 0 && a.lt < dayF) return false
    if (strF === 'high' && a.strength !== 'high') return false
    if (strF === 'med'  && !['high','med'].includes(a.strength)) return false
    return true
  })

  const highC  = accounts.filter(a=>a.strength==='high').length
  const coldC  = accounts.filter(a=>a.lt>=90).length
  const freshC = accounts.filter(a=>a.sigAge!=null&&a.sigAge<=7).length
  const riskC  = accounts.filter(a=>a.sigs.includes('risk')).length
  const isGrow = mode==='grow'

  // ── Mode picker — only show if no accounts loaded from cache ──────────
  if (!mode && !accounts.length && !loading) return (
    <div style={{ fontFamily:'"IBM Plex Sans",sans-serif' }}>
      {showTopics && <TopicModal initial={topics} onSave={saveTopics} onClose={()=>setShowTopics(false)}/>}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, color:'#64748b' }}>ZoomInfo signals — intent, news, and scoops for your CRM accounts. Choose your focus to get started.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:560 }}>
        {[
          { key:'prospect', label:'Prospect', desc:'Surface accounts showing active buying intent. ZoomInfo tells you who to reach out to today.', border:'#818cf8', bg:'#eef2ff', color:'#4f46e5' },
          { key:'grow',     label:'Grow',     desc:'Monitor your won accounts for expansion signals. Know when to expand before they start looking elsewhere.', border:'#34d399', bg:'#ecfdf5', color:'#059669' },
        ].map(m => (
          <div key={m.key} onClick={()=>handleMode(m.key)}
            style={{ border:`1.5px solid ${m.border}`, borderRadius:12, padding:'22px 24px', cursor:'pointer', background:m.bg, transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none' }}>
            <div style={{ fontSize:14, fontWeight:700, color:m.color, marginBottom:8, letterSpacing:'-0.01em' }}>{m.label}</div>
            <div style={{ fontSize:12.5, color:'#475569', lineHeight:1.65 }}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:12, color:'#94a3b8' }}>You can switch modes anytime.</div>
    </div>
  )

  return (
    <div style={{ fontFamily:'"IBM Plex Sans",sans-serif' }}>
      {showTopics && <TopicModal initial={topics} onSave={saveTopics} onClose={()=>setShowTopics(false)}/>}
      <style>{`
        @keyframes sfpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .sf-datarow:hover { background: #f0f9ff !important; cursor: pointer; }
        .btn-ghost:hover  { background: #f1f5f9 !important; }
        .btn-primary:hover{ background: #1e293b !important; }
        .action-btn:hover { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
      `}</style>

      {/* ── Toolbar — matches top bar style ── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {/* Mode toggle — same style as existing tab toggles */}
        <div style={{ display:'flex', background:'#f1f5f9', borderRadius:8, padding:3, gap:2 }}>
          {['prospect','grow'].map(m => {
            const active = mode===m
            return (
              <button key={m} onClick={()=>handleMode(m)}
                style={{ padding:'5px 14px', borderRadius:6, fontSize:12.5, fontWeight:active?700:500, border:'none', background:active?'#0f172a':'transparent', color:active?'#fff':'#64748b', cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', transition:'all 0.1s' }}>
                {m}
              </button>
            )
          })}
        </div>

        {/* Live indicator */}
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'sfpulse 2s infinite', flexShrink:0 }}/>
        <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'"IBM Plex Mono",monospace' }}>
          {lastRef ? `Synced ${Math.max(1,Math.round((Date.now()-lastRef)/60000))}m ago` : 'ZoomInfo signals'}
        </span>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>setShowTopics(true)} className="btn-ghost action-btn"
            style={{ ...btnGhost, fontSize:12.5 }}>
            <GearIcon/> Topics
            {topics.length > 0 && <span style={{ background:'#f1f5f9', borderRadius:20, padding:'1px 7px', fontSize:10, color:'#64748b', fontWeight:600 }}>{topics.length}</span>}
          </button>
          <button onClick={()=>load(mode,topics)} disabled={loading} className="btn-ghost action-btn"
            style={{ ...btnGhost, fontSize:12.5, opacity:loading?0.6:1 }}>
            {loading ? <Spinner size={12}/> : <RefreshIcon/>} Refresh
          </button>
        </div>
      </div>

      {/* ── Stats strip — exact same as contacts/companies stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total accounts', value:accounts.length,  sub:`in ${mode} feed` },
          { label:'High signal',    value:highC,             sub:'act today',   color:'#ef4444' },
          { label:'Gone cold',      value:coldC,             sub:'90+ days',    color:'#f59e0b' },
          isGrow
            ? { label:'Champion risks', value:riskC,  sub:'need action', color:'#ef4444' }
            : { label:'Fresh signals',  value:freshC, sub:'last 7 days', color:'#22c55e' },
        ].map(s => (
          <div key={s.label} style={statCard}>
            <div style={statLabel}>{s.label}</div>
            <div style={{ ...statValue, color: s.color||'#0f172a' }}>{s.value}</div>
            <div style={statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters — matches existing filter bar style ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Signal:</span>
        {[['all','All'],['intent','Intent'],['news','News'],['scoop','Scoops'],['risk','Risk']].map(([v,l]) => (
          <button key={v} onClick={()=>setSigF(v)} className={sigF===v?'btn-primary':'btn-ghost action-btn'}
            style={{ ...(sigF===v?btnSmallPrimary:btnSmallGhost) }}>
            {l}
          </button>
        ))}

        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginLeft:8 }}>Touched:</span>
        <select onChange={e=>setDayF(+e.target.value)}
          style={{ fontSize:12, padding:'5px 9px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontFamily:'inherit', outline:'none' }}>
          <option value="0">Any time</option>
          <option value="30">30+ days ago</option>
          <option value="60">60+ days ago</option>
          <option value="90">90+ days ago</option>
        </select>

        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginLeft:8 }}>Strength:</span>
        <select onChange={e=>setStrF(e.target.value)}
          style={{ fontSize:12, padding:'5px 9px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontFamily:'inherit', outline:'none' }}>
          <option value="all">All</option>
          <option value="high">High only</option>
          <option value="med">High + Med</option>
        </select>

        {accounts.length > 0 && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', fontFamily:'"IBM Plex Mono",monospace' }}>
            {filtered.length} / {accounts.length} accounts
          </span>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', padding:'60px 0', color:'#94a3b8', fontSize:13 }}>
          <Spinner size={20}/> Loading ZoomInfo signals for your accounts…
        </div>
      )}

      {/* ── Empty — no data ── */}
      {!loading && !accounts.length && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'60px 0', textAlign:'center' }}>
          <div style={{ width:40, height:40, background:'linear-gradient(135deg,#818cf8,#38bdf8)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <SignalIcon/>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:6, letterSpacing:'-0.02em' }}>No signals loaded yet</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:20 }}>
            {topics.length ? 'Click Refresh to pull live ZoomInfo signals for your accounts.' : 'Configure your intent topics first, then load signals.'}
          </div>
          {!topics.length
            ? <div>
                <div style={{ fontSize:12, color:'#94a3b8', marginBottom:12 }}>Run the <strong>Signal Feed Sync</strong> workflow first to auto-populate signals, or configure topics to load manually.</div>
                <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                  <button onClick={()=>setShowTopics(true)} className="btn-ghost action-btn" style={btnGhost}><GearIcon/> Configure Topics</button>
                  <button onClick={()=>load(mode||'all',topics)} className="btn-primary" style={btnPrimary}><RefreshIcon/> Load from Cache</button>
                </div>
              </div>
            : <button onClick={()=>load(mode||'all',topics)} className="btn-primary" style={btnPrimary}><RefreshIcon/> Load Signals</button>
          }
        </div>
      )}

      {/* ── Empty — filtered ── */}
      {!loading && accounts.length > 0 && !filtered.length && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'48px 0', textAlign:'center' }}>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:10 }}>No accounts match your current filters.</div>
          <button onClick={()=>{setSigF('all');setDayF(0);setStrF('all')}} className="btn-ghost action-btn" style={btnGhost}>
            Clear filters
          </button>
        </div>
      )}

      {/* ── Table — exact same structure as contacts/companies table ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:4 }}/>
              <col style={{ width:'20%' }}/>
              <col style={{ width:'11%' }}/>
              <col style={{ width:'23%' }}/>
              <col style={{ width:'13%' }}/>
              <col style={{ width:'10%' }}/>
              <col/>
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...TH, padding:0, background:'#f8fafc' }}/>
                {['Account','Signal','Signals firing','Last touched','Signal age','Actions'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const sc    = strengthConfig(a.strength)
                const isExp = expanded===i
                const act1  = isGrow ? (a.sigs.includes('risk')?'Re-introduce':'Expand') : (a.lt>=90?'Re-engage':'Reach out')

                return [
                  // ── Main row ──────────────────────────────────────
                  <tr key={`row-${i}`} className="sf-datarow"
                    onClick={()=>setExpanded(isExp?null:i)}
                    style={{ background:isExp?'#f8fafc':'#fff', transition:'background 0.1s' }}>

                    {/* Urgency accent bar */}
                    <td style={{ padding:0, width:4 }}>
                      <div style={{ width:4, minHeight:50, height:'100%', background:sc.accent }}/>
                    </td>

                    {/* Account name */}
                    <td style={TD}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0f172a', marginBottom:2, letterSpacing:'-0.01em' }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{a.meta||'—'}</div>
                    </td>

                    {/* Signal strength pill */}
                    <td style={TD}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, fontSize:11.5, fontWeight:600, background:sc.bg, color:sc.color, letterSpacing:'-0.01em' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:sc.dot, flexShrink:0 }}/>
                        {sc.label}{a.score>0?` · ${a.score}`:''}
                      </span>
                    </td>

                    {/* Signal tags */}
                    <td style={TD}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {a.sigs.length ? a.sigs.map((t,si) => (
                          <span key={si} style={{ ...sigPill(t), display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500 }}>
                            {a.sigLabels[si]}
                          </span>
                        )) : <span style={{ fontSize:11, color:'#cbd5e1' }}>—</span>}
                      </div>
                    </td>

                    {/* Last touched */}
                    <td style={{ ...TD, fontSize:12, color:ltColor(a.lt), fontWeight:a.lt>=30?600:400 }}>
                      {a.ltLabel}{ltSuffix(a.lt)}
                    </td>

                    {/* Signal age mini bar */}
                    <td style={TD}>
                      {a.sigAge!=null ? (
                        <>
                          <div style={{ width:56, height:3, background:'#f1f5f9', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                            <div style={{ height:'100%', borderRadius:2, transition:'width 0.4s',
                              width:`${Math.min(100,Math.round((Math.max(0,30-a.sigAge)/30)*100))}%`,
                              background: a.sigAge<=3?'#ef4444':a.sigAge<=7?'#f59e0b':'#22c55e' }}/>
                          </div>
                          <div style={{ fontSize:10, color:'#94a3b8', fontFamily:'"IBM Plex Mono",monospace' }}>{a.sigAgeLabel}</div>
                        </>
                      ) : <span style={{ fontSize:11, color:'#e2e8f0' }}>—</span>}
                    </td>

                    {/* Actions */}
                    <td style={TD} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                        <button className="btn-primary" onClick={()=>onViewCompany&&onViewCompany(a)}
                          style={btnSmallPrimary}>
                          <BoltIcon/> {act1}
                        </button>
                        <button className="action-btn" onClick={()=>onViewCompany&&onViewCompany(a)}
                          style={btnSmallGhost}>
                          <BuildingIcon/> View
                        </button>
                        <button className="action-btn" onClick={()=>setExpanded(isExp?null:i)}
                          style={{ ...btnSmallGhost, padding:'4px 7px', color:'#94a3b8' }}>
                          <ChevronIcon open={isExp}/>
                        </button>
                      </div>
                    </td>
                  </tr>,

                  // ── Expand panel ───────────────────────────────────
                  isExp && (
                    <tr key={`exp-${i}`}>
                      <td colSpan={7} style={{ padding:0 }}>
                        <div style={{ background:'#f8fafc', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', padding:'18px 20px 18px 20px' }}>

                          {/* Why today — matches note/activity banner style */}
                          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:9, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:9 }}>
                            <SignalIcon/>
                            <div>
                              <div style={{ fontSize:12.5, fontWeight:700, color:'#1e40af', marginBottom:3, letterSpacing:'-0.01em' }}>
                                {a.sigs.includes('risk')   ? 'Champion risk — act before a competitor does.' :
                                 a.sigs.includes('intent') ? 'Active buying intent — reach out while the signal is hot.' :
                                 a.sigs.includes('news')   ? 'Recent news may have changed their priorities or budget.' :
                                 a.lt>=90                  ? 'Account has gone cold — a re-engagement window is open.' :
                                 'Maintain momentum with a check-in.'}
                              </div>
                              <div style={{ fontSize:12, color:'#3b82f6', lineHeight:1.6 }}>
                                <strong>Suggested action:</strong>{' '}
                                {a.sigs.includes('risk')   ? 'Find the new stakeholder via ZoomInfo Search and reach out within 48 hours.' :
                                 a.sigs.includes('intent') ? `Reference "${a.sigLabels[0]||'their research topic'}" in your outreach — they are in buying mode right now.` :
                                 a.sigs.includes('news')   ? 'Congratulate them on the news and ask how it changes their priorities.' :
                                 isGrow                    ? 'Book a check-in. Ask if the current contract still covers their needs.' :
                                 'Send a value-add touchpoint — a case study or insight. No pitch needed.'}
                              </div>
                            </div>
                          </div>

                          {/* Three data columns */}
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>

                            {/* ZI Signals */}
                            <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>ZoomInfo signals</div>
                              {[['Intent',a.intent],['News',a.news],['Scoops',a.scoop]].map(([k,v]) => (
                                <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'5px 0', borderBottom:'1px solid #f8fafc', gap:8 }}>
                                  <span style={{ fontSize:12, color:'#94a3b8', flexShrink:0 }}>{k}</span>
                                  <span style={{ fontSize:12, color:v==='—'?'#e2e8f0':'#374151', fontWeight:v==='—'?400:500, textAlign:'right', lineHeight:1.5, fontFamily:v==='—'?'inherit':'"IBM Plex Sans",sans-serif' }}>{v}</span>
                                </div>
                              ))}
                            </div>

                            {/* CRM context */}
                            <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>CRM context</div>
                              {[
                                ['Deal',        a.deal,      a.dealColor||'#374151'],
                                ['Last touch',  a.ltLabel+ltSuffix(a.lt), ltColor(a.lt)],
                                ['ZI ID',       a.zi_company_id||'Not enriched', a.zi_company_id?'#374151':'#f59e0b'],
                              ].map(([k,v,c]) => (
                                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f8fafc', gap:8 }}>
                                  <span style={{ fontSize:12, color:'#94a3b8', flexShrink:0 }}>{k}</span>
                                  <span style={{ fontSize:12, color:c, fontWeight:500, textAlign:'right' }}>{v}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Quick actions</div>
                              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                {[
                                  { label:`View ${a.name}`,  icon:<BuildingIcon/>, fn:()=>onViewCompany&&onViewCompany(a),   primary:true },
                                  { label:'Find contacts',    icon:<SearchIcon/>,  fn:()=>onViewContacts&&onViewContacts(a) },
                                  { label:'Search ZoomInfo',  icon:<SearchIcon/>,  fn:()=>onZiSearch&&onZiSearch(a) },
                                  { label:'Add deal',         icon:<PlusIcon/>,    fn:()=>onAddDeal&&onAddDeal(a) },
                                ].map(b => (
                                  <button key={b.label} onClick={b.fn}
                                    className={b.primary?'btn-primary':'action-btn'}
                                    style={{ ...(b.primary?btnSmallPrimary:btnSmallGhost), width:'100%', justifyContent:'center', fontSize:12 }}>
                                    {b.icon} {b.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                ]
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
