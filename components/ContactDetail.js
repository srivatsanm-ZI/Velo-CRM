import { useState, useEffect } from 'react'
import Notes from './Notes'
import ActivityTimeline from './ActivityTimeline'
import AIInsights from './AIInsights'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtRev(v) {
  if (!v) return '—'
  const n = Number(v); if (isNaN(n)) return String(v)
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

function CloseIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function BoltIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function EditIcon() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function Spin() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
}

function PropRow({ label, value, href, mono, email }) {
  const missing = !value
  const textStyle = { fontSize: 13, color: missing ? '#cbd5e1' : '#0f172a', fontFamily: mono ? '"IBM Plex Mono", monospace' : '"IBM Plex Sans", sans-serif', fontWeight: missing ? 400 : 500 }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ width: 136, flexShrink: 0, fontSize: 12, color: '#94a3b8', fontWeight: 500, paddingTop: 1 }}>{label}</span>
      {email && !missing
        ? <a href={`mailto:${value}`} style={{ ...textStyle, color: '#2563eb', textDecoration: 'none' }}>{value}</a>
        : href && !missing
          ? <a href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noreferrer" style={{ ...textStyle, color: '#2563eb', textDecoration: 'none' }}>{value}</a>
          : <span style={textStyle}>{value || '—'}</span>
      }
    </div>
  )
}

function StagePill({ stage }) {
  const map = { prospecting: ['#4f46e5','#eef2ff'], qualified: ['#b45309','#fef3c7'], proposal: ['#1d4ed8','#eff6ff'], negotiation: ['#6d28d9','#f5f3ff'], closed_won: ['#047857','#ecfdf5'], closed_lost: ['#b91c1c','#fef2f2'] }
  const [c, bg] = map[stage] || ['#475569','#f8fafc']
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color: c, textTransform: 'capitalize' }}>{stage?.replace(/_/g, ' ') || '—'}</span>
}

function SeniorityBadge({ level }) {
  if (!level) return null
  const colors = { 'C Level Exec': ['#0f172a','#f1f5f9'], 'VP Level Exec': ['#4f46e5','#eef2ff'], 'Director': ['#1d4ed8','#eff6ff'], 'Manager': ['#059669','#f0fdf4'], 'Non Manager': ['#64748b','#f8fafc'] }
  const [c, bg] = colors[level] || ['#64748b','#f8fafc']
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: bg, color: c, border: `1px solid ${c}22` }}>{level}</span>
}

function EmptyState({ icon, text }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 8, color: '#cbd5e1' }}><span style={{ fontSize: 26 }}>{icon}</span><span style={{ fontSize: 13 }}>{text}</span></div>
}

function ContactAvatar({ name, size = 52 }) {
  const parts = (name || '?').split(' ')
  const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  // Color based on first letter
  const colors = ['#4f46e5','#0891b2','#059669','#7c3aed','#db2777','#d97706','#b91c1c']
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.2, background: color, color: '#fff', fontSize: size * 0.32, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '0.02em' }}>
      {initials || '?'}
    </div>
  )
}

export default function ContactDetail({ contact: init, onEnrich, onEdit, onClose, enriching }) {
  const [contact, setContact] = useState(init)
  const [tab, setTab] = useState('overview')
  const [company, setCompany] = useState(null)
  const [deals, setDeals] = useState([])
  const [loadCo, setLoadCo] = useState(false)
  const [loadDe, setLoadDe] = useState(false)

  useEffect(() => {
    if (contact.company_id) loadCompany()
    loadDeals()
  }, [contact.id])

  useEffect(() => {
    if (!enriching) {
      fetch(`/api/contacts/${contact.id}`).then(r => r.ok ? r.json() : null).then(d => { if (d?.id) setContact(d) })
    }
  }, [enriching])

  async function loadCompany() {
    setLoadCo(true)
    try { const r = await fetch(`/api/companies/${contact.company_id}`); const d = await r.json(); if (d?.id) setCompany(d) }
    finally { setLoadCo(false) }
  }

  async function loadDeals() {
    setLoadDe(true)
    try { const r = await fetch(`/api/deals?contact_id=${contact.id}`); const d = await r.json(); setDeals(Array.isArray(d) ? d : []) }
    finally { setLoadDe(false) }
  }

  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()

  const TABS = [
    { key: 'overview',  label: 'Overview' },
    { key: 'company',   label: 'Company' },
    { key: 'deals',     label: 'Deals', count: deals.length },
    { key: 'activity',  label: 'Activity' },
    { key: 'notes',     label: 'Notes' },
    { key: 'ai',        label: 'AI Insights' },
  ]

  return (
    <>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .cttab:hover { color: #374151 !important }
        .ctrow:hover { background: #f8fafc !important }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(1px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 780, zIndex: 201, display: 'flex', flexDirection: 'column', background: '#f8fafc', boxShadow: '-4px 0 48px rgba(0,0,0,0.18)', animation: 'slideIn 0.2s ease-out', fontFamily: '"IBM Plex Sans", sans-serif' }}>

        {/* HEADER */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 20, paddingBottom: 14 }}>
            <ContactAvatar name={fullName} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{fullName || '—'}</h2>
                <SeniorityBadge level={contact.management_level} />
                {contact.enriched && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>✓ Enriched</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                {contact.job_title && <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{contact.job_title}</span>}
                {(contact.company_name) && <span style={{ fontSize: 12, color: '#64748b' }}>@ {contact.company_name}</span>}
                {contact.email && <a href={`mailto:${contact.email}`} style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>✉ {contact.email}</a>}
                {(contact.city || contact.country) && <span style={{ fontSize: 12, color: '#94a3b8' }}>📍 {[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
              <button onClick={() => onEnrich(contact)} disabled={enriching} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#374151', cursor: enriching ? 'default' : 'pointer', opacity: enriching ? 0.6 : 1 }}>
                {enriching ? <Spin /> : <BoltIcon />} {enriching ? 'Enriching…' : 'Enrich'}
              </button>
              <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                <EditIcon /> Edit
              </button>
              <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', color: '#64748b' }}>
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Contact stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
            {[
              { label: 'Email',    value: contact.email ? '✓' : '—',       color: contact.email ? '#059669' : '#94a3b8' },
              { label: 'Phone',    value: contact.phone || contact.mobile_phone ? '✓' : '—', color: (contact.phone || contact.mobile_phone) ? '#059669' : '#94a3b8' },
              { label: 'Deals',    value: deals.length,  color: '#4f46e5' },
              { label: 'ZI ID',    value: contact.zi_contact_id || contact.zi_person_id ? '✓' : '—', color: (contact.zi_contact_id || contact.zi_person_id) ? '#059669' : '#94a3b8' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', padding: '10px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: -1 }}>
            {TABS.map(t => (
              <button key={t.key} className="cttab" onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? '#0f172a' : '#94a3b8', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#0f172a' : 'transparent'}`, marginBottom: -1, cursor: 'pointer', transition: 'color 0.1s', whiteSpace: 'nowrap' }}>
                {t.label}
                {t.count !== undefined && t.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 20, background: tab === t.key ? '#f1f5f9' : '#f8fafc', color: tab === t.key ? '#374151' : '#94a3b8' }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Contact Info */}
              <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '14px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Contact Info</div>
                <PropRow label="First Name"  value={contact.first_name} />
                <PropRow label="Last Name"   value={contact.last_name} />
                <PropRow label="Title"       value={contact.job_title} />
                <PropRow label="Department"  value={contact.department} />
                <PropRow label="Seniority"   value={contact.management_level} />
                <PropRow label="Email"       value={contact.email} email />
                <PropRow label="Phone"       value={contact.phone} mono />
                <PropRow label="Mobile"      value={contact.mobile_phone} mono />
                <PropRow label="LinkedIn"    value={contact.linkedin_url} href={contact.linkedin_url} />
                <PropRow label="ZI Contact"  value={contact.zi_contact_id || contact.zi_person_id} mono />
              </div>

              {/* Company + Location */}
              <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '14px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Company & Location</div>
                <PropRow label="Company"  value={contact.company_name} />
                <PropRow label="City"     value={contact.city} />
                <PropRow label="State"    value={contact.state} />
                <PropRow label="Country"  value={contact.country} />
                <PropRow label="Source"   value={contact.source} />
                <PropRow label="Added"    value={fmtDate(contact.created_at)} />
                {contact.enriched_at && <PropRow label="Enriched" value={fmtDate(contact.enriched_at)} />}

                {/* Company card preview */}
                {(company || loadCo) && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Linked Company</div>
                    {loadCo
                      ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>
                      : company && (
                        <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {company.logo
                              ? <img src={company.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                              : <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>{company.name?.[0]}</span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{company.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{[company.industry, company.employees && `${company.employees} employees`, company.country].filter(Boolean).join(' · ')}</div>
                            {company.website && <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', marginTop: 2, display: 'block' }}>{company.website}</a>}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: company.type === 'customer' ? '#ecfdf5' : '#eef2ff', color: company.type === 'customer' ? '#059669' : '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{company.type || 'prospect'}</span>
                        </div>
                      )
                    }
                  </div>
                )}
              </div>

              {/* Deals preview */}
              <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '14px 18px', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Deals ({deals.length})</span>
                  {deals.length > 3 && <button onClick={() => setTab('deals')} style={{ fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>See all →</button>}
                </div>
                {loadDe ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>
                  : deals.length === 0 ? <EmptyState icon="💰" text="No deals linked to this contact" />
                  : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {deals.slice(0, 4).map(d => (
                        <div key={d.id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                            <StagePill stage={d.stage} />
                          </div>
                          {d.value && <span style={{ fontSize: 13, fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace', color: '#0f172a', flexShrink: 0 }}>{fmtRev(d.value)}</span>}
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}

          {tab === 'company' && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Company Details</div>
              {loadCo ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>
                : !company ? <EmptyState icon="🏢" text="No company linked to this contact" />
                : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #e2e8f0' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {company.logo
                          ? <img src={company.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                          : <span style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>{company.name?.[0]}</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{company.name}</div>
                        {company.website && <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>{company.website}</a>}
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: company.type === 'customer' ? '#ecfdf5' : '#eef2ff', color: company.type === 'customer' ? '#059669' : '#4f46e5', textTransform: 'uppercase' }}>{company.type || 'prospect'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                      <div>
                        <PropRow label="Industry"   value={company.industry} />
                        <PropRow label="Employees"  value={company.employees} mono />
                        <PropRow label="Revenue"    value={fmtRev(company.revenue)} mono />
                        <PropRow label="Founded"    value={company.founded_year} />
                        <PropRow label="Phone"      value={company.phone} mono />
                      </div>
                      <div>
                        <PropRow label="City"     value={company.city} />
                        <PropRow label="State"    value={company.state} />
                        <PropRow label="Country"  value={company.country} />
                        <PropRow label="ZI ID"    value={company.zi_company_id} mono />
                        {company.enriched && <PropRow label="Enriched" value={fmtDate(company.enriched_at)} />}
                      </div>
                    </div>
                    {company.description && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9', fontSize: 12, color: '#475569', lineHeight: 1.65 }}>
                        {company.description.length > 320 ? company.description.slice(0, 320) + '…' : company.description}
                      </div>
                    )}
                  </>
                )
              }
            </div>
          )}

          {tab === 'deals' && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Deals involving {fullName}</span>
              </div>
              {loadDe ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
                : deals.length === 0 ? <EmptyState icon="💰" text="No deals linked to this contact" />
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Deal','Stage','Value','Company','Created'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {deals.map(d => (
                        <tr key={d.id} className="ctrow" style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}>
                          <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.title}</td>
                          <td style={{ padding: '10px 16px' }}><StagePill stage={d.stage} /></td>
                          <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace', color: '#0f172a' }}>{fmtRev(d.value)}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>{d.companies?.name || contact.company_name || '—'}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', fontFamily: '"IBM Plex Mono", monospace' }}>{fmtDate(d.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}

          {tab === 'activity' && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Activity Timeline</div>
              <ActivityTimeline contactId={contact.id} />
            </div>
          )}

          {tab === 'notes' && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Notes</div>
              <Notes contactId={contact.id} />
            </div>
          )}

          {tab === 'ai' && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px 18px' }}>
              <AIInsights contact={contact} company={company || { name: contact.company_name, zi_company_id: contact.zi_company_id }} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
