import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import { Badge, Modal, Toast, Spinner } from '../components/UI'
import ContactForm from '../components/ContactForm'
import CompanyForm from '../components/CompanyForm'
import ContactDetail from '../components/ContactDetail'
import CompanyDetail from '../components/CompanyDetail'
import ImportModal from '../components/ImportModal'
import Pipeline from '../components/Pipeline'
import TAM from '../components/TAM'
import ICPSearch from '../components/ICPSearch'
import Workflows from '../components/Workflows'
import Duplicates from '../components/Duplicates'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Icons ─────────────────────────────────────────────────────────────────
function ContactsIcon()    { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function BuildingIcon()    { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function PipelineIcon()    { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="7" width="6" height="14" rx="1"/><rect x="16" y="11" width="6" height="10" rx="1"/></svg> }
function TargetIcon()      { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> }
function SearchNavIcon()   { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function WorkflowIcon()    { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function DuplicatesIcon()  { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> }
function IntegrationIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="12" y1="14" x2="5" y2="17"/><line x1="12" y1="14" x2="19" y2="17"/></svg> }
function BoltIcon()        { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function UploadIcon()      { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> }
function PlusIcon()        { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function MagnifyIcon()     { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function ZiIcon()          { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function CheckCircleIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function AlertCircleIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function KeyIcon()         { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> }
function RefreshIcon()     { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function TrashIcon()       { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> }

const NAV = [
  { key: 'contacts',     label: 'Contacts',      icon: <ContactsIcon />,   section: 'crm' },
  { key: 'companies',    label: 'Companies',     icon: <BuildingIcon />,   section: 'crm' },
  { key: 'pipeline',     label: 'Pipeline',      icon: <PipelineIcon />,   section: 'crm' },
  { key: 'workflows',    label: 'Workflows',     icon: <WorkflowIcon />,   section: 'gtm' },
  { key: 'tam',          label: 'ICP Profiles',  icon: <TargetIcon />,     section: 'gtm' },
  { key: 'icp',          label: 'ICP Search',    icon: <SearchNavIcon />,  section: 'gtm' },
  { key: 'duplicates',   label: 'Duplicates',    icon: <DuplicatesIcon />, section: 'tools' },
  { key: 'integrations', label: 'Integrations',  icon: <IntegrationIcon />,section: 'tools' },
]

// ── ZI Search Modal ───────────────────────────────────────────────────────
function ZiSearchModal({ defaultType, onClose, onImportContact, onImportCompany }) {
  const [type, setType] = useState(defaultType || 'contacts')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imported, setImported] = useState(new Set())

  async function doSearch() {
    if (!query.trim()) return
    setLoading(true); setError(''); setResults([])
    try {
      const token = localStorage.getItem('zi_token')
      if (!token) { setError('Connect your ZoomInfo API token in Integrations first.'); setLoading(false); return }
      const res = await fetch('/api/zi-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, type, query: query.trim() }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Search failed'); setLoading(false); return }
      setResults(data.results || [])
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleImport(item) {
    const key = item.zoominfoContactId || item.zoominfoCompanyId || item.name
    if (type === 'contacts') await onImportContact(item)
    else await onImportCompany(item)
    setImported(prev => new Set([...prev, key]))
  }

  return (
    <Modal title="Search ZoomInfo" onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            {[['contacts', 'Contacts'], ['companies', 'Companies']].map(([key, label]) => (
              <button key={key} onClick={() => { setType(key); setResults([]); setError('') }}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: type === key ? '#0f172a' : 'transparent', color: type === key ? '#fff' : '#64748b', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          <input style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none', background: '#fafafa', fontFamily: 'inherit' }}
            placeholder={type === 'contacts' ? 'Search by person name...' : 'Search by company name...'}
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
          <button onClick={doSearch} disabled={loading || !query.trim()}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: '#0f172a', color: '#fff', opacity: (loading || !query.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, justifyContent: 'center', padding: '32px 0' }}><Spinner size={16} /> Searching...</div>}
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map((item, i) => {
            const key = item.zoominfoContactId || item.zoominfoCompanyId || item.name
            const isImported = imported.has(key)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fafafa' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {type === 'contacts' ? (item.firstName?.[0] || '?') : (item.name?.[0] || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{type === 'contacts' ? `${item.firstName} ${item.lastName}` : item.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{type === 'contacts' ? `${item.jobTitle || '—'}${item.companyName ? ' · ' + item.companyName : ''}` : `${item.industry || '—'}${item.country ? ' · ' + item.country : ''}`}</div>
                </div>
                <button onClick={() => handleImport(item)} disabled={isImported}
                  style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: 'none', cursor: isImported ? 'default' : 'pointer', background: isImported ? '#f0fdf4' : '#0f172a', color: isImported ? '#059669' : '#fff', flexShrink: 0, fontFamily: 'inherit' }}>
                  {isImported ? '✓ Added' : '+ Add'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

// ── Integrations Page ─────────────────────────────────────────────────────
function IntegrationsPage({ showToast }) {
  const [ziToken, setZiToken] = useState('')
  const [tokenSaved, setTokenSaved] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | 'fail'

  useEffect(() => {
    const saved = localStorage.getItem('zi_token')
    if (saved) { setZiToken(saved); setTokenSaved(true) }
  }, [])

  function saveToken() {
    if (!ziToken.trim()) return
    localStorage.setItem('zi_token', ziToken.trim())
    setTokenSaved(true)
    setTestResult(null)
    showToast('ZoomInfo API token saved', 'success')
  }

  function clearToken() {
    localStorage.removeItem('zi_token')
    setZiToken('')
    setTokenSaved(false)
    setTestResult(null)
    showToast('Token removed', 'info')
  }

  async function testConnection() {
    const token = localStorage.getItem('zi_token')
    if (!token) return
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/zi-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: 'companies', query: 'Salesforce' })
      })
      setTestResult(res.ok ? 'ok' : 'fail')
    } catch { setTestResult('fail') }
    finally { setTesting(false) }
  }

  const INPUT = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.02em' }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>Integrations</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>Connect external data sources to power enrichment, prospecting, and contact intelligence.</p>
      </div>

      {/* ZoomInfo Card */}
      <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        {/* Card header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0a0f1a 0%, #1e3a5f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🔍</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>ZoomInfo</span>
              {tokenSaved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0' }}>
                  <CheckCircleIcon /> Connected
                </span>
              )}
              {!tokenSaved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  <AlertCircleIcon /> Not connected
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Contact & company data enrichment, prospecting search, lookalike discovery</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {tokenSaved && (
              <button onClick={testConnection} disabled={testing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 12, fontWeight: 600, color: '#374151', cursor: testing ? 'default' : 'pointer', opacity: testing ? 0.7 : 1 }}>
                {testing ? <Spinner size={12} /> : <RefreshIcon />} Test
              </button>
            )}
            <button onClick={() => setShowToken(s => !s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#0f172a', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <KeyIcon /> {tokenSaved ? 'Update Token' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div style={{ padding: '10px 24px', background: testResult === 'ok' ? '#f0fdf4' : '#fef2f2', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            {testResult === 'ok'
              ? <><span style={{ color: '#059669' }}><CheckCircleIcon /></span><span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>Connection verified — ZoomInfo API is working correctly.</span></>
              : <><span style={{ color: '#dc2626' }}><AlertCircleIcon /></span><span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>Connection failed — token may be expired. Paste a new one below.</span></>
            }
          </div>
        )}

        {/* Token input panel */}
        {showToken && (
          <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Bearer Token</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showToken ? 'password' : 'text'}
                    value={ziToken}
                    onChange={e => setZiToken(e.target.value)}
                    placeholder="eyJraWQiOiJ..."
                    style={INPUT}
                    onKeyDown={e => e.key === 'Enter' && saveToken()}
                  />
                </div>
                <button onClick={saveToken} disabled={!ziToken.trim()}
                  style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: !ziToken.trim() ? 'default' : 'pointer', opacity: !ziToken.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                  Save Token
                </button>
                {tokenSaved && (
                  <button onClick={clearToken}
                    style={{ padding: '10px 16px', border: '1.5px solid #fecaca', borderRadius: 8, background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <TrashIcon /> Remove
                  </button>
                )}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8' }}>
                Generate a bearer token from the ZoomInfo platform under <strong>Admin → API</strong>. Tokens expire after 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Capabilities list */}
        <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: '👤', title: 'Contact Enrichment', desc: 'Email, phone, title, seniority' },
            { icon: '🏢', title: 'Company Enrichment', desc: 'Revenue, headcount, industry' },
            { icon: '🔍', title: 'Prospecting Search', desc: 'Find contacts & companies' },
            { icon: '🎯', title: 'ICP Targeting', desc: 'Filter by firmographics' },
            { icon: '⚡', title: 'Workflow Automation', desc: 'Run enrichment playbooks' },
            { icon: '🔗', title: 'Lookalike Discovery', desc: 'Find similar accounts' },
          ].map(cap => (
            <div key={cap.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{cap.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{cap.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{cap.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon placeholders */}
      {[
        { name: 'Salesforce', emoji: '☁️', desc: 'Bi-directional contact and opportunity sync' },
        { name: 'HubSpot',    emoji: '🧡', desc: 'Contact and deal pipeline integration' },
        { name: 'Outreach',   emoji: '📧', desc: 'Sequence enrollment and engagement tracking' },
        { name: 'Slack',      emoji: '💬', desc: 'Deal alerts and pipeline notifications' },
      ].map(p => (
        <div key={p.name} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 24px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16, opacity: 0.55 }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: '#f1f5f9', color: '#64748b' }}>Coming soon</span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function Home() {
  const [tab, setTab]               = useState('contacts')
  const [contacts, setContacts]     = useState([])
  const [companies, setCompanies]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [enrichingId, setEnrichingId] = useState(null)
  const [bulkEnriching, setBulkEnriching] = useState(false)
  const [toast, setToast]           = useState(null)
  const [tokenSaved, setTokenSaved] = useState(false)
  const searchTimer = useRef(null)

  const showToast = (msg, type = 'info') => setToast({ msg, type })

  useEffect(() => {
    const saved = localStorage.getItem('zi_token')
    setTokenSaved(!!saved)
    // Listen for token changes (set from Integrations page)
    const onStorage = () => setTokenSaved(!!localStorage.getItem('zi_token'))
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const fetchContacts = useCallback(async (q = '') => {
    const res = await fetch(`/api/contacts${q ? `?search=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json(); setContacts(Array.isArray(data) ? data : [])
  }, [])
  const fetchCompanies = useCallback(async (q = '') => {
    const res = await fetch(`/api/companies${q ? `?search=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json(); setCompanies(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { setLoading(true); Promise.all([fetchContacts(), fetchCompanies()]).finally(() => setLoading(false)) }, [fetchContacts, fetchCompanies])
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      if (tab === 'contacts') fetchContacts(search)
      else if (tab === 'companies') fetchCompanies(search)
    }, 300)
  }, [search, tab, fetchContacts, fetchCompanies])

  const createContact  = async (body) => { await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); fetchContacts(search); setModal(null); showToast('Contact created', 'success') }
  const updateContact  = async (body) => { await fetch(`/api/contacts/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); fetchContacts(search); setModal(null); showToast('Contact updated', 'success') }
  const deleteContact  = async (id) => { if (!confirm('Delete this contact?')) return; await fetch(`/api/contacts/${id}`, { method: 'DELETE' }); fetchContacts(search); showToast('Contact deleted', 'info') }
  const createCompany  = async (body) => { await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); fetchCompanies(search); setModal(null); showToast('Company created', 'success') }
  const updateCompany  = async (body) => { await fetch(`/api/companies/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); fetchCompanies(search); setModal(null); showToast('Company updated', 'success') }
  const deleteCompany  = async (id) => { if (!confirm('Delete this company?')) return; await fetch(`/api/companies/${id}`, { method: 'DELETE' }); fetchCompanies(search); showToast('Company deleted', 'info') }

  const enrichContact = async (c) => {
    const token = localStorage.getItem('zi_token')
    if (!token) { setTab('integrations'); showToast('Connect ZoomInfo in Integrations first', 'error'); return }
    setEnrichingId(c.id)
    const res = await fetch(`/api/contacts/${c.id}/enrich`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    if (res.ok) { fetchContacts(search); showToast(`${c.first_name} enriched!`, 'success') } else { const d = await res.json(); showToast(d.error || 'Enrichment failed', 'error') }
    setEnrichingId(null)
  }
  const enrichCompany = async (co) => {
    const token = localStorage.getItem('zi_token')
    if (!token) { setTab('integrations'); showToast('Connect ZoomInfo in Integrations first', 'error'); return }
    setEnrichingId(co.id)
    const res = await fetch(`/api/companies/${co.id}/enrich`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    if (res.ok) { fetchCompanies(search); showToast(`${co.name} enriched!`, 'success') } else { const d = await res.json(); showToast(d.error || 'Enrichment failed', 'error') }
    setEnrichingId(null)
  }
  const bulkEnrich = async () => {
    const token = localStorage.getItem('zi_token')
    if (!token) { setTab('integrations'); showToast('Connect ZoomInfo in Integrations first', 'error'); return }
    setBulkEnriching(true)
    if (tab === 'contacts') { const u = contacts.filter(c => !c.enriched); showToast(`Enriching ${u.length} contacts…`, 'info'); for (const c of u) await enrichContact(c) }
    else { const u = companies.filter(c => !c.enriched); showToast(`Enriching ${u.length} companies…`, 'info'); for (const co of u) await enrichCompany(co) }
    showToast('Bulk enrichment complete!', 'success'); setBulkEnriching(false)
  }

  const enrichedContacts  = contacts.filter(c => c.enriched).length
  const enrichedCompanies = companies.filter(c => c.enriched).length

  // ── Style helpers ────────────────────────────────────────────────────────
  const S = {
    navItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px',
      margin: '1px 8px', borderRadius: 7, fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? '#fff' : '#64748b', cursor: 'pointer',
      background: active ? '#1e293b' : 'transparent', border: 'none',
      width: 'calc(100% - 16px)', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.1s',
    }),
    btn: (v) => {
      const base = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s', letterSpacing: '-0.01em' }
      if (v === 'primary') return { ...base, background: '#0f172a', color: '#fff', border: 'none' }
      if (v === 'ghost')   return { ...base, background: '#fff', color: '#374151', border: '1px solid #e2e8f0' }
      if (v === 'enrich')  return { ...base, background: '#fff', color: '#374151', border: '1px solid #e2e8f0', fontSize: 11.5, padding: '4px 9px' }
      return base
    },
    th: { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 16px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
    td: { padding: '12px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f8fafc' },
  }

  // ── Grouped nav sections ──────────────────────────────────────────────
  const sections = [
    { label: 'CRM',        keys: ['contacts', 'companies', 'pipeline'] },
    { label: 'GTM',        keys: ['workflows', 'tam', 'icp'] },
    { label: 'Tools',      keys: ['duplicates', 'integrations'] },
  ]

  const tabLabel = NAV.find(n => n.key === tab)?.label || ''

  return (
    <>
      <Head>
        <title>Velo — GTM CRM</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; font-family: 'IBM Plex Sans', sans-serif; }
        .nav-item:hover { background: #111827 !important; color: #e2e8f0 !important; }
        .data-row:hover { background: #f0f9ff !important; cursor: pointer; }
        .btn-ghost:hover { background: #f1f5f9 !important; }
        .btn-primary:hover { background: #1e293b !important; }
        .action-btn:hover { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
        .danger-btn:hover { background: #fef2f2 !important; border-color: #fecaca !important; color: #ef4444 !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── LEFT NAV ──────────────────────────────────────────────── */}
        <nav style={{ width: 216, flexShrink: 0, background: '#0a0f1a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30, borderRight: '1px solid #111827' }}>

          {/* Logo — Velo, no subtitle */}
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #111827' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>Velo</span>
            </div>
          </div>

          {/* Nav sections */}
          <div style={{ flex: 1, paddingTop: 10, overflow: 'auto' }}>
            {sections.map(sec => (
              <div key={sec.label} style={{ marginBottom: 4 }}>
                <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sec.label}</div>
                {NAV.filter(n => sec.keys.includes(n.key)).map(({ key, label, icon }) => (
                  <button key={key} className="nav-item" style={S.navItem(tab === key)} onClick={() => { setTab(key); setSearch('') }}>
                    <span style={{ opacity: tab === key ? 1 : 0.5, flexShrink: 0 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* ZoomInfo connection status — compact pill, no text details */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid #111827' }}>
            <button onClick={() => { setTab('integrations'); setSearch('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 7, background: '#111827', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}
              className="nav-item">
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: tokenSaved ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>ZoomInfo {tokenSaved ? 'connected' : 'disconnected'}</span>
              <svg style={{ marginLeft: 'auto', opacity: 0.4 }} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </nav>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <div style={{ marginLeft: 216, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* TOP BAR */}
          <div style={{ height: 52, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, position: 'sticky', top: 0, zIndex: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.03em' }}>{tabLabel}</span>
            {(tab === 'contacts' || tab === 'companies') && (
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'IBM Plex Mono', background: '#f1f5f9', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>
                {tab === 'contacts' ? contacts.length : companies.length}
              </span>
            )}

            {(tab === 'contacts' || tab === 'companies') && (
              <>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><MagnifyIcon /></span>
                  <input
                    style={{ padding: '6px 12px 6px 30px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12.5, color: '#0f172a', outline: 'none', width: 200, background: '#f8fafc', fontFamily: 'IBM Plex Sans, sans-serif', transition: 'border-color 0.1s' }}
                    placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn-ghost" style={S.btn('ghost')} onClick={() => setModal('ziSearch')}><ZiIcon /> Search ZoomInfo</button>
                {tab === 'contacts' && <button className="btn-ghost" style={S.btn('ghost')} onClick={() => setModal('import')}><UploadIcon /> Import</button>}
                <button className="btn-ghost" style={{ ...S.btn('ghost'), opacity: bulkEnriching ? 0.5 : 1 }} onClick={bulkEnrich} disabled={bulkEnriching}>{bulkEnriching ? <Spinner size={12} /> : <BoltIcon />} Enrich All</button>
                <button className="btn-primary" style={S.btn('primary')} onClick={() => setModal(tab === 'contacts' ? 'addContact' : 'addCompany')}><PlusIcon /> {tab === 'contacts' ? 'Add Contact' : 'Add Company'}</button>
              </>
            )}
          </div>

          <div style={{ padding: 24, flex: 1 }}>

            {/* STATS STRIP */}
            {(tab === 'contacts' || tab === 'companies') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Contacts',      value: contacts.length,  sub: `${enrichedContacts} enriched` },
                  { label: 'Total Companies',      value: companies.length, sub: `${enrichedCompanies} enriched` },
                  { label: 'Contact Coverage',     value: contacts.length  > 0 ? `${Math.round(enrichedContacts  / contacts.length  * 100)}%` : '—', sub: 'data enriched' },
                  { label: 'Company Coverage',     value: companies.length > 0 ? `${Math.round(enrichedCompanies / companies.length * 100)}%` : '—', sub: 'data enriched' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.05em', fontFamily: 'IBM Plex Mono', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ROUTED VIEWS ──────────────────────────────────── */}
            {tab === 'pipeline'     && <Pipeline />}
            {tab === 'workflows'    && <Workflows />}
            {tab === 'duplicates'   && <Duplicates onToast={(msg, type) => showToast(msg, type)} />}
            {tab === 'tam'          && <TAM />}
            {tab === 'integrations' && <IntegrationsPage showToast={showToast} />}
            {tab === 'icp' && (
              <ICPSearch
                onImportContact={async (c) => {
                  await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first_name: c.firstName, last_name: c.lastName, email: c.email, job_title: c.jobTitle, company_name: c.companyName, phone: c.phone, city: c.city, state: c.state, country: c.country, department: c.department, management_level: c.managementLevel, zi_person_id: String(c.zoominfoContactId || ''), zi_contact_id: String(c.zoominfoContactId || ''), zi_company_id: String(c.zoominfoCompanyId || '') }) })
                  fetchContacts(search); showToast(`${c.firstName} ${c.lastName} added!`, 'success')
                }}
                onImportCompany={async (c) => {
                  await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c.name, website: c.website, industry: c.industry, phone: c.phone, city: c.city, country: c.country, zi_company_id: String(c.zoominfoCompanyId || '') }) })
                  fetchCompanies(search); showToast(`${c.name} added!`, 'success')
                }}
              />
            )}

            {/* ── CONTACTS TABLE ──────────────────────────────── */}
            {tab === 'contacts' && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                {loading
                  ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Name', 'Title', 'Company', 'Email', 'Location', 'Status', 'Added', ''].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.length === 0 && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>No contacts yet — add one manually or search ZoomInfo</td></tr>
                        )}
                        {contacts.map(c => (
                          <tr key={c.id} className="data-row" style={{ transition: 'background 0.1s' }} onClick={() => { setSelected(c); setModal('contactDetail') }}>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '0.02em' }}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{c.first_name} {c.last_name}</span>
                              </div>
                            </td>
                            <td style={{ ...S.td, color: '#64748b' }}>{c.job_title || '—'}</td>
                            <td style={{ ...S.td, color: '#475569', fontWeight: 500 }}>{c.company_name || '—'}</td>
                            <td style={{ ...S.td, color: '#2563eb', fontFamily: 'IBM Plex Mono', fontSize: 11.5 }}>{c.email || '—'}</td>
                            <td style={{ ...S.td, color: '#64748b', fontSize: 12 }}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                            <td style={S.td}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: c.enriched ? '#f0fdf4' : '#f8fafc', color: c.enriched ? '#059669' : '#94a3b8', border: `1px solid ${c.enriched ? '#bbf7d0' : '#e2e8f0'}` }}>
                                {c.enriched ? '✓ Enriched' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: '#94a3b8', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{fmtDate(c.created_at)}</td>
                            <td style={S.td} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="action-btn" style={{ ...S.btn('enrich'), opacity: enrichingId === c.id ? 0.5 : 1 }} onClick={() => enrichContact(c)} disabled={enrichingId === c.id}>{enrichingId === c.id ? <Spinner size={10} /> : <BoltIcon />} Enrich</button>
                                <button className="action-btn" onClick={() => { setSelected(c); setModal('editContact') }} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: 12, transition: 'all 0.1s' }}>✎</button>
                                <button className="danger-btn" onClick={() => deleteContact(c.id)} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: 12, transition: 'all 0.1s' }}>✕</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>
            )}

            {/* ── COMPANIES TABLE ──────────────────────────────── */}
            {tab === 'companies' && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                {loading
                  ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Company', 'Industry', 'Website', 'Employees', 'Revenue', 'Status', 'Added', ''].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {companies.length === 0 && (
                          <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>No companies yet — add one manually or search ZoomInfo</td></tr>
                        )}
                        {companies.map(co => (
                          <tr key={co.id} className="data-row" style={{ transition: 'background 0.1s' }} onClick={() => { setSelected(co); setModal('companyDetail') }}>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f0fdf4', color: '#059669', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                  {co.logo ? <img src={co.logo} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} onError={e => e.target.style.display='none'} /> : co.name?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{co.name}</div>
                                  {co.type === 'customer' && <div style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>Customer</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ ...S.td, color: '#64748b', fontSize: 12 }}>{co.industry || '—'}</td>
                            <td style={{ ...S.td, color: '#2563eb', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{co.website || '—'}</td>
                            <td style={{ ...S.td, color: '#475569', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{co.employees || '—'}</td>
                            <td style={{ ...S.td, color: '#475569', fontFamily: 'IBM Plex Mono', fontSize: 12 }}>{co.revenue || '—'}</td>
                            <td style={S.td}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: co.enriched ? '#f0fdf4' : '#f8fafc', color: co.enriched ? '#059669' : '#94a3b8', border: `1px solid ${co.enriched ? '#bbf7d0' : '#e2e8f0'}` }}>
                                {co.enriched ? '✓ Enriched' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ ...S.td, color: '#94a3b8', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{fmtDate(co.created_at)}</td>
                            <td style={S.td} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="action-btn" style={{ ...S.btn('enrich'), opacity: enrichingId === co.id ? 0.5 : 1 }} onClick={() => enrichCompany(co)} disabled={enrichingId === co.id}>{enrichingId === co.id ? <Spinner size={10} /> : <BoltIcon />} Enrich</button>
                                <button className="action-btn" onClick={() => { setSelected(co); setModal('editCompany') }} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: 12, transition: 'all 0.1s' }}>✎</button>
                                <button className="danger-btn" onClick={() => deleteCompany(co.id)} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: 12, transition: 'all 0.1s' }}>✕</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────── */}
      {modal === 'addContact'    && <Modal title="Add Contact"   onClose={() => setModal(null)}><ContactForm onClose={() => setModal(null)} onSave={createContact} /></Modal>}
      {modal === 'editContact'   && selected && <Modal title="Edit Contact"  onClose={() => setModal(null)}><ContactForm initial={selected} onClose={() => setModal(null)} onSave={updateContact} /></Modal>}
      {modal === 'addCompany'    && <Modal title="Add Company"   onClose={() => setModal(null)}><CompanyForm onClose={() => setModal(null)} onSave={createCompany} /></Modal>}
      {modal === 'editCompany'   && selected && <Modal title="Edit Company"  onClose={() => setModal(null)}><CompanyForm initial={selected} onClose={() => setModal(null)} onSave={updateCompany} /></Modal>}
      {modal === 'contactDetail' && selected && <ContactDetail contact={contacts.find(c => c.id === selected.id) || selected} onClose={() => setModal(null)} onEnrich={enrichContact} onEdit={() => setModal('editContact')} enriching={enrichingId === selected.id} />}
      {modal === 'companyDetail' && selected && <CompanyDetail company={companies.find(c => c.id === selected.id) || selected} onClose={() => setModal(null)} onEnrich={enrichCompany} onEdit={() => setModal('editCompany')} enriching={enrichingId === selected.id} onContactOpen={c => { setSelected(c); setModal('contactDetail') }} />}
      {modal === 'import'   && <ImportModal onClose={() => setModal(null)} onImported={(n) => { fetchContacts(search); showToast(`Imported ${n} contacts!`, 'success') }} />}
      {modal === 'ziSearch' && (
        <ZiSearchModal defaultType={tab === 'contacts' ? 'contacts' : 'companies'} onClose={() => setModal(null)}
          onImportContact={async (c) => {
            await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first_name: c.firstName, last_name: c.lastName, email: c.email, job_title: c.jobTitle, company_name: c.companyName, phone: c.phone, city: c.city, state: c.state, country: c.country, department: c.department, management_level: c.managementLevel, zi_person_id: String(c.zoominfoContactId || ''), zi_contact_id: String(c.zoominfoContactId || ''), zi_company_id: String(c.zoominfoCompanyId || '') }) })
            fetchContacts(search); showToast(`${c.firstName} ${c.lastName} added!`, 'success')
          }}
          onImportCompany={async (c) => {
            await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c.name, website: c.website, industry: c.industry, phone: c.phone, city: c.city, country: c.country, zi_company_id: String(c.zoominfoCompanyId || '') }) })
            fetchCompanies(search); showToast(`${c.name} added!`, 'success')
          }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
