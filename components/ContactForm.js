import { useState } from 'react'
import { FormField, inputCls, Spinner } from './UI'

export default function ContactForm({ initial, onSave, onClose }) {
  const blank = { first_name: '', last_name: '', email: '', job_title: '', company_name: '', phone: '', city: '', state: '', country: 'US' }
  const [form, setForm] = useState(initial ? {
    first_name: initial.first_name || '',
    last_name: initial.last_name || '',
    email: initial.email || '',
    job_title: initial.job_title || '',
    company_name: initial.company_name || '',
    phone: initial.phone || '',
    city: initial.city || '',
    state: initial.state || '',
    country: initial.country || 'US',
  } : blank)
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) return alert('First and last name are required')
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required><input className={inputCls} value={form.first_name} onChange={set('first_name')} placeholder="Jane" /></FormField>
        <FormField label="Last Name" required><input className={inputCls} value={form.last_name} onChange={set('last_name')} placeholder="Smith" /></FormField>
      </div>
      <FormField label="Email"><input className={inputCls} value={form.email} onChange={set('email')} placeholder="jane@company.com" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Job Title"><input className={inputCls} value={form.job_title} onChange={set('job_title')} placeholder="VP Sales" /></FormField>
        <FormField label="Company"><input className={inputCls} value={form.company_name} onChange={set('company_name')} placeholder="Acme Corp" /></FormField>
      </div>
      <FormField label="Phone"><input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" /></FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="City"><input className={inputCls} value={form.city} onChange={set('city')} placeholder="New York" /></FormField>
        <FormField label="State"><input className={inputCls} value={form.state} onChange={set('state')} placeholder="NY" /></FormField>
        <FormField label="Country"><input className={inputCls} value={form.country} onChange={set('country')} placeholder="US" /></FormField>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: '#4f46e5' }}>
          {saving && <Spinner size={14} />}
          {initial ? 'Save Changes' : 'Add Contact'}
        </button>
      </div>
    </div>
  )
}
