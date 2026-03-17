import { useState, useEffect } from 'react'
import { Spinner } from './UI'

const INDUSTRIES = ['Software', 'Financial Services', 'Healthcare', 'Manufacturing', 'Retail', 'Professional Services', 'Technology', 'Media', 'Education', 'Government', 'Real Estate', 'Energy']
const SENIORITIES = ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor']
const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Singapore']
const EMP_RANGES = [{ label: '1-50', min: 1, max: 50 }, { label: '51-200', min: 51, max: 200 }, { label: '201-500', min: 201, max: 500 }, { label: '501-1000', min: 501, max: 1000 }, { label: '1001-5000', min: 1001, max: 5000 }, { label: '5000+', min: 5000, max: 999999 }]

const EMPTY = { name: '', industries: [], countries: [], seniority_levels: [], job_titles: [], employee_min: null, employee_max: null, notes: '', intent_topics: '' }

function Tag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
      {label}
      <button onClick={onRemove} className="text-indigo-400 hover:text-indigo-700 ml-0.5">×</button>
    </span>
  )
}

function TagInput({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const available = options.filter(o => !selected.includes(o))
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selected.map(s => <Tag key={s} label={s} onRemove={() => onChange(selected.filter(x => x !== s))} />)}
        {selected.length === 0 && <span className="text-xs text-slate-300">None selected</span>}
      </div>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="text-xs text-indigo-600 hover:underline">+ Add {label}</button>
        {open && available.length > 0 && (
          <div className="absolute top-5 left-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-2 w-52 max-h-48 overflow-y-auto">
            {available.map(o => (
              <button key={o} onClick={() => { onChange([...selected, o]); setOpen(false) }}
                className="block w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700">
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TAM() {
  const [profiles, setProfiles] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [jobInput, setJobInput] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    setLoading(true)
    const res = await fetch('/api/tam')
    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    setProfiles(list)
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0].id)
      setForm(list[0])
    } else if (list.length === 0) {
      setIsNew(true)
      setForm({ ...EMPTY, name: 'My ICP' })
    }
    setLoading(false)
  }

  function selectProfile(profile) {
    setSelectedId(profile.id)
    setForm(profile)
    setIsNew(false)
    setJobInput('')
  }

  function startNew() {
    setSelectedId(null)
    setForm({ ...EMPTY, name: '' })
    setIsNew(true)
    setJobInput('')
  }

  async function save() {
    if (!form.name?.trim()) return
    setSaving(true)
    if (isNew) {
      const res = await fetch('/api/tam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const created = await res.json()
      setProfiles(prev => [...prev, created])
      setSelectedId(created.id)
      setIsNew(false)
    } else {
      const res = await fetch(`/api/tam/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const updated = await res.json()
      setProfiles(prev => prev.map(p => p.id === selectedId ? updated : p))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function deleteProfile() {
    if (!selectedId || !confirm(`Delete "${form.name}"?`)) return
    setDeleting(true)
    await fetch(`/api/tam/${selectedId}`, { method: 'DELETE' })
    const remaining = profiles.filter(p => p.id !== selectedId)
    setProfiles(remaining)
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id)
      setForm(remaining[0])
      setIsNew(false)
    } else {
      setSelectedId(null)
      setForm({ ...EMPTY, name: 'My ICP' })
      setIsNew(true)
    }
    setDeleting(false)
  }

  function setEmp(label) {
    const r = EMP_RANGES.find(e => e.label === label)
    if (r) setForm(s => ({ ...s, employee_min: r.min, employee_max: r.max }))
    else setForm(s => ({ ...s, employee_min: null, employee_max: null }))
  }

  function addJobTitle() {
    if (!jobInput.trim()) return
    setForm(s => ({ ...s, job_titles: [...(s.job_titles || []), jobInput.trim()] }))
    setJobInput('')
  }

  const currentEmpLabel = EMP_RANGES.find(r => r.min === form.employee_min && r.max === form.employee_max)?.label || ''

  if (loading) return <div className="flex items-center justify-center h-40"><Spinner /></div>

  return (
    <div className="flex gap-6">
      {/* Left sidebar — profile list */}
      <div className="w-56 flex-shrink-0">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">ICP Profiles</div>
        <div className="space-y-1 mb-3">
          {profiles.map(p => (
            <button key={p.id} onClick={() => selectProfile(p)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: selectedId === p.id && !isNew ? 'linear-gradient(135deg,#818cf8,#4f46e5)' : '#f8fafc',
                color: selectedId === p.id && !isNew ? '#fff' : '#475569',
                fontWeight: selectedId === p.id && !isNew ? 700 : 500,
              }}>
              <div className="truncate">{p.name || 'Untitled'}</div>
              <div className="text-xs opacity-70 truncate mt-0.5">
                {[p.industries?.slice(0,2).join(', ')].filter(Boolean).join(' · ') || 'No industries'}
              </div>
            </button>
          ))}
        </div>
        <button onClick={startNew}
          className="w-full py-2 rounded-xl text-xs font-bold border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 transition-all"
          style={{ background: isNew ? '#eef2ff' : 'transparent' }}>
          + New Profile
        </button>
      </div>

      {/* Right — editor */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {isNew ? 'New ICP Profile' : (form.name || 'Edit Profile')}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Define your Ideal Customer Profile to power ZoomInfo search</p>
          </div>
          <div className="flex gap-2">
            {!isNew && (
              <button onClick={deleteProfile} disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50">
                {deleting ? <Spinner size={12} /> : '🗑 Delete'}
              </button>
            )}
            <button onClick={save} disabled={saving || !form.name?.trim()}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#818cf8,#4f46e5)' }}>
              {saving ? <Spinner size={14} /> : saved ? '✓ Saved!' : isNew ? '+ Create Profile' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Profile Name</label>
            <input value={form.name || ''} onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Enterprise SaaS, Mid-Market Finance, SMB Healthcare..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <TagInput label="Target Industries" options={INDUSTRIES}
              selected={form.industries || []}
              onChange={v => setForm(s => ({ ...s, industries: v }))} />
            <TagInput label="Target Countries" options={COUNTRIES}
              selected={form.countries || []}
              onChange={v => setForm(s => ({ ...s, countries: v }))} />
            <TagInput label="Seniority Levels" options={SENIORITIES}
              selected={form.seniority_levels || []}
              onChange={v => setForm(s => ({ ...s, seniority_levels: v }))} />

            {/* Job titles */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Job Titles</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(form.job_titles || []).map(t => (
                  <Tag key={t} label={t} onRemove={() => setForm(s => ({ ...s, job_titles: s.job_titles.filter(x => x !== t) }))} />
                ))}
                {(!form.job_titles || form.job_titles.length === 0) && <span className="text-xs text-slate-300">None added</span>}
              </div>
              <div className="flex gap-2">
                <input value={jobInput} onChange={e => setJobInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addJobTitle()}
                  placeholder="e.g. VP of Sales"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-300" />
                <button onClick={addJobTitle} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100">Add</button>
              </div>
            </div>
          </div>

          {/* Employee range */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Company Size</div>
            <div className="flex flex-wrap gap-2">
              {EMP_RANGES.map(r => (
                <button key={r.label} onClick={() => setEmp(currentEmpLabel === r.label ? '' : r.label)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    background: currentEmpLabel === r.label ? '#4f46e5' : '#f8fafc',
                    color: currentEmpLabel === r.label ? '#fff' : '#64748b',
                    borderColor: currentEmpLabel === r.label ? '#4f46e5' : '#e2e8f0',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Intent Topics */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Intent Topics</label>
            <input value={form.intent_topics || ''} onChange={e => setForm(s => ({ ...s, intent_topics: e.target.value }))}
              placeholder="e.g. CRM software, Sales automation, Lead generation"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
            <p className="text-xs text-slate-400 mt-1.5">Comma-separated. When you search companies with this profile, ZoomInfo intent signals will appear for each result.</p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
              rows={2} placeholder="Any extra context about this ICP..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
