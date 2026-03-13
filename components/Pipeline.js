import { useState, useEffect } from 'react'
import { Modal, Spinner } from './UI'

const STAGES = [
  { key: 'prospecting',   label: 'Prospecting',   color: '#6366f1', bg: '#eef2ff' },
  { key: 'qualified',     label: 'Qualified',      color: '#f59e0b', bg: '#fffbeb' },
  { key: 'proposal',      label: 'Proposal',       color: '#3b82f6', bg: '#eff6ff' },
  { key: 'negotiation',   label: 'Negotiation',    color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'closed_won',    label: 'Closed Won',     color: '#10b981', bg: '#ecfdf5' },
  { key: 'closed_lost',   label: 'Closed Lost',    color: '#ef4444', bg: '#fef2f2' },
]

const PROB = { prospecting: 10, qualified: 30, proposal: 50, negotiation: 75, closed_won: 100, closed_lost: 0 }

function fmt(n) {
  if (!n) return '$0'
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(0)}K`
  return `$${n}`
}

function DealCard({ deal, onEdit, onDelete, onMove, stages }) {
  const stage = STAGES.find(s => s.key === deal.stage)
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onEdit(deal)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm font-bold text-slate-800 leading-tight flex-1">{deal.title}</div>
        <div className="text-sm font-black flex-shrink-0" style={{ color: stage?.color }}>{fmt(deal.value)}</div>
      </div>
      {deal.contacts && (
        <div className="text-xs text-slate-500 mb-1">👤 {deal.contacts.first_name} {deal.contacts.last_name}</div>
      )}
      {deal.companies && (
        <div className="text-xs text-slate-400 mb-2">🏢 {deal.companies.name}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {deal.close_date ? `Close: ${new Date(deal.close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No close date'}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onDelete(deal.id) }}
            className="text-xs text-red-400 hover:text-red-600 px-1">✕</button>
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${PROB[deal.stage]}%`, background: stage?.color }} />
      </div>
    </div>
  )
}

function DealModal({ deal, contacts, companies, onSave, onClose }) {
  const [form, setForm] = useState(deal || { title: '', value: '', stage: 'prospecting', close_date: '', contact_id: '', company_id: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSave({ ...form, value: parseFloat(form.value) || 0, probability: PROB[form.stage] })
    setSaving(false)
  }

  return (
    <Modal title={deal ? 'Edit Deal' : 'New Deal'} onClose={onClose}>
      <div className="space-y-3">
        <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Deal title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Value ($)" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          <input className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            type="date" value={form.close_date} onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))} />
        </div>
        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.contact_id} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}>
          <option value="">No contact linked</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
          <option value="">No company linked</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          placeholder="Notes..." rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <button onClick={save} disabled={saving || !form.title}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#818cf8,#4f46e5)' }}>
          {saving ? 'Saving…' : deal ? 'Update Deal' : 'Create Deal'}
        </button>
      </div>
    </Modal>
  )
}

export default function Pipeline() {
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    const [d, c, co] = await Promise.all([
      fetch('/api/deals').then(r => r.json()),
      fetch('/api/contacts').then(r => r.json()),
      fetch('/api/companies').then(r => r.json()),
    ])
    setDeals(Array.isArray(d) ? d : [])
    setContacts(Array.isArray(c) ? c : [])
    setCompanies(Array.isArray(co) ? co : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveDeal(form) {
    if (selected) {
      await fetch(`/api/deals/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setModal(null); setSelected(null); load()
  }

  async function deleteDeal(id) {
    if (!confirm('Delete this deal?')) return
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    load()
  }

  const totalPipeline = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).reduce((s, d) => s + (d.value || 0), 0)
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((s, d) => s + (d.value || 0), 0)

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Pipeline', value: fmt(totalPipeline), color: '#4f46e5' },
          { label: 'Closed Won', value: fmt(wonValue), color: '#10b981' },
          { label: 'Open Deals', value: deals.filter(d => !['closed_won','closed_lost'].includes(d.stage)).length, color: '#f59e0b' },
          { label: 'Win Rate', value: deals.length ? `${Math.round(deals.filter(d=>d.stage==='closed_won').length/deals.length*100)}%` : '0%', color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key)
          const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0)
          return (
            <div key={stage.key} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: stage.color }}>{stage.label}</div>
                  <div className="text-xs text-slate-400">{stageDeals.length} deals · {fmt(stageValue)}</div>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              </div>
              <div className="space-y-3 min-h-32 p-2 rounded-2xl" style={{ background: stage.bg }}>
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal}
                    onEdit={d => { setSelected(d); setModal('deal') }}
                    onDelete={deleteDeal}
                    onMove={() => {}}
                    stages={STAGES}
                  />
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-xs text-slate-300 text-center py-4">No deals</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => { setSelected(null); setModal('deal') }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl text-white text-2xl font-bold shadow-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#818cf8,#4f46e5)' }}>+</button>

      {modal === 'deal' && (
        <DealModal deal={selected} contacts={contacts} companies={companies} onSave={saveDeal} onClose={() => { setModal(null); setSelected(null) }} />
      )}
    </div>
  )
}
