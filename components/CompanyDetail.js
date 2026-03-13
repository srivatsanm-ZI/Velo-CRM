import { useState, useEffect } from 'react'
import Notes from './Notes'
import ActivityTimeline from './ActivityTimeline'
import AIInsights from './AIInsights'

function fmtDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function fmtRev(v) { if (!v) return '—'; const n = Number(v); if (isNaN(n)) return String(v); if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`; if (n >= 1000) return `$${(n/1000).toFixed(0)}K`; return `$${n}` }
function fmtNum(v) { if (!v) return '—'; const n = Number(v); if (isNaN(n)) return String(v); return n.toLocaleString() }

function CloseIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function BoltIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function EditIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function PlusIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function MailIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function PhoneIcon()  { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.07 6.07l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> }
function DealIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
function LinkIcon()   { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
function CheckIcon()  { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> }
function Spin()       { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg> }

function PropRow({ label, value, href, mono }) {
  const missing = !value
  const textStyle = { fontSize: 13, color: missing ? '#cbd5e1' : '#0f172a', fontFamily: mono ? '"IBM Plex Mono",monospace' : '"IBM Plex Sans",sans-serif', fontWeight: missing ? 400 : 500 }
  return (
    <div style={{ display:'flex', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
      <span style={{ width:136, flexShrink:0, fontSize:12, color:'#94a3b8', fontWeight:500, paddingTop:1 }}>{label}</span>
      {href && !missing ? <a href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noreferrer" style={{ ...textStyle, color:'#2563eb', textDecoration:'none' }}>{value}</a>
        : <span style={textStyle}>{value || '—'}</span>}
    </div>
  )
}

function StagePill({ stage }) {
  const map = { prospecting:['#4f46e5','#eef2ff'], qualified:['#b45309','#fef3c7'], proposal:['#1d4ed8','#eff6ff'], negotiation:['#6d28d9','#f5f3ff'], closed_won:['#047857','#ecfdf5'], closed_lost:['#b91c1c','#fef2f2'] }
  const [c, bg] = map[stage] || ['#475569','#f8fafc']
  return <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:bg, color:c, textTransform:'capitalize' }}>{stage?.replace(/_/g,' ') || '—'}</span>
}

function Avatar({ name }) {
  const p = (name||'?').split(' ')
  const colors = ['#4f46e5','#0891b2','#059669','#7c3aed','#db2777','#d97706']
  const color = colors[(name?.charCodeAt(0)||0) % colors.length]
  return <div style={{ width:28, height:28, borderRadius:8, background:color, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{(p[0]?.[0]||'')+(p[1]?.[0]||'')}</div>
}

function EmptyState({ icon, text, action, onAction }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'36px 0', gap:8, color:'#cbd5e1' }}>
      <span style={{ fontSize:28 }}>{icon}</span>
      <span style={{ fontSize:13, color:'#94a3b8' }}>{text}</span>
      {action && <button onClick={onAction} style={{ marginTop:6, fontSize:12, color:'#4f46e5', background:'none', border:'none', cursor:'pointer', fontWeight:600, textDecoration:'underline' }}>{action}</button>}
    </div>
  )
}

const INPUT = { width:'100%', padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fff', fontFamily:'"IBM Plex Sans",sans-serif' }

function AddContactModal({ company, onClose, onSaved }) {
  const [f, setF] = useState({ first_name:'', last_name:'', email:'', job_title:'', phone:'', management_level:'' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))
  async function save() {
    if (!f.first_name.trim()) { setErr('First name required'); return }
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/contacts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...f, company_id:company.id, company_name:company.name, source:'manual' }) })
      const d = await res.json()
      if (!res.ok) { setErr(d.error||'Failed'); return }
      onSaved(d); onClose()
    } catch(e) { setErr(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:480, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div><div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Add Contact</div><div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>@ {company.name}</div></div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><CloseIcon /></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>First Name *</label><input style={INPUT} value={f.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Jane" /></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Last Name</label><input style={INPUT} value={f.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Smith" /></div>
        </div>
        <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Email</label><input style={INPUT} type="email" value={f.email} onChange={e=>set('email',e.target.value)} placeholder="jane@company.com" /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Job Title</label><input style={INPUT} value={f.job_title} onChange={e=>set('job_title',e.target.value)} placeholder="VP of Sales" /></div>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Phone</label><input style={INPUT} value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="+1 (555) 000-0000" /></div>
        </div>
        <div style={{ marginBottom:16 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Seniority</label>
          <select style={INPUT} value={f.management_level} onChange={e=>set('management_level',e.target.value)}>
            <option value="">— Select —</option>
            {['C Level Exec','VP Level Exec','Director','Manager','Non Manager'].map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {err && <div style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, color:'#dc2626', fontSize:12, marginBottom:12 }}>⚠️ {err}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', border:'1.5px solid #e2e8f0', borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:'#374151', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#4f46e5', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'default':'pointer', display:'flex', alignItems:'center', gap:6, opacity:saving?0.7:1 }}>
            {saving ? <><Spin/> Saving…</> : <><CheckIcon/> Add Contact</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddDealModal({ company, contacts, onClose, onSaved }) {
  const [f, setF] = useState({ title:'', stage:'prospecting', value:'', contact_id:'', deal_type:'new_business' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k,v) => setF(p => ({ ...p, [k]:v }))
  async function save() {
    if (!f.title.trim()) { setErr('Deal title required'); return }
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/deals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...f, company_id:company.id, value: f.value ? Number(f.value) : null }) })
      const d = await res.json()
      if (!res.ok) { setErr(d.error||'Failed'); return }
      onSaved(d); onClose()
    } catch(e) { setErr(e.message) } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:440, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>New Deal — {company.name}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><CloseIcon /></button>
        </div>
        <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Deal Name *</label><input style={INPUT} value={f.title} onChange={e=>set('title',e.target.value)} placeholder="Acme — Q3 Expansion" /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Stage</label>
            <select style={INPUT} value={f.stage} onChange={e=>set('stage',e.target.value)}>
              {['prospecting','qualified','proposal','negotiation','closed_won','closed_lost'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Value ($)</label><input style={INPUT} type="number" value={f.value} onChange={e=>set('value',e.target.value)} placeholder="25000" /></div>
        </div>
        {contacts.length > 0 && (
          <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Primary Contact</label>
            <select style={INPUT} value={f.contact_id} onChange={e=>set('contact_id',e.target.value)}>
              <option value="">— None —</option>
              {contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.job_title||'No title'}</option>)}
            </select>
          </div>
        )}
        {err && <div style={{ padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, color:'#dc2626', fontSize:12, marginBottom:12 }}>⚠️ {err}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
          <button onClick={onClose} style={{ padding:'9px 16px', border:'1.5px solid #e2e8f0', borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:'#374151', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#059669', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'default':'pointer', display:'flex', alignItems:'center', gap:6, opacity:saving?0.7:1 }}>
            {saving ? <><Spin/> Saving…</> : <><CheckIcon/> Create Deal</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function LogActivityModal({ company, contacts, onClose, onSaved }) {
  const [f, setF] = useState({ type:'call', subject:'', body:'', contact_id:'', outcome:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  async function save() {
    if (!f.subject.trim()) return
    setSaving(true)
    try {
      await fetch('/api/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...f, contact_id:f.contact_id||null, company_id:company.id }) })
      onSaved?.(); onClose()
    } finally { setSaving(false) }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:480, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Log Activity</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><CloseIcon /></button>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {[['call','📞 Call'],['email','✉️ Email'],['meeting','📅 Meeting'],['demo','🖥️ Demo'],['linkedin','💼 LinkedIn']].map(([v,l])=>(
            <button key={v} onClick={()=>set('type',v)} style={{ padding:'6px 12px', borderRadius:20, border:`1.5px solid ${f.type===v?'#4f46e5':'#e2e8f0'}`, background:f.type===v?'#eef2ff':'#fff', color:f.type===v?'#4f46e5':'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>{l}</button>
          ))}
        </div>
        <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Subject *</label><input style={INPUT} value={f.subject} onChange={e=>set('subject',e.target.value)} placeholder="Discovery call" /></div>
        {contacts.length > 0 && (
          <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Contact</label>
            <select style={INPUT} value={f.contact_id} onChange={e=>set('contact_id',e.target.value)}>
              <option value="">— None —</option>
              {contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Outcome</label>
          <select style={INPUT} value={f.outcome} onChange={e=>set('outcome',e.target.value)}>
            <option value="">— None —</option>
            {['Connected','No answer','Left voicemail','Booked meeting','Sent follow-up','Not interested'].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:16 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Notes</label><textarea style={{ ...INPUT, minHeight:72, resize:'vertical' }} value={f.body} onChange={e=>set('body',e.target.value)} placeholder="Key takeaways, next steps…" /></div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', border:'1.5px solid #e2e8f0', borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:'#374151', cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving||!f.subject.trim()} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#0f172a', color:'#fff', fontSize:13, fontWeight:600, cursor:(saving||!f.subject.trim())?'default':'pointer', opacity:(saving||!f.subject.trim())?0.6:1, display:'flex', alignItems:'center', gap:6 }}>
            {saving ? <><Spin/> Saving…</> : <><CheckIcon/> Log Activity</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmailComposer({ company, contacts, onClose }) {
  const [to, setTo] = useState(contacts.find(c=>c.email)?.email || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sent, setSent] = useState(false)

  async function generateAIDraft() {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: `Write a short personalized cold outreach email to someone at ${company.name}${company.industry?` (${company.industry})`:''}. Goal: book a 15-min call. Under 80 words. Direct, not salesy. Return JSON only: {"subject":"...","body":"..."}` }) })
      const d = await res.json()
      const text = (d.result||d.content||'').replace(/\`\`\`json|\`\`\`/g,'').trim()
      const p = JSON.parse(text)
      if (p.subject) setSubject(p.subject)
      if (p.body) setBody(p.body)
    } catch(e) {
      setBody(`Hi,\n\nI came across ${company.name} and wanted to connect. Would a quick 15-min call this week work?\n\nBest,`)
    } finally { setGenerating(false) }
  }

  function send() {
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    setSent(true)
    if (to || subject) {
      fetch('/api/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'email', subject: subject||'Email sent', body, company_id:company.id, contact_id: contacts.find(c=>c.email===to)?.id||null }) })
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:560, padding:24, boxShadow:'0 20px 50px rgba(0,0,0,0.2)', maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>✉️ Compose Email</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={generateAIDraft} disabled={generating} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#f5f3ff', border:'1px solid #c4b5fd', borderRadius:7, fontSize:12, fontWeight:600, color:'#7c3aed', cursor:generating?'default':'pointer', opacity:generating?0.7:1 }}>
              {generating ? <Spin/> : '✨'} AI Draft
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><CloseIcon /></button>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>To</label>
          {contacts.filter(c=>c.email).length > 0
            ? <select style={INPUT} value={to} onChange={e=>setTo(e.target.value)}>
                <option value="">— Choose contact —</option>
                {contacts.filter(c=>c.email).map(c=><option key={c.id} value={c.email}>{c.first_name} {c.last_name} &lt;{c.email}&gt;</option>)}
              </select>
            : <input style={INPUT} value={to} onChange={e=>setTo(e.target.value)} placeholder="recipient@company.com" />
          }
        </div>
        <div style={{ marginBottom:10 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Subject</label><input style={INPUT} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Quick intro" /></div>
        <div style={{ marginBottom:16 }}><label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:4 }}>Body</label><textarea style={{ ...INPUT, minHeight:160, resize:'vertical', lineHeight:1.6 }} value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your email, or click AI Draft…" /></div>
        {sent && <div style={{ padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:7, color:'#059669', fontSize:12, marginBottom:12 }}>✓ Opened in your email client. Activity logged.</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', border:'1.5px solid #e2e8f0', borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:'#374151', cursor:'pointer' }}>Close</button>
          <button onClick={send} disabled={!to||!subject} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#2563eb', color:'#fff', fontSize:13, fontWeight:600, cursor:(!to||!subject)?'default':'pointer', opacity:(!to||!subject)?0.5:1, display:'flex', alignItems:'center', gap:6 }}>
            <MailIcon/> Send via Email Client
          </button>
        </div>
      </div>
    </div>
  )
}

function TasksPanel({ company, contacts }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [nt, setNt] = useState({ title:'', due_date:'', contact_id:'', priority:'medium' })

  useEffect(() => { load() }, [company.id])
  async function load() { setLoading(true); try { const r=await fetch(`/api/tasks?company_id=${company.id}`); const d=await r.json(); setTasks(Array.isArray(d)?d:[]) } finally { setLoading(false) } }

  async function addTask() {
    if (!nt.title.trim()) return
    const res = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...nt, company_id:company.id, contact_id:nt.contact_id||null }) })
    if (res.ok) { const d=await res.json(); setTasks(t=>[d,...t]); setNt({ title:'', due_date:'', contact_id:'', priority:'medium' }); setAdding(false) }
  }

  async function toggle(task) {
    const s = task.status==='done' ? 'open' : 'done'
    await fetch(`/api/tasks/${task.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:s }) })
    setTasks(ts=>ts.map(t=>t.id===task.id?{...t,status:s}:t))
  }

  async function del(id) {
    await fetch(`/api/tasks/${id}`, { method:'DELETE' })
    setTasks(ts=>ts.filter(t=>t.id!==id))
  }

  const pColor = { high:'#dc2626', medium:'#d97706', low:'#64748b' }
  const IS = { padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:12, color:'#0f172a', outline:'none', background:'#fff' }

  return (
    <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Tasks ({tasks.length})</span>
        <button onClick={()=>setAdding(a=>!a)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:6, fontSize:12, fontWeight:600, color:'#374151', cursor:'pointer' }}><PlusIcon/> Add Task</button>
      </div>
      {adding && (
        <div style={{ padding:'12px 14px', background:'#f8fafc', borderRadius:9, border:'1.5px solid #e2e8f0', marginBottom:12 }}>
          <input style={{ ...IS, width:'100%', marginBottom:8, boxSizing:'border-box' }} placeholder="Task title…" value={nt.title} onChange={e=>setNt(n=>({...n,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addTask()} />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <input style={{ ...IS, flex:1 }} type="date" value={nt.due_date} onChange={e=>setNt(n=>({...n,due_date:e.target.value}))} />
            <select style={{ ...IS, flex:1 }} value={nt.priority} onChange={e=>setNt(n=>({...n,priority:e.target.value}))}>
              <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">⚪ Low</option>
            </select>
            {contacts.length > 0 && <select style={{ ...IS, flex:1 }} value={nt.contact_id} onChange={e=>setNt(n=>({...n,contact_id:e.target.value}))}><option value="">No contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>}
            <button onClick={addTask} style={{ padding:'7px 14px', background:'#0f172a', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>Save</button>
          </div>
        </div>
      )}
      {loading ? <div style={{ color:'#94a3b8', fontSize:13 }}>Loading…</div>
        : tasks.length === 0 ? <EmptyState icon="✅" text="No open tasks" action="Add a task" onAction={()=>setAdding(true)} />
        : tasks.map(task => {
          const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 0', borderBottom:'1px solid #f8fafc' }}>
              <button onClick={()=>toggle(task)} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${task.status==='done'?'#059669':'#cbd5e1'}`, background:task.status==='done'?'#059669':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1 }}>
                {task.status==='done' && <CheckIcon/>}
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:task.status==='done'?'#94a3b8':'#0f172a', textDecoration:task.status==='done'?'line-through':'none', fontWeight:500 }}>{task.title}</div>
                <div style={{ display:'flex', gap:8, marginTop:3 }}>
                  {task.due_date && <span style={{ fontSize:11, color:overdue?'#dc2626':'#64748b', fontWeight:overdue?700:400 }}>{overdue?'⚠️ ':'📅 '}{fmtDate(task.due_date)}</span>}
                  <span style={{ fontSize:11, color:pColor[task.priority]||'#64748b', fontWeight:600, textTransform:'capitalize' }}>{task.priority}</span>
                </div>
              </div>
              <button onClick={()=>del(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:16, lineHeight:1 }}>×</button>
            </div>
          )
        })
      }
    </div>
  )
}

export default function CompanyDetail({ company: init, onEnrich, onEdit, onClose, enriching, onContactOpen }) {
  const [company, setCompany]   = useState(init)
  const [tab, setTab]           = useState('overview')
  const [contacts, setContacts] = useState([])
  const [deals, setDeals]       = useState([])
  const [loadCo, setLoadCo]     = useState(false)
  const [loadDe, setLoadDe]     = useState(false)
  const [remapping, setRemapping] = useState(false)
  const [remapResult, setRemapResult] = useState(null)
  const [modal, setModal]       = useState(null)

  useEffect(() => { loadContacts(); loadDeals() }, [company.id])
  useEffect(() => {
    if (!enriching) fetch(`/api/companies/${company.id}`).then(r=>r.ok?r.json():null).then(d=>{ if(d?.id) setCompany(d) })
  }, [enriching])

  async function loadContacts() { setLoadCo(true); try { const r=await fetch(`/api/contacts?company_id=${company.id}`); const d=await r.json(); setContacts(Array.isArray(d)?d:[]) } finally { setLoadCo(false) } }
  async function loadDeals()    { setLoadDe(true); try { const r=await fetch(`/api/deals?company_id=${company.id}`);    const d=await r.json(); setDeals(Array.isArray(d)?d:[])    } finally { setLoadDe(false) } }

  async function runRemap() {
    setRemapping(true); setRemapResult(null)
    try { const r=await fetch('/api/contacts/remap',{method:'POST'}); const d=await r.json(); setRemapResult(d); await loadContacts() }
    finally { setRemapping(false) }
  }

  const wonDeals  = deals.filter(d=>d.stage==='closed_won')
  const openDeals = deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage))
  const totalWon  = wonDeals.reduce((s,d)=>s+(Number(d.value)||0),0)
  const totalOpen = openDeals.reduce((s,d)=>s+(Number(d.value)||0),0)

  const TABS = [
    { key:'overview',  label:'Overview' },
    { key:'contacts',  label:'Contacts', count:contacts.length },
    { key:'deals',     label:'Deals',    count:deals.length },
    { key:'tasks',     label:'Tasks' },
    { key:'activity',  label:'Activity' },
    { key:'notes',     label:'Notes' },
    { key:'ai',        label:'AI Insights' },
  ]

  const typeColor  = company.type==='customer' ? '#047857' : '#4f46e5'
  const typeBg     = company.type==='customer' ? '#ecfdf5' : '#eef2ff'
  const typeBorder = company.type==='customer' ? '#a7f3d0' : '#c7d2fe'
  const BTN = { display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:12, fontWeight:600, color:'#374151', cursor:'pointer' }

  return (
    <>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}} @keyframes spin{to{transform:rotate(360deg)}} .cdtab:hover{color:#374151!important} .cdrow:hover{background:#f0f9ff!important;cursor:pointer}`}</style>
      {modal==='add_contact'  && <AddContactModal   company={company} onClose={()=>setModal(null)} onSaved={c=>{setContacts(cs=>[c,...cs]);setModal(null)}} />}
      {modal==='add_deal'     && <AddDealModal       company={company} contacts={contacts} onClose={()=>setModal(null)} onSaved={d=>{setDeals(ds=>[d,...ds]);setModal(null)}} />}
      {modal==='log_activity' && <LogActivityModal   company={company} contacts={contacts} onClose={()=>setModal(null)} onSaved={loadContacts} />}
      {modal==='email'        && <EmailComposer      company={company} contacts={contacts} onClose={()=>setModal(null)} />}

      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(15,23,42,0.3)', backdropFilter:'blur(1px)' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:900, zIndex:201, display:'flex', flexDirection:'column', background:'#f8fafc', boxShadow:'-4px 0 48px rgba(0,0,0,0.18)', animation:'slideIn 0.2s ease-out', fontFamily:'"IBM Plex Sans",sans-serif' }}>

        {/* HEADER */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, paddingTop:18, paddingBottom:14 }}>
            <div style={{ width:44, height:44, borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {company.logo ? <img src={company.logo} alt="" style={{ width:40, height:40, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/> : <span style={{ fontSize:17, fontWeight:800, color:'#10b981' }}>{company.name?.[0]}</span>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>{company.name}</h2>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:typeBg, color:typeColor, border:`1px solid ${typeBorder}`, textTransform:'uppercase' }}>{company.type||'prospect'}</span>
                {company.enriched && <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0' }}>✓ Enriched</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4, flexWrap:'wrap' }}>
                {company.industry && <span style={{ fontSize:12, color:'#64748b' }}>{company.industry}</span>}
                {company.website && <a href={company.website.startsWith('http')?company.website:`https://${company.website}`} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#2563eb', textDecoration:'none' }}>🌐 {company.website}</a>}
                {(company.city||company.country) && <span style={{ fontSize:12, color:'#94a3b8' }}>📍 {[company.city,company.state,company.country].filter(Boolean).join(', ')}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <button onClick={()=>setModal('email')}        style={{ ...BTN, color:'#2563eb', borderColor:'#bfdbfe', background:'#eff6ff' }}><MailIcon/>  Email</button>
              <button onClick={()=>setModal('log_activity')} style={{ ...BTN, color:'#7c3aed', borderColor:'#c4b5fd', background:'#f5f3ff' }}><PhoneIcon/> Log</button>
              <button onClick={()=>setModal('add_deal')}     style={{ ...BTN, color:'#059669', borderColor:'#a7f3d0', background:'#f0fdf4' }}><DealIcon/>  Deal</button>
              <button onClick={()=>onEnrich(company)} disabled={enriching} style={{ ...BTN, opacity:enriching?0.6:1 }}>{enriching?<Spin/>:<BoltIcon/>} {enriching?'Enriching…':'Enrich'}</button>
              <button onClick={onEdit}  style={BTN}><EditIcon/> Edit</button>
              <button onClick={onClose} style={{ ...BTN, padding:'6px 8px' }}><CloseIcon/></button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:1, background:'#e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            {[
              { label:'Employees',   value:fmtNum(company.employees), color:'#4f46e5' },
              { label:'Revenue',     value:fmtRev(company.revenue),   color:'#059669' },
              { label:'Open Deals',  value:openDeals.length,          color:'#d97706' },
              { label:'Won Revenue', value:totalWon>0?fmtRev(totalWon):'—', color:'#2563eb' },
              { label:'Contacts',    value:contacts.length,           color:'#7c3aed' },
            ].map(s=>(
              <div key={s.label} style={{ background:'#fff', padding:'10px 0', textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:800, color:s.color, fontFamily:'"IBM Plex Mono",monospace', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:3, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', marginBottom:-1, overflowX:'auto' }}>
            {TABS.map(t=>(
              <button key={t.key} className="cdtab" onClick={()=>setTab(t.key)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 14px', fontSize:13, fontWeight:tab===t.key?700:500, color:tab===t.key?'#0f172a':'#94a3b8', background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?'#0f172a':'transparent'}`, marginBottom:-1, cursor:'pointer', whiteSpace:'nowrap' }}>
                {t.label}
                {t.count!==undefined && t.count>0 && <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:20, background:tab===t.key?'#f1f5f9':'#f8fafc', color:tab===t.key?'#374151':'#94a3b8' }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex:1, overflow:'auto', padding:20 }}>

          {tab==='overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'14px 18px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Company Info</div>
                <PropRow label="Industry"  value={company.industry} />
                <PropRow label="Employees" value={fmtNum(company.employees)} mono />
                <PropRow label="Revenue"   value={fmtRev(company.revenue)} mono />
                <PropRow label="Founded"   value={company.founded_year||company.founded||null} />
                <PropRow label="Phone"     value={company.phone} />
                <PropRow label="Website"   value={company.website} href={company.website} />
                <PropRow label="ZI ID"     value={company.zi_company_id} mono />
                <PropRow label="Source"    value={company.source} />
                {company.description && <div style={{ marginTop:10, padding:'9px 11px', background:'#f8fafc', borderRadius:7, border:'1px solid #f1f5f9', fontSize:12, color:'#475569', lineHeight:1.65 }}>{company.description.length>240?company.description.slice(0,240)+'…':company.description}</div>}
              </div>

              <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'14px 18px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>Location & Dates</div>
                <PropRow label="Street"  value={company.street} />
                <PropRow label="City"    value={company.city} />
                <PropRow label="State"   value={company.state} />
                <PropRow label="Zip"     value={company.zip_code} mono />
                <PropRow label="Country" value={company.country} />
                <PropRow label="Added"   value={fmtDate(company.created_at)} />
                {company.enriched_at && <PropRow label="Enriched" value={fmtDate(company.enriched_at)} />}
                <div style={{ marginTop:14, padding:'10px 12px', background:'#fffbeb', borderRadius:8, border:'1px solid #fcd34d' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#92400e', marginBottom:5 }}>⚡ Auto-Map Contacts</div>
                  <div style={{ fontSize:11, color:'#78350f', marginBottom:8 }}>Link orphaned contacts to companies by name, email domain, or ZI ID.</div>
                  <button onClick={runRemap} disabled={remapping} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#d97706', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:remapping?'default':'pointer', opacity:remapping?0.7:1 }}>
                    {remapping ? <><Spin/> Running…</> : <><LinkIcon/> Run Remap</>}
                  </button>
                  {remapResult && <div style={{ marginTop:7, fontSize:11, color:'#059669', fontWeight:600 }}>✓ Linked {remapResult.linked} new + {remapResult.updated || 0} corrected out of {remapResult.total} contacts</div>}
                </div>
              </div>

              {/* Contacts preview */}
              <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'14px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Contacts ({contacts.length})</span>
                  <div style={{ display:'flex', gap:6 }}>
                    {contacts.length>3 && <button onClick={()=>setTab('contacts')} style={{ fontSize:12, color:'#4f46e5', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>See all →</button>}
                    <button onClick={()=>setModal('add_contact')} style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'#4f46e5', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontWeight:600 }}><PlusIcon/> Add</button>
                  </div>
                </div>
                {loadCo ? <div style={{ color:'#94a3b8', fontSize:13 }}>Loading…</div>
                  : contacts.length===0 ? <EmptyState icon="👤" text="No contacts linked" action="+ Add contact" onAction={()=>setModal('add_contact')} />
                  : contacts.slice(0,4).map(c=>(
                    <div key={c.id} className="cdrow" onClick={()=>onContactOpen?.(c)} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 6px', borderBottom:'1px solid #f8fafc', borderRadius:6, transition:'background 0.1s' }}>
                      <Avatar name={`${c.first_name} ${c.last_name}`}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize:11, color:'#94a3b8' }}>{c.job_title||'—'}</div>
                      </div>
                      {c.email && <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} style={{ fontSize:11, color:'#2563eb' }}><MailIcon/></a>}
                      {c.enriched && <span style={{ fontSize:10, color:'#059669', fontWeight:600 }}>✓</span>}
                    </div>
                  ))
                }
              </div>

              {/* Deals preview */}
              <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'14px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Deals ({deals.length})</span>
                  <div style={{ display:'flex', gap:6 }}>
                    {deals.length>3 && <button onClick={()=>setTab('deals')} style={{ fontSize:12, color:'#4f46e5', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>See all →</button>}
                    <button onClick={()=>setModal('add_deal')} style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'#059669', background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontWeight:600 }}><PlusIcon/> Add</button>
                  </div>
                </div>
                {loadDe ? <div style={{ color:'#94a3b8', fontSize:13 }}>Loading…</div>
                  : deals.length===0 ? <EmptyState icon="💰" text="No deals yet" action="+ Create deal" onAction={()=>setModal('add_deal')} />
                  : deals.slice(0,4).map(d=>(
                    <div key={d.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'6px 0', borderBottom:'1px solid #f8fafc' }}>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:'#0f172a', marginBottom:3 }}>{d.title}</div><StagePill stage={d.stage}/></div>
                      {d.value && <span style={{ fontSize:12, fontWeight:700, fontFamily:'"IBM Plex Mono",monospace', color:'#0f172a', flexShrink:0 }}>{fmtRev(d.value)}</span>}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {tab==='contacts' && (
            <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
              <div style={{ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Contacts at {company.name}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>{contacts.length} people</span>
                  <button onClick={()=>setModal('add_contact')} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}><PlusIcon/> Add Contact</button>
                </div>
              </div>
              {loadCo ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading…</div>
                : contacts.length===0 ? <EmptyState icon="👤" text="No contacts linked" action="+ Add Contact" onAction={()=>setModal('add_contact')} />
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Name','Title','Email','Phone','Location','Status'].map(h=>(
                        <th key={h} style={{ padding:'9px 16px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {contacts.map(c=>(
                        <tr key={c.id} className="cdrow" onClick={()=>onContactOpen?.(c)} style={{ borderBottom:'1px solid #f8fafc', transition:'background 0.1s' }}>
                          <td style={{ padding:'10px 16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                              <Avatar name={`${c.first_name} ${c.last_name}`}/>
                              <div><div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{c.first_name} {c.last_name}</div>{c.seniority && <div style={{ fontSize:11, color:'#94a3b8' }}>{c.seniority}</div>}</div>
                            </div>
                          </td>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'#475569' }}>{c.job_title||'—'}</td>
                          <td style={{ padding:'10px 16px' }}>
                            {c.email ? <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} style={{ fontSize:12, color:'#2563eb', fontFamily:'"IBM Plex Mono",monospace', textDecoration:'none' }}>{c.email}</a> : <span style={{ fontSize:12, color:'#cbd5e1' }}>—</span>}
                          </td>
                          <td style={{ padding:'10px 16px', fontSize:12, color:'#475569', fontFamily:'"IBM Plex Mono",monospace' }}>{c.phone||'—'}</td>
                          <td style={{ padding:'10px 16px', fontSize:12, color:'#64748b' }}>{[c.city,c.country].filter(Boolean).join(', ')||'—'}</td>
                          <td style={{ padding:'10px 16px' }}>
                            <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:c.enriched?'#f0fdf4':'#f8fafc', color:c.enriched?'#059669':'#94a3b8', border:`1px solid ${c.enriched?'#bbf7d0':'#e2e8f0'}` }}>{c.enriched?'✓ Enriched':'Pending'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}

          {tab==='deals' && (
            <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
              <div style={{ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Deals</span>
                <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                  {totalOpen>0 && <span style={{ fontSize:12, color:'#d97706', fontWeight:600 }}>Open: {fmtRev(totalOpen)}</span>}
                  {totalWon>0  && <span style={{ fontSize:12, color:'#059669', fontWeight:600 }}>Won: {fmtRev(totalWon)}</span>}
                  <button onClick={()=>setModal('add_deal')} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', background:'#059669', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}><PlusIcon/> Add Deal</button>
                </div>
              </div>
              {loadDe ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading…</div>
                : deals.length===0 ? <EmptyState icon="💰" text="No deals for this company" action="+ Create Deal" onAction={()=>setModal('add_deal')} />
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Deal','Stage','Value','Type','Created'].map(h=>(
                        <th key={h} style={{ padding:'9px 16px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {deals.map(d=>(
                        <tr key={d.id} className="cdrow" style={{ borderBottom:'1px solid #f8fafc' }}>
                          <td style={{ padding:'10px 16px', fontSize:13, fontWeight:600, color:'#0f172a' }}>{d.title}</td>
                          <td style={{ padding:'10px 16px' }}><StagePill stage={d.stage}/></td>
                          <td style={{ padding:'10px 16px', fontSize:13, fontWeight:700, color:'#0f172a', fontFamily:'"IBM Plex Mono",monospace' }}>{fmtRev(d.value)}</td>
                          <td style={{ padding:'10px 16px', fontSize:12, color:'#64748b', textTransform:'capitalize' }}>{d.deal_type?.replace(/_/g,' ')||'New Business'}</td>
                          <td style={{ padding:'10px 16px', fontSize:12, color:'#94a3b8', fontFamily:'"IBM Plex Mono",monospace' }}>{fmtDate(d.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}

          {tab==='tasks' && <TasksPanel company={company} contacts={contacts} />}

          {tab==='activity' && (
            <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>Activity Timeline</div>
                <button onClick={()=>setModal('log_activity')} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}><PlusIcon/> Log Activity</button>
              </div>
              <ActivityTimeline companyId={company.id} />
            </div>
          )}

          {tab==='notes' && (
            <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'16px 18px' }}>
              <Notes companyId={company.id} />
            </div>
          )}

          {tab==='ai' && (
            <div style={{ background:'#fff', borderRadius:10, border:'1.5px solid #e2e8f0', padding:'16px 18px' }}>
              <AIInsights company={company} contact={null} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
