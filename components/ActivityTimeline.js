import { useState, useEffect } from 'react'
import { Spinner } from './UI'

const TYPES = [
  { key: 'call', label: 'Call', icon: '📞', color: '#10b981' },
  { key: 'email', label: 'Email', icon: '📧', color: '#3b82f6' },
  { key: 'meeting', label: 'Meeting', icon: '🤝', color: '#8b5cf6' },
  { key: 'note', label: 'Note', icon: '📝', color: '#f59e0b' },
  { key: 'task', label: 'Task', icon: '✅', color: '#6366f1' },
]

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityTimeline({ contactId, companyId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'call', title: '', description: '', outcome: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (contactId) params.set('contact_id', contactId)
    if (companyId) params.set('company_id', companyId)
    const data = await fetch(`/api/activities?${params}`).then(r => r.json())
    setActivities(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [contactId, companyId])

  async function addActivity() {
    setSaving(true)
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        contact_id: contactId || null,
        company_id: companyId || null,
        completed_at: new Date().toISOString(),
      }),
    })
    setForm({ type: 'call', title: '', description: '', outcome: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteActivity(id) {
    await fetch(`/api/activities/${id}`, { method: 'DELETE' })
    load()
  }

  const typeInfo = (key) => TYPES.find(t => t.key === key) || TYPES[3]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-slate-700">Activity Timeline</div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg,#818cf8,#4f46e5)' }}>
          + Log Activity
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3 border border-slate-100">
          <div className="flex gap-1 flex-wrap">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                style={{
                  background: form.type === t.key ? t.color : '#fff',
                  color: form.type === t.key ? '#fff' : '#64748b',
                  borderColor: form.type === t.key ? t.color : '#e2e8f0',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            placeholder="Description / notes..." rows={2}
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Outcome (e.g. 'Agreed to demo', 'No answer')"
            value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={addActivity} disabled={saving || !form.title}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: '#4f46e5' }}>
              {saving ? 'Saving…' : 'Log Activity'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center"><Spinner size={14} /></div>
      ) : activities.length === 0 ? (
        <div className="text-slate-400 text-sm text-center py-6">No activities yet. Log a call, email, or meeting.</div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100" />
          <div className="space-y-3">
            {activities.map(a => {
              const t = typeInfo(a.type)
              return (
                <div key={a.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10 border-2 border-white"
                    style={{ background: `${t.color}20` }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
                        <span className="text-xs text-slate-400 ml-2">{fmtDate(a.created_at)}</span>
                      </div>
                      <button onClick={() => deleteActivity(a.id)}
                        className="text-xs text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">{a.title}</div>
                    {a.description && <div className="text-xs text-slate-500 mt-1">{a.description}</div>}
                    {a.outcome && (
                      <div className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block font-medium" style={{ background: `${t.color}15`, color: t.color }}>
                        {a.outcome}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
