import { useState } from 'react'
import { FormField, inputCls, Spinner } from './UI'

export default function CompanyForm({ initial, onSave, onClose }) {
  const blank = { name: '', website: '', industry: '', city: '', state: '', country: 'US', phone: '' }
  const [form, setForm] = useState(initial ? {
    name: initial.name || '',
    website: initial.website || '',
    industry: initial.industry || '',
    city: initial.city || '',
    state: initial.state || '',
    country: initial.country || 'US',
    phone: initial.phone || '',
  } : blank)
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name) return alert('Company name is required')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <FormField label="Company Name" required><input className={inputCls} value={form.name} onChange={set('name')} placeholder="Acme Corp" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Website"><input className={inputCls} value={form.website} onChange={set('website')} placeholder="https://acme.com" /></FormField>
        <FormField label="Industry"><input className={inputCls} value={form.industry} onChange={set('industry')} placeholder="SaaS" /></FormField>
      </div>
      <FormField label="Phone"><input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" /></FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="City"><input className={inputCls} value={form.city} onChange={set('city')} placeholder="San Francisco" /></FormField>
        <FormField label="State"><input className={inputCls} value={form.state} onChange={set('state')} placeholder="CA" /></FormField>
        <FormField label="Country"><input className={inputCls} value={form.country} onChange={set('country')} placeholder="US" /></FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: '#4f46e5' }}>
          {saving && <Spinner size={14} />}
          {initial ? 'Save Changes' : 'Add Company'}
        </button>
      </div>
    </div>
  )
}
