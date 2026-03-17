import { useState, useEffect } from 'react'
import { Spinner } from './UI'

const MANAGEMENT_LEVEL_MAP = {
  'C-Level':                'C Level Exec',
  'VP':                     'VP Level Exec',
  'Director':               'Director',
  'Manager':                'Manager',
  'Individual Contributor': 'Non Manager',
  'Board Member':           'Board Member',
}

export default function ICPSearch({ onImportContact, onImportCompany }) {
  const [profiles, setProfiles] = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [searchType, setSearchType] = useState('contacts')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [error, setError] = useState('')
  const [imported, setImported] = useState(new Set())
  const [total, setTotal] = useState(0)
  const [intentScores, setIntentScores] = useState({}) // ziCompanyId -> { score, topics }
  const [customFilters, setCustomFilters] = useState({
    jobTitle: '', companyName: '', country: '', employeeRangeMin: '', employeeRangeMax: '',
  })

  useEffect(() => {
    fetch('/api/tam')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setProfiles(list)
        if (list.length > 0) setSelectedProfile(list[0])
        setLoadingProfiles(false)
      })
      .catch(() => setLoadingProfiles(false))
  }, [])

  async function fetchIntentForResults(ziIds, topics, token) {
    const scores = {}
    await Promise.all(ziIds.slice(0, 10).map(async ziId => {
      try {
        const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
        const res = await fetch('https://api.zoominfo.com/gtm/data/v1/intent/enrich', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${cleanToken}`,
          },
          body: JSON.stringify({
            data: {
              type: 'IntentEnrich',
              attributes: { companyId: String(ziId), topics },
            },
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const item = data?.data?.[0]
          if (item?.attributes?.score > 0) {
            scores[String(ziId)] = {
              score: item.attributes.score,
              topics: Array.isArray(item.attributes.topics) ? item.attributes.topics.slice(0, 2) : [],
            }
          }
        }
      } catch {}
    }))
    setIntentScores(scores)
  }

  async function search() {
    if (!selectedProfile) { setError('Please select an ICP profile first.'); return }
    setLoading(true)
    setError('')
    setResults([])
    const token = localStorage.getItem('zi_token')
    if (!token) { setError('Set your ZoomInfo token first (click the token button in the header).'); setLoading(false); return }

    const tam = selectedProfile
    const filters = {}

    if (searchType === 'contacts') {
      if (customFilters.jobTitle) {
        filters.jobTitle = customFilters.jobTitle
      } else if (tam?.job_titles?.length > 0) {
        filters.jobTitle = tam.job_titles.join(' OR ')
      }
      if (customFilters.companyName) filters.companyName = customFilters.companyName

      if (tam?.seniority_levels?.length > 0) {
        const mapped = tam.seniority_levels.map(s => MANAGEMENT_LEVEL_MAP[s]).filter(Boolean)
        if (mapped.length > 0) filters.managementLevel = mapped.join(',')
      }
    }

    if (customFilters.country) {
      filters.country = customFilters.country
    } else if (tam?.countries?.length > 0) {
      filters.country = tam.countries[0]
    }

    if (customFilters.employeeRangeMin) {
      filters.employeeRangeMin = customFilters.employeeRangeMin
    } else if (tam?.employee_min) {
      filters.employeeRangeMin = String(tam.employee_min)
    }

    if (customFilters.employeeRangeMax) {
      filters.employeeRangeMax = customFilters.employeeRangeMax
    } else if (tam?.employee_max) {
      filters.employeeRangeMax = String(tam.employee_max)
    }

    if (tam?.industries?.length > 0) {
      filters.industryKeywords = tam.industries.join(' OR ')
    }

    try {
      const res = await fetch('/api/zi-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: searchType, query: '', filters }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Search failed'); setLoading(false); return }
      const newResults = data.results || []
      setResults(newResults)

      // Fetch intent signals for company results if profile has topics
      if (searchType === 'companies' && selectedProfile?.intent_topics) {
        const topics = selectedProfile.intent_topics.split(',').map(t => t.trim()).filter(Boolean)
        const ziIds = newResults.map(r => r.zoominfoCompanyId).filter(Boolean)
        if (topics.length && ziIds.length) {
          fetchIntentForResults(ziIds, topics, token)
        }
      }
      setTotal(data.total || 0)
      setImported(new Set())
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleImport(item) {
    const key = item.zoominfoContactId || item.zoominfoCompanyId
    if (searchType === 'contacts') {
      await onImportContact(item)
    } else {
      await onImportCompany(item)
      // Save intent signal to cache if available
      const ziId = String(item.zoominfoCompanyId || '')
      const sig = intentScores[ziId]
      if (sig && ziId) {
        try {
          const token = localStorage.getItem('zi_token')
          await fetch('/api/signals/cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              zi_company_id: ziId,
              company_name: item.name,
              intent_score: sig.score,
              intent_topics: sig.topics,
              strength: sig.score >= 70 ? 'high' : sig.score >= 40 ? 'med' : 'low',
            }),
          })
        } catch {}
      }
    }
    setImported(prev => new Set([...prev, key]))
  }

  if (loadingProfiles) return <div className="flex items-center justify-center h-40"><Spinner /></div>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900">ICP Search</h2>
        <p className="text-sm text-slate-500 mt-0.5">Find contacts and companies from ZoomInfo that match your Ideal Customer Profile</p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-700">
          ⚠️ No ICP profiles yet. Go to the <strong>TAM</strong> tab to create your first profile.
        </div>
      ) : (
        <>
          {/* Profile picker */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select ICP Profile</div>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => {
                const isActive = selectedProfile?.id === p.id
                return (
                  <button key={p.id}
                    onClick={() => { setSelectedProfile(p); setResults([]); setError('') }}
                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg,#818cf8,#4f46e5)' : '#f8fafc',
                      color: isActive ? '#fff' : '#475569',
                      borderColor: isActive ? '#4f46e5' : '#e2e8f0',
                    }}>
                    🎯 {p.name}
                  </button>
                )
              })}
            </div>

            {/* Active profile summary */}
            {selectedProfile && (
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-wrap gap-2">
                {selectedProfile.industries?.map(i => <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-lg font-medium">{i}</span>)}
                {selectedProfile.countries?.map(c => <span key={c} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-lg font-medium">📍 {c}</span>)}
                {selectedProfile.job_titles?.map(t => <span key={t} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-lg font-medium">👤 {t}</span>)}
                {selectedProfile.seniority_levels?.map(s => <span key={s} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-lg font-medium">⭐ {MANAGEMENT_LEVEL_MAP[s] || s}</span>)}
                {selectedProfile.employee_min && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg font-medium">👥 {selectedProfile.employee_min}–{selectedProfile.employee_max || '∞'}</span>}
              </div>
            )}
          </div>

          {/* Search controls */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <div className="flex gap-2 mb-4">
              {[['contacts', '👤 Find Contacts'], ['companies', '🏢 Find Companies']].map(([key, label]) => (
                <button key={key} onClick={() => { setSearchType(key); setResults([]); setError('') }}
                  className="px-5 py-2 rounded-xl text-sm font-bold border transition-all"
                  style={{
                    background: searchType === key ? '#4f46e5' : '#f8fafc',
                    color: searchType === key ? '#fff' : '#64748b',
                    borderColor: searchType === key ? '#4f46e5' : '#e2e8f0',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Override ICP filters (optional)</div>
            <div className="grid grid-cols-2 gap-3">
              {searchType === 'contacts' && (
                <input className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Job title (e.g. VP of Sales)"
                  value={customFilters.jobTitle}
                  onChange={e => setCustomFilters(f => ({ ...f, jobTitle: e.target.value }))} />
              )}
              {searchType === 'contacts' && (
                <input className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Company name"
                  value={customFilters.companyName}
                  onChange={e => setCustomFilters(f => ({ ...f, companyName: e.target.value }))} />
              )}
              <input className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Country (e.g. United States)"
                value={customFilters.country}
                onChange={e => setCustomFilters(f => ({ ...f, country: e.target.value }))} />
              <div className="flex gap-2">
                <input className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Min employees"
                  value={customFilters.employeeRangeMin}
                  onChange={e => setCustomFilters(f => ({ ...f, employeeRangeMin: e.target.value }))} />
                <input className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Max employees"
                  value={customFilters.employeeRangeMax}
                  onChange={e => setCustomFilters(f => ({ ...f, employeeRangeMax: e.target.value }))} />
              </div>
            </div>

            <button onClick={search} disabled={loading || !selectedProfile}
              className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#818cf8,#4f46e5)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><Spinner size={14} /> Searching ZoomInfo…</span>
                : `🔍 Search ${searchType === 'contacts' ? 'Contacts' : 'Companies'} using "${selectedProfile?.name || ''}"`}
            </button>
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-3 mb-4">{error}</div>}

          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-slate-700">
                  {results.length} results {total > results.length ? `(of ${total.toLocaleString()} total in ZoomInfo)` : ''}
                </div>
                <div className="text-xs text-slate-400">{imported.size} added to CRM</div>
              </div>
              <div className="space-y-2">
                {results.map((item, i) => {
                  const key = item.zoominfoContactId || item.zoominfoCompanyId
                  const isImported = imported.has(key)
                  return (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ background: searchType === 'contacts' ? 'linear-gradient(135deg,#818cf8,#4f46e5)' : 'linear-gradient(135deg,#34d399,#059669)' }}>
                        {searchType === 'contacts' ? (item.firstName?.[0] || '?') : (item.name?.[0] || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        {searchType === 'contacts' ? (
                          <>
                            <div className="text-sm font-bold text-slate-800">{item.firstName} {item.lastName}</div>
                            <div className="text-xs text-slate-500">{item.jobTitle || '—'}{item.companyName ? ` · ${item.companyName}` : ''}</div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {item.managementLevel && <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{item.managementLevel}</span>}
                              {item.accuracyScore && <span className="text-xs text-green-600 font-medium">⚡ {item.accuracyScore}% match</span>}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              {item.name}
                              {intentScores[String(item.zoominfoCompanyId)]?.score > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    background: intentScores[String(item.zoominfoCompanyId)].score >= 70 ? '#fef2f2' : intentScores[String(item.zoominfoCompanyId)].score >= 40 ? '#fffbeb' : '#f0fdf4',
                                    color: intentScores[String(item.zoominfoCompanyId)].score >= 70 ? '#991b1b' : intentScores[String(item.zoominfoCompanyId)].score >= 40 ? '#92400e' : '#166534',
                                  }}>
                                  ⚡ Intent {intentScores[String(item.zoominfoCompanyId)].score}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{item.industry || '—'}{item.country ? ` · ${item.country}` : ''}</div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {item.website && <span className="text-xs text-slate-400">🌐 {item.website}</span>}
                              {item.employeeCount && <span className="text-xs text-slate-400">👥 {Number(item.employeeCount).toLocaleString()} employees</span>}
                              {intentScores[String(item.zoominfoCompanyId)]?.topics?.length > 0 && (
                                <span className="text-xs text-indigo-500 font-medium">{intentScores[String(item.zoominfoCompanyId)].topics.join(', ')}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => handleImport(item)} disabled={isImported}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0"
                        style={{
                          background: isImported ? '#f1f5f9' : 'linear-gradient(135deg,#818cf8,#4f46e5)',
                          color: isImported ? '#94a3b8' : '#fff',
                        }}>
                        {isImported ? '✓ Added' : '+ Add to CRM'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
