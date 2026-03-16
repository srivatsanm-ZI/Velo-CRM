import { useState, useCallback } from 'react'
import { Spinner } from './UI'

function SignalIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function RefreshIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function ChevronDown(){ return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg> }
function ChevronUp()  { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg> }
function BoltIcon()   { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function BuildingIcon(){ return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function SearchIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PlusIcon()   { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function SettingsIcon(){ return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }

const B = {
  base: { display:'inline-flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.1s', border:'1px solid #e2e8f0', background:'#fff', color:'#374151' },
  primary: { background:'#0f172a', color:'#fff', border:'none' },
  sm: { padding:'4px 9px', fontSize:11.5 },
}
const TH = { fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', padding:'10px 14px', textAlign:'left', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }
const TD = { padding:'11px 14px', fontSize:13, color:'#374151', borderBottom:'1px solid #f8fafc', verticalAlign:'middle' }

function sm(s) {
  if (s==='high') return { bg:'#fef2f2', color:'#991b1b', dot:'#ef4444', bar:'#ef4444', label:'High' }
  if (s==='med')  return { bg:'#fffbeb', color:'#92400e', dot:'#f59e0b', bar:'#f59e0b', label:'Medium' }
  if (s==='low')  return { bg:'#f0fdf4', color:'#166534', dot:'#22c55e', bar:'#22c55e', label:'Low' }
  return { bg:'#f8fafc', color:'#64748b', dot:'#cbd5e1', bar:'#e2e8f0', label:'No signal' }
}
function ltColor(d) { return d>=90?'#ef4444':d>=30?'#f59e0b':'#10b981' }
function ltSuffix(d) { return d>=90?' · Cold':d>=30?' · Warm':'' }
function sigStyle(t) {
  if (t==='intent') return { background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }
  if (t==='news')   return { background:'#f5f3ff', color:'#6d28d9', border:'1px solid #ddd6fe' }
  if (t==='scoop')  return { background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0' }
  if (t==='risk')   return { background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca' }
  return { background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0' }
}
function ageW(d) { return d==null ? 0 : Math.min(100, Math.round((Math.max(0,30-d)/30)*100)) }
function ageC(d) { return d==null?'#e2e8f0':d<=3?'#ef4444':d<=7?'#f59e0b':'#10b981' }

const TOPICS = ['CRM software','Sales automation','Lead generation','Marketing automation','Data enrichment','Account-based marketing','Revenue intelligence','Sales engagement','Customer success','Business intelligence']

function TopicModal({ initial, onSave, onClose }) {
  const [topics, setTopics] = useState(initial || [])
  const [input, setInput] = useState('')
  function add(t) { const v=t.trim(); if(v&&!topics.includes(v)&&topics.length<10){setTopics(p=>[...p,v]);setInput('')} }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:16, padding:28, width:500, fontFamily:'"IBM Plex Sans",sans-serif', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'#0f172a' }}>Intent Topics</h2>
          <button onClick={onClose} style={{ ...B.base, ...B.sm }}>✕</button>
        </div>
        <p style={{ margin:'0 0 14px', fontSize:13, color:'#64748b', lineHeight:1.6 }}>What does your team sell? These topics power ZoomInfo intent signals in your feed.</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:40, marginBottom:12, padding:8, background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
          {topics.map(t=>(
            <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, background:'#0f172a', color:'#fff', fontSize:12, fontWeight:500 }}>
              {t} <button onClick={()=>setTopics(p=>p.filter(x=>x!==t))} style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', padding:0, fontSize:14, lineHeight:1 }}>×</button>
            </span>
          ))}
          {!topics.length && <span style={{ fontSize:12, color:'#cbd5e1', alignSelf:'center' }}>No topics added yet</span>}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add(input)} placeholder="Type a topic and press Enter…" style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, outline:'none', fontFamily:'inherit' }} />
          <button onClick={()=>add(input)} style={{ ...B.base, ...B.primary }}>Add</button>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Suggestions</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {TOPICS.map(t=>(
              <button key={t} onClick={()=>add(t)} disabled={topics.includes(t)} style={{ ...B.base, ...B.sm, opacity:topics.includes(t)?0.4:1, cursor:topics.includes(t)?'default':'pointer' }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ ...B.base }}>Cancel</button>
          <button onClick={()=>onSave(topics)} disabled={!topics.length} style={{ ...B.base, ...B.primary, opacity:topics.length?1:0.5 }}>Save & Reload</button>
        </div>
      </div>
    </div>
  )
}

export default function SignalFeed({ showToast, onViewCompany, onViewContacts, onZiSearch, onAddDeal }) {
  const [mode,     setModeState] = useState(()=>{ try{return localStorage.getItem('sf_mode')||null}catch{return null} })
  const [topics,   setTopics]    = useState(()=>{ try{return JSON.parse(localStorage.getItem('sf_topics')||'[]')}catch{return []} })
  const [showTopics, setShowTopics] = useState(false)
  const [accounts, setAccounts]  = useState([])
  const [loading,  setLoading]   = useState(false)
  const [lastRef,  setLastRef]   = useState(null)
  const [expanded, setExpanded]  = useState(null)
  const [sigF, setSigF] = useState('all')
  const [dayF, setDayF] = useState(0)
  const [strF, setStrF] = useState('all')

  const load = useCallback(async (m,t) => {
    const token = localStorage.getItem('zi_token')
    if (!token) { showToast('Set your ZoomInfo token in Integrations first','error'); return }
    setLoading(true); setExpanded(null)
    try {
      const res  = await fetch('/api/signals', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, mode:m, topics:t }) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error||'Failed to load signals','error'); return }
      setAccounts(data.accounts||[]); setLastRef(new Date())
    } catch { showToast('Network error loading signals','error') }
    finally { setLoading(false) }
  }, [showToast])

  function saveTopics(t) {
    try{localStorage.setItem('sf_topics',JSON.stringify(t))}catch{}
    setTopics(t); setShowTopics(false)
    if (mode) load(mode,t)
  }
  function handleMode(m) {
    try{localStorage.setItem('sf_mode',m)}catch{}
    setModeState(m)
    if (topics.length) load(m,topics)
    else setShowTopics(true)
  }

  const filtered = accounts.filter(a => {
    if (sigF!=='all'&&!a.sigs.includes(sigF)) return false
    if (dayF>0&&a.lt<dayF) return false
    if (strF==='high'&&a.strength!=='high') return false
    if (strF==='med'&&!['high','med'].includes(a.strength)) return false
    return true
  })

  const highC = accounts.filter(a=>a.strength==='high').length
  const coldC = accounts.filter(a=>a.lt>=90).length
  const freshC= accounts.filter(a=>a.sigAge!=null&&a.sigAge<=7).length
  const riskC = accounts.filter(a=>a.sigs.includes('risk')).length
  const isGrow= mode==='grow'

  if (!mode) return (
    <div style={{ fontFamily:'"IBM Plex Sans",sans-serif', maxWidth:560 }}>
      {showTopics && <TopicModal initial={topics} onSave={saveTopics} onClose={()=>setShowTopics(false)} />}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em', marginBottom:4 }}>Signal Feed</div>
        <div style={{ fontSize:13, color:'#64748b' }}>ZoomInfo intent, news, and scoops — inside your CRM.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          { key:'prospect', label:'Prospect', desc:'Find accounts showing buying signals. Best time to reach out is today.', accent:'#4f46e5', bg:'#eef2ff', border:'#818cf8' },
          { key:'grow',     label:'Grow',     desc:'Expand and protect customers showing growth signals.', accent:'#059669', bg:'#ecfdf5', border:'#34d399' },
        ].map(m=>(
          <div key={m.key} onClick={()=>handleMode(m.key)}
            style={{ border:`1.5px solid ${m.border}`, borderRadius:12, padding:'22px 24px', cursor:'pointer', background:m.bg }}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
            onMouseLeave={e=>e.currentTarget.style.transform='none'}>
            <div style={{ fontSize:15, fontWeight:700, color:m.accent, marginBottom:8 }}>{m.label}</div>
            <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:12, color:'#94a3b8' }}>You can switch modes anytime.</div>
    </div>
  )

  return (
    <div style={{ fontFamily:'"IBM Plex Sans",sans-serif' }}>
      {showTopics && <TopicModal initial={topics} onSave={saveTopics} onClose={()=>setShowTopics(false)} />}
      <style>{`@keyframes sfp{0%,100%{opacity:1}50%{opacity:0.3}} .sfr:hover{background:#f8fafc!important} .sfb:hover{background:#f1f5f9!important;border-color:#cbd5e1!important} .sfbp:hover{background:#1e293b!important}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', background:'#f1f5f9', borderRadius:8, padding:3, gap:2 }}>
            {['prospect','grow'].map(m=>{
              const active=mode===m
              return <button key={m} onClick={()=>handleMode(m)} style={{ padding:'5px 14px', borderRadius:6, fontSize:12.5, fontWeight:600, border:active?'1px solid #e2e8f0':'none', background:active?'#fff':'transparent', color:active?'#0f172a':'#64748b', cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{m}</button>
            })}
          </div>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'sfp 2s infinite' }} />
          <span style={{ fontSize:11, color:'#94a3b8' }}>{lastRef ? `Refreshed ${Math.max(1,Math.round((Date.now()-lastRef)/60000))} min ago · ZoomInfo` : 'ZoomInfo signals'}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowTopics(true)} className="sfb" style={{ ...B.base, ...B.sm }}>
            <SettingsIcon /> Topics{topics.length>0&&<span style={{ background:'#f1f5f9', borderRadius:20, padding:'1px 6px', fontSize:10 }}>{topics.length}</span>}
          </button>
          <button onClick={()=>load(mode,topics)} disabled={loading} className="sfb" style={{ ...B.base, ...B.sm, opacity:loading?0.6:1 }}>
            {loading?<Spinner size={11}/>:<RefreshIcon/>} Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total accounts', value:accounts.length, sub:`in ${mode} feed`,  color:'#0f172a' },
          { label:'High signal',    value:highC,            sub:'act today',        color:'#991b1b' },
          { label:'Gone cold',      value:coldC,            sub:'90+ days',         color:'#92400e' },
          isGrow ? { label:'Champion risks', value:riskC, sub:'need action', color:'#991b1b' }
                 : { label:'Fresh signals',  value:freshC, sub:'last 7 days', color:'#166534' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:'12px 16px', border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'"IBM Plex Mono",monospace', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Signal:</span>
        {[['all','All'],['intent','Intent'],['news','News'],['scoop','Scoops'],['risk','Risk']].map(([v,l])=>(
          <button key={v} onClick={()=>setSigF(v)} className="sfb"
            style={{ ...B.base, ...B.sm, background:sigF===v?'#0f172a':'#fff', color:sigF===v?'#fff':'#374151', borderColor:sigF===v?'#0f172a':'#e2e8f0' }}>{l}</button>
        ))}
        <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginLeft:8 }}>Touched:</span>
        <select onChange={e=>setDayF(+e.target.value)} style={{ fontSize:12, padding:'5px 8px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontFamily:'inherit' }}>
          <option value="0">Any time</option>
          <option value="30">30+ days ago</option>
          <option value="60">60+ days ago</option>
          <option value="90">90+ days ago</option>
        </select>
        <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginLeft:8 }}>Strength:</span>
        <select onChange={e=>setStrF(e.target.value)} style={{ fontSize:12, padding:'5px 8px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontFamily:'inherit' }}>
          <option value="all">All</option>
          <option value="high">High only</option>
          <option value="med">High + Med</option>
        </select>
        {accounts.length>0 && <span style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8' }}>{filtered.length} of {accounts.length}</span>}
      </div>

      {/* Loading */}
      {loading && <div style={{ display:'flex', alignItems:'center', gap:12, padding:'56px 0', justifyContent:'center', color:'#94a3b8', fontSize:13 }}><Spinner size={20}/> Loading ZoomInfo signals…</div>}

      {/* Empty — no data */}
      {!loading && !accounts.length && (
        <div style={{ textAlign:'center', padding:'60px 0', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'12px 0 6px' }}>No signals loaded yet</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:20 }}>{topics.length?'Click Refresh to pull ZoomInfo signals.':'Configure intent topics first.'}</div>
          {!topics.length
            ? <button onClick={()=>setShowTopics(true)} style={{ ...B.base, ...B.primary }}>Configure Topics</button>
            : <button onClick={()=>load(mode,topics)} style={{ ...B.base, ...B.primary }}><RefreshIcon/> Load Signals</button>}
        </div>
      )}

      {/* Empty — filtered */}
      {!loading && accounts.length>0 && !filtered.length && (
        <div style={{ textAlign:'center', padding:'48px 0', background:'#fff', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:10 }}>No accounts match your current filters.</div>
          <button onClick={()=>{setSigF('all');setDayF(0);setStrF('all')}} style={{ ...B.base }}>Clear filters</button>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length>0 && (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:4 }}/>
              <col style={{ width:'21%' }}/>
              <col style={{ width:'11%' }}/>
              <col style={{ width:'22%' }}/>
              <col style={{ width:'13%' }}/>
              <col style={{ width:'10%' }}/>
              <col style={{ width:'23%' }}/>
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...TH, padding:0 }}/>
                <th style={TH}>Account</th>
                <th style={TH}>Signal</th>
                <th style={TH}>Signals firing</th>
                <th style={TH}>Last touched</th>
                <th style={TH}>Signal age</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a,i)=>{
                const s = sm(a.strength)
                const isExp = expanded===i
                const act1  = isGrow?(a.sigs.includes('risk')?'Re-introduce':'Expand'):(a.lt>=90?'Re-engage':'Reach out')
                return [
                  <tr key={`r${i}`} className="sfr" onClick={()=>setExpanded(isExp?null:i)}
                    style={{ cursor:'pointer', background:isExp?'#f8fafc':'#fff', transition:'background 0.1s' }}>
                    <td style={{ padding:0 }}><div style={{ width:4, minHeight:48, height:'100%', background:s.bar }}/></td>
                    <td style={TD}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#0f172a', marginBottom:2 }}>{a.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{a.meta||'—'}</div>
                    </td>
                    <td style={TD}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
                        {s.label}{a.score>0?` · ${a.score}`:''}
                      </span>
                    </td>
                    <td style={TD}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {a.sigs.length ? a.sigs.map((t,si)=>(
                          <span key={si} style={{ ...sigStyle(t), display:'inline-block', padding:'2px 7px', borderRadius:20, fontSize:11, fontWeight:500 }}>{a.sigLabels[si]}</span>
                        )) : <span style={{ fontSize:11, color:'#cbd5e1' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ ...TD, fontSize:12, color:ltColor(a.lt), fontWeight:a.lt>=30?600:400 }}>
                      {a.ltLabel}{ltSuffix(a.lt)}
                    </td>
                    <td style={TD}>
                      {a.sigAge!=null ? <>
                        <div style={{ width:60, height:4, background:'#f1f5f9', borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                          <div style={{ height:'100%', width:`${ageW(a.sigAge)}%`, background:ageC(a.sigAge), borderRadius:2 }}/>
                        </div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>{a.sigAgeLabel}</div>
                      </> : <span style={{ fontSize:11, color:'#cbd5e1' }}>—</span>}
                    </td>
                    <td style={TD} onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                        <button className="sfbp" onClick={()=>onViewCompany&&onViewCompany(a)} style={{ ...B.base, ...B.primary, ...B.sm }}><BoltIcon/> {act1}</button>
                        <button className="sfb"  onClick={()=>onViewCompany&&onViewCompany(a)} style={{ ...B.base, ...B.sm }}><BuildingIcon/> View</button>
                        <button className="sfb"  onClick={()=>setExpanded(isExp?null:i)} style={{ ...B.base, ...B.sm, padding:'4px 7px', color:'#94a3b8' }}>
                          {isExp?<ChevronUp/>:<ChevronDown/>}
                        </button>
                      </div>
                    </td>
                  </tr>,

                  isExp && <tr key={`e${i}`}>
                    <td colSpan={7} style={{ padding:0, borderBottom:'1px solid #f8fafc' }}>
                      <div style={{ background:'#f8fafc', borderTop:'1px solid #f1f5f9', padding:'16px 18px' }}>
                        {/* Why today */}
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:9, padding:'10px 14px', marginBottom:14 }}>
                          <SignalIcon/>
                          <div>
                            <div style={{ fontSize:12.5, color:'#1e40af', fontWeight:600, marginBottom:3 }}>
                              {a.sigs.includes('risk') ? 'Champion risk — act before a competitor does.' :
                               a.sigs.includes('intent') ? 'Active buying intent detected — reach out while the signal is hot.' :
                               a.sigs.includes('news') ? 'Recent news may have changed their budget or priorities.' :
                               a.lt>=90 ? 'This account has gone cold — a re-engagement window is open.' :
                               'Maintain momentum with a light touchpoint.'}
                            </div>
                            <div style={{ fontSize:12, color:'#3b82f6' }}>
                              <strong>Suggested:</strong>{' '}
                              {a.sigs.includes('risk') ? 'Find the new stakeholder via ZoomInfo and reach out within 48 hours.' :
                               a.sigs.includes('intent') ? `They are researching right now — reference ${a.sigLabels[0]||'the topic'} in your outreach.` :
                               a.sigs.includes('news') ? 'Congratulate them on the news and ask how it changes their priorities.' :
                               isGrow ? 'Book a check-in. Ask if the current contract still covers their needs.' :
                               'Send a value-add touchpoint — a case study or insight. No pitch needed.'}
                            </div>
                          </div>
                        </div>

                        {/* Three columns */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                          <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>ZoomInfo signals</div>
                            {[['Intent',a.intent],['News',a.news],['Scoops',a.scoop]].map(([k,v])=>(
                              <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'5px 0', borderBottom:'1px solid #f8fafc', gap:8 }}>
                                <span style={{ fontSize:12, color:'#94a3b8', flexShrink:0 }}>{k}</span>
                                <span style={{ fontSize:12, color:v==='—'?'#cbd5e1':'#374151', fontWeight:v==='—'?400:500, textAlign:'right', lineHeight:1.4 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>CRM context</div>
                            {[
                              ['Deal',       a.deal,     a.dealColor||'#374151'],
                              ['Last touch', a.ltLabel+ltSuffix(a.lt), ltColor(a.lt)],
                              ['ZI ID',      a.zi_company_id||'Not enriched', a.zi_company_id?'#374151':'#f59e0b'],
                            ].map(([k,v,c])=>(
                              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f8fafc', gap:8 }}>
                                <span style={{ fontSize:12, color:'#94a3b8', flexShrink:0 }}>{k}</span>
                                <span style={{ fontSize:12, color:c, fontWeight:500, textAlign:'right' }}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ background:'#fff', borderRadius:9, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                            <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Quick actions</div>
                            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                              {[
                                { label:`View ${a.name}`, icon:<BuildingIcon/>, fn:()=>onViewCompany&&onViewCompany(a), primary:true },
                                { label:'Find contacts',   icon:<SearchIcon/>,  fn:()=>onViewContacts&&onViewContacts(a) },
                                { label:'Search ZoomInfo', icon:<SearchIcon/>,  fn:()=>onZiSearch&&onZiSearch(a) },
                                { label:'Add deal',        icon:<PlusIcon/>,    fn:()=>onAddDeal&&onAddDeal(a) },
                              ].map(btn=>(
                                <button key={btn.label} className={btn.primary?'sfbp':'sfb'} onClick={btn.fn}
                                  style={{ ...B.base, ...(btn.primary?B.primary:{}), width:'100%', justifyContent:'center', fontSize:12 }}>
                                  {btn.icon} {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ]
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
