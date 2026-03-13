import { useState, useEffect } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────
function MergeIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"/><polyline points="15 3 12 6 9 3"/><line x1="12" y1="6" x2="12" y2="14"/></svg> }
function TrashIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> }
function ScanIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg> }
function ChevronIcon({ open }) { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg> }
function CheckIcon() { return <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> }
function Spin() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg> }

// ── Helpers ────────────────────────────────────────────────────────────────
function normalize(str) { return (str || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '') }
function normalizeDomain(url) {
  if (!url) return ''
  return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].trim()
}
function similarity(a, b) {
  a = normalize(a); b = normalize(b)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.9
  // Simple bigram similarity
  const bigrams = s => { const r = new Set(); for (let i = 0; i < s.length - 1; i++) r.add(s.slice(i, i + 2)); return r }
  const ba = bigrams(a), bb = bigrams(b)
  let intersection = 0
  for (const g of ba) if (bb.has(g)) intersection++
  return (2 * intersection) / (ba.size + bb.size)
}

function findContactDuplicates(contacts) {
  const groups = []
  const used = new Set()
  for (let i = 0; i < contacts.length; i++) {
    if (used.has(i)) continue
    const a = contacts[i]
    const group = [a]
    for (let j = i + 1; j < contacts.length; j++) {
      if (used.has(j)) continue
      const b = contacts[j]
      // Match on: same email, same ZI ID, or very similar name + same company
      const sameEmail = a.email && b.email && normalize(a.email) === normalize(b.email)
      const sameZI = a.zi_contact_id && b.zi_contact_id && String(a.zi_contact_id) === String(b.zi_contact_id)
      const sameName = similarity(`${a.first_name} ${a.last_name}`, `${b.first_name} ${b.last_name}`) >= 0.85
      const sameCompany = normalize(a.company_name) === normalize(b.company_name)
      if (sameEmail || sameZI || (sameName && sameCompany && (a.company_name || b.company_name))) {
        group.push(b)
        used.add(j)
      }
    }
    if (group.length > 1) { used.add(i); groups.push(group) }
  }
  return groups
}

function findCompanyDuplicates(companies) {
  const groups = []
  const used = new Set()
  for (let i = 0; i < companies.length; i++) {
    if (used.has(i)) continue
    const a = companies[i]
    const group = [a]
    for (let j = i + 1; j < companies.length; j++) {
      if (used.has(j)) continue
      const b = companies[j]
      const sameZI = a.zi_company_id && b.zi_company_id && String(a.zi_company_id) === String(b.zi_company_id)
      const sameDomain = a.website && b.website && normalizeDomain(a.website) === normalizeDomain(b.website)
      const sameName = similarity(a.name, b.name) >= 0.88
      if (sameZI || sameDomain || sameName) {
        group.push(b)
        used.add(j)
      }
    }
    if (group.length > 1) { used.add(i); groups.push(group) }
  }
  return groups
}

// Pick the "best" record to keep: prefer enriched, then most fields filled, then newest
function scoredRecord(r, fields) {
  let score = 0
  if (r.enriched) score += 100
  for (const f of fields) if (r[f]) score += 1
  score += new Date(r.created_at || 0).getTime() / 1e13
  return score
}

function bestContact(group) {
  const fields = ['email','phone','job_title','city','country','linkedin_url','zi_contact_id']
  return [...group].sort((a, b) => scoredRecord(b, fields) - scoredRecord(a, fields))[0]
}

function bestCompany(group) {
  const fields = ['website','phone','industry','employees','revenue','city','country','description','logo','zi_company_id']
  return [...group].sort((a, b) => scoredRecord(b, fields) - scoredRecord(a, fields))[0]
}

// Merge two records — keep all non-null fields, prefer primary
function mergeRecords(primary, others) {
  const merged = { ...primary }
  for (const other of others) {
    for (const [k, v] of Object.entries(other)) {
      if (v !== null && v !== undefined && v !== '' && (merged[k] === null || merged[k] === undefined || merged[k] === '')) {
        merged[k] = v
      }
    }
  }
  return merged
}

// ── Row components ─────────────────────────────────────────────────────────
function FieldDiff({ label, values }) {
  const unique = [...new Set(values.filter(Boolean))]
  if (unique.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', width: 80, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {unique.map((v, i) => (
          <span key={i} style={{ fontSize: 11, background: unique.length > 1 ? '#fef3c7' : '#f8fafc', color: unique.length > 1 ? '#92400e' : '#475569', padding: '1px 6px', borderRadius: 5, border: `1px solid ${unique.length > 1 ? '#fcd34d' : '#e2e8f0'}`, fontFamily: '"IBM Plex Mono", monospace' }}>{v}</span>
        ))}
      </div>
    </div>
  )
}

function ContactGroupCard({ group, onMerge, onDelete, merging, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const [keepId, setKeepId] = useState(bestContact(group).id)
  const best = group.find(r => r.id === keepId) || group[0]

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: expanded ? '#fafbfc' : '#fff' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4f46e5', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {best.first_name?.[0]}{best.last_name?.[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{best.first_name} {best.last_name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{best.job_title || '—'} {best.company_name ? `@ ${best.company_name}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 20, border: '1px solid #fecaca', flexShrink: 0 }}>{group.length} duplicates</span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMerge(group, keepId)} disabled={merging}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: merging ? 'default' : 'pointer', opacity: merging ? 0.6 : 1 }}>
            {merging ? <Spin /> : <MergeIcon />} Merge
          </button>
          <button onClick={() => onDelete(group, keepId)} disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? <Spin /> : <TrashIcon />} Delete dupes
          </button>
        </div>
        <ChevronIcon open={expanded} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select record to keep (will merge best data from all)</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.length}, 1fr)`, gap: 8, marginBottom: 12 }}>
            {group.map(r => (
              <div key={r.id} onClick={() => setKeepId(r.id)}
                style={{ padding: '10px 12px', borderRadius: 8, border: `2px solid ${keepId === r.id ? '#4f46e5' : '#e2e8f0'}`, background: keepId === r.id ? '#eef2ff' : '#f8fafc', cursor: 'pointer', position: 'relative', transition: 'all 0.1s' }}>
                {keepId === r.id && <span style={{ position: 'absolute', top: 6, right: 8, width: 16, height: 16, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon /></span>}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{r.first_name} {r.last_name}</div>
                {r.enriched && <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#f0fdf4', padding: '1px 5px', borderRadius: 10, border: '1px solid #bbf7d0' }}>✓ Enriched</span>}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: r.email ? '#0f172a' : '#cbd5e1' }}>{r.email || 'No email'}</div>
                  <div style={{ fontSize: 11, color: r.phone ? '#0f172a' : '#cbd5e1' }}>{r.phone || 'No phone'}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontFamily: '"IBM Plex Mono", monospace' }}>ID: {r.id?.slice(0, 8)}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Field conflicts */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>FIELD COMPARISON</div>
            <FieldDiff label="Email"   values={group.map(r => r.email)} />
            <FieldDiff label="Phone"   values={group.map(r => r.phone)} />
            <FieldDiff label="Title"   values={group.map(r => r.job_title)} />
            <FieldDiff label="Company" values={group.map(r => r.company_name)} />
            <FieldDiff label="ZI ID"   values={group.map(r => r.zi_contact_id || r.zi_person_id)} />
            <FieldDiff label="Source"  values={group.map(r => r.source)} />
          </div>
        </div>
      )}
    </div>
  )
}

function CompanyGroupCard({ group, onMerge, onDelete, merging, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const [keepId, setKeepId] = useState(bestCompany(group).id)
  const best = group.find(r => r.id === keepId) || group[0]

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: expanded ? '#fafbfc' : '#fff' }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {best.logo ? <img src={best.logo} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display='none'} /> : <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{best.name?.[0]}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{best.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{best.industry || '—'}{best.website ? ` · ${best.website}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: 20, border: '1px solid #fecaca', flexShrink: 0 }}>{group.length} duplicates</span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMerge(group, keepId)} disabled={merging}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: merging ? 'default' : 'pointer', opacity: merging ? 0.6 : 1 }}>
            {merging ? <Spin /> : <MergeIcon />} Merge
          </button>
          <button onClick={() => onDelete(group, keepId)} disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? <Spin /> : <TrashIcon />} Delete dupes
          </button>
        </div>
        <ChevronIcon open={expanded} />
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select record to keep (will merge best data from all)</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(group.length, 3)}, 1fr)`, gap: 8, marginBottom: 12 }}>
            {group.map(r => (
              <div key={r.id} onClick={() => setKeepId(r.id)}
                style={{ padding: '10px 12px', borderRadius: 8, border: `2px solid ${keepId === r.id ? '#059669' : '#e2e8f0'}`, background: keepId === r.id ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', position: 'relative', transition: 'all 0.1s' }}>
                {keepId === r.id && <span style={{ position: 'absolute', top: 6, right: 8, width: 16, height: 16, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon /></span>}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{r.name}</div>
                {r.enriched && <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#f0fdf4', padding: '1px 5px', borderRadius: 10, border: '1px solid #bbf7d0' }}>✓ Enriched</span>}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: r.website ? '#0f172a' : '#cbd5e1' }}>{r.website || 'No website'}</div>
                  <div style={{ fontSize: 11, color: r.industry ? '#0f172a' : '#cbd5e1' }}>{r.industry || 'No industry'}</div>
                  <div style={{ fontSize: 11, color: r.zi_company_id ? '#059669' : '#cbd5e1' }}>{r.zi_company_id ? `ZI: ${r.zi_company_id}` : 'No ZI ID'}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontFamily: '"IBM Plex Mono", monospace' }}>ID: {r.id?.slice(0, 8)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>FIELD COMPARISON</div>
            <FieldDiff label="Website"   values={group.map(r => r.website)} />
            <FieldDiff label="Industry"  values={group.map(r => r.industry)} />
            <FieldDiff label="Employees" values={group.map(r => r.employees)} />
            <FieldDiff label="Revenue"   values={group.map(r => r.revenue)} />
            <FieldDiff label="ZI ID"     values={group.map(r => r.zi_company_id)} />
            <FieldDiff label="Type"      values={group.map(r => r.type)} />
            <FieldDiff label="Source"    values={group.map(r => r.source)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Duplicates({ onToast }) {
  const [view, setView] = useState('contacts') // 'contacts' | 'companies'
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [contactGroups, setContactGroups] = useState([])
  const [companyGroups, setCompanyGroups] = useState([])
  const [mergingId, setMergingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [dismissed, setDismissed] = useState(new Set())

  async function scan() {
    setLoading(true)
    setScanned(false)
    try {
      const [cr, cor] = await Promise.all([
        fetch('/api/contacts').then(r => r.json()),
        fetch('/api/companies').then(r => r.json()),
      ])
      const c = Array.isArray(cr) ? cr : []
      const co = Array.isArray(cor) ? cor : []
      setContacts(c)
      setCompanies(co)
      setContactGroups(findContactDuplicates(c))
      setCompanyGroups(findCompanyDuplicates(co))
      setDismissed(new Set())
      setScanned(true)
    } finally { setLoading(false) }
  }

  // Merge: update primary with merged data, delete the rest, re-link their contacts
  async function mergeContacts(group, keepId) {
    const key = group.map(r => r.id).join(',')
    setMergingId(key)
    try {
      const primary = group.find(r => r.id === keepId)
      const others = group.filter(r => r.id !== keepId)
      const merged = mergeRecords(primary, others)

      // Update primary record
      await fetch(`/api/contacts/${keepId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged)
      })

      // Delete the duplicates
      for (const r of others) {
        await fetch(`/api/contacts/${r.id}`, { method: 'DELETE' })
      }

      onToast?.(`Merged ${group.length} contacts → kept ${primary.first_name} ${primary.last_name}`, 'success')
      setContactGroups(g => g.filter(grp => !grp.some(r => r.id === keepId)))
      await scan()
    } catch (e) {
      onToast?.('Merge failed: ' + e.message, 'error')
    } finally { setMergingId(null) }
  }

  async function deleteContactDupes(group, keepId) {
    const key = group.map(r => r.id).join(',')
    setDeletingId(key)
    try {
      const others = group.filter(r => r.id !== keepId)
      for (const r of others) {
        await fetch(`/api/contacts/${r.id}`, { method: 'DELETE' })
      }
      onToast?.(`Deleted ${others.length} duplicate contact${others.length > 1 ? 's' : ''}`, 'info')
      await scan()
    } catch (e) {
      onToast?.('Delete failed: ' + e.message, 'error')
    } finally { setDeletingId(null) }
  }

  async function mergeCompanies(group, keepId) {
    const key = group.map(r => r.id).join(',')
    setMergingId(key)
    try {
      const primary = group.find(r => r.id === keepId)
      const others = group.filter(r => r.id !== keepId)
      const merged = mergeRecords(primary, others)

      // Update primary
      await fetch(`/api/companies/${keepId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged)
      })

      // Re-link contacts that pointed to deleted companies
      for (const r of others) {
        // Update any contacts that reference this company
        const contactsRes = await fetch(`/api/contacts?company_id=${r.id}`)
        const linkedContacts = await contactsRes.json()
        if (Array.isArray(linkedContacts)) {
          for (const c of linkedContacts) {
            await fetch(`/api/contacts/${c.id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ company_id: keepId, company_name: merged.name })
            })
          }
        }
        await fetch(`/api/companies/${r.id}`, { method: 'DELETE' })
      }

      onToast?.(`Merged ${group.length} companies → kept ${primary.name}`, 'success')
      await scan()
    } catch (e) {
      onToast?.('Merge failed: ' + e.message, 'error')
    } finally { setMergingId(null) }
  }

  async function deleteCompanyDupes(group, keepId) {
    const key = group.map(r => r.id).join(',')
    setDeletingId(key)
    try {
      const others = group.filter(r => r.id !== keepId)
      for (const r of others) {
        await fetch(`/api/companies/${r.id}`, { method: 'DELETE' })
      }
      onToast?.(`Deleted ${others.length} duplicate compan${others.length > 1 ? 'ies' : 'y'}`, 'info')
      await scan()
    } catch (e) {
      onToast?.('Delete failed: ' + e.message, 'error')
    } finally { setDeletingId(null) }
  }

  async function mergeAllContacts() {
    if (!confirm(`Merge all ${contactGroups.length} contact duplicate groups automatically? This will keep the best record in each group.`)) return
    for (const group of contactGroups) {
      await mergeContacts(group, bestContact(group).id)
    }
  }

  async function mergeAllCompanies() {
    if (!confirm(`Merge all ${companyGroups.length} company duplicate groups automatically? This will keep the best record in each group.`)) return
    for (const group of companyGroups) {
      await mergeCompanies(group, bestCompany(group).id)
    }
  }

  const visibleContactGroups = contactGroups.filter(g => !dismissed.has(g.map(r => r.id).join(',')))
  const visibleCompanyGroups = companyGroups.filter(g => !dismissed.has(g.map(r => r.id).join(',')))

  return (
    <div style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Duplicate Manager</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Find and merge duplicate contacts and companies in your CRM</p>
        </div>
        <button onClick={scan} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? <Spin /> : <ScanIcon />} {loading ? 'Scanning…' : scanned ? 'Re-scan' : 'Scan for Duplicates'}
        </button>
      </div>

      {/* Pre-scan state */}
      {!scanned && !loading && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Find duplicate records</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Scans your contacts and companies for duplicates by matching on name, email, website, and ZoomInfo IDs
          </div>
          <button onClick={scan}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <ScanIcon /> Scan Now
          </button>
        </div>
      )}

      {loading && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
          <Spin /> <span style={{ marginLeft: 8, fontSize: 14 }}>Scanning {contacts.length + companies.length} records…</span>
        </div>
      )}

      {scanned && !loading && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Contacts', value: contacts.length, color: '#4f46e5' },
              { label: 'Contact Duplicates', value: visibleContactGroups.reduce((s, g) => s + g.length - 1, 0), color: '#dc2626' },
              { label: 'Total Companies', value: companies.length, color: '#059669' },
              { label: 'Company Duplicates', value: visibleCompanyGroups.reduce((s, g) => s + g.length - 1, 0), color: '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
            {[
              { key: 'contacts', label: `Contacts (${visibleContactGroups.length} groups)` },
              { key: 'companies', label: `Companies (${visibleCompanyGroups.length} groups)` },
            ].map(t => (
              <button key={t.key} onClick={() => setView(t.key)}
                style={{ padding: '10px 18px', fontSize: 13, fontWeight: view === t.key ? 700 : 500, color: view === t.key ? '#0f172a' : '#94a3b8', background: 'none', border: 'none', borderBottom: `2px solid ${view === t.key ? '#0f172a' : 'transparent'}`, marginBottom: -1, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Contact duplicates */}
          {view === 'contacts' && (
            <>
              {visibleContactGroups.length === 0
                ? <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '48px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No contact duplicates found</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Your contact list looks clean!</div>
                  </div>
                : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{visibleContactGroups.length} duplicate group{visibleContactGroups.length !== 1 ? 's' : ''} found</span>
                      <button onClick={mergeAllContacts} disabled={!!mergingId}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: mergingId ? 'default' : 'pointer', opacity: mergingId ? 0.6 : 1 }}>
                        <MergeIcon /> Merge All Automatically
                      </button>
                    </div>
                    {visibleContactGroups.map(group => {
                      const key = group.map(r => r.id).join(',')
                      return (
                        <ContactGroupCard key={key} group={group}
                          onMerge={mergeContacts} onDelete={deleteContactDupes}
                          merging={mergingId === key} deleting={deletingId === key} />
                      )
                    })}
                  </>
                )
              }
            </>
          )}

          {/* Company duplicates */}
          {view === 'companies' && (
            <>
              {visibleCompanyGroups.length === 0
                ? <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '48px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No company duplicates found</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Your company list looks clean!</div>
                  </div>
                : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{visibleCompanyGroups.length} duplicate group{visibleCompanyGroups.length !== 1 ? 's' : ''} found</span>
                      <button onClick={mergeAllCompanies} disabled={!!mergingId}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: mergingId ? 'default' : 'pointer', opacity: mergingId ? 0.6 : 1 }}>
                        <MergeIcon /> Merge All Automatically
                      </button>
                    </div>
                    {visibleCompanyGroups.map(group => {
                      const key = group.map(r => r.id).join(',')
                      return (
                        <CompanyGroupCard key={key} group={group}
                          onMerge={mergeCompanies} onDelete={deleteCompanyDupes}
                          merging={mergingId === key} deleting={deletingId === key} />
                      )
                    })}
                  </>
                )
              }
            </>
          )}
        </>
      )}
    </div>
  )
}
