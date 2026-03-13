// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="spinner">
      <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ enriched }) {
  return enriched ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>
      ✓ Enriched
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f3f4f6', color: '#6b7280' }}>
      Raw
    </span>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="fade-in bg-white rounded-2xl shadow-2xl overflow-y-auto" style={{ width: '100%', maxWidth: wide ? 700 : 560, maxHeight: '88vh' }}>
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">✕</button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────────────────────────
export function Toast({ msg, type, onClose }) {
  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
    info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  }
  const c = colors[type] || colors.info
  return (
    <div
      className="fade-in fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg"
      style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.text, maxWidth: 380 }}
    >
      {type === 'success' && '✓'} {type === 'error' && '✕'} {type === 'info' && '✦'}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}

// ─── Field display ─────────────────────────────────────────────────────────
export function Field({ label, value, highlight }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{label}</div>
      <div className="text-sm" style={{ color: highlight ? '#4f46e5' : '#1e293b', fontWeight: highlight ? 600 : 400 }}>{value || '—'}</div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="text-3xl font-extrabold" style={{ color: color || '#0f172a' }}>{value}</div>
      <div className="text-sm font-semibold text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Form field wrapper ─────────────────────────────────────────────────────
export function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Input styles ───────────────────────────────────────────────────────────
export const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
export const textareaCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none resize-none"
