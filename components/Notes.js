import { useState, useEffect, useCallback } from 'react'
import { Spinner, textareaCls } from './UI'

const NOTE_TYPES = [
  { value: 'note', label: '📝 Note', color: '#6366f1' },
  { value: 'call', label: '📞 Call', color: '#0891b2' },
  { value: 'email', label: '✉️ Email', color: '#059669' },
  { value: 'meeting', label: '🤝 Meeting', color: '#d97706' },
]

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Notes({ contactId, companyId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [type, setType] = useState('note')
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const params = contactId ? `contact_id=${contactId}` : `company_id=${companyId}`
    const res = await fetch(`/api/notes?${params}`)
    const data = await res.json()
    setNotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [contactId, companyId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const addNote = async () => {
    if (!content.trim()) return
    setSaving(true)
    const body = { content, type }
    if (contactId) body.contact_id = contactId
    if (companyId) body.company_id = companyId
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setContent('')
      fetchNotes()
    }
    setSaving(false)
  }

  const deleteNote = async (id) => {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-3">Activity & Notes</h3>

      {/* Add note */}
      <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex gap-2 mb-2">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: type === t.value ? t.color : '#f1f5f9',
                color: type === t.value ? '#fff' : '#64748b',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          className={textareaCls}
          rows={3}
          placeholder="Add a note, log a call, or record a meeting…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={addNote}
            disabled={saving || !content.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
            style={{ background: '#4f46e5' }}
          >
            {saving ? <Spinner size={14} /> : null}
            Save
          </button>
        </div>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No activity yet. Add a note above.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const t = NOTE_TYPES.find((x) => x.value === n.type) || NOTE_TYPES[0]
            return (
              <div key={n.id} className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5" style={{ background: t.color + '18' }}>
                  {t.label.split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: t.color }}>{t.label.split(' ').slice(1).join(' ')}</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                  <div className="text-xs text-slate-400 mt-1">{fmtDate(n.created_at)}</div>
                </div>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 text-xs px-2 flex-shrink-0 transition-opacity"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
