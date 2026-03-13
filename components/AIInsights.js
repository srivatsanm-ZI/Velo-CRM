import { useState } from 'react'
import { Spinner } from './UI'

const INSIGHT_TYPES = [
  { key: 'account_summary', label: 'Account Summary', icon: '🏢', desc: 'Quick overview of the company', color: '#4f46e5' },
  { key: 'meeting_prep', label: 'Meeting Prep', icon: '📋', desc: 'Talking points for your next call', color: '#f59e0b' },
  { key: 'persona_analysis', label: 'Persona Analysis', icon: '🧠', desc: 'How to approach this contact', color: '#8b5cf6' },
  { key: 'competitive_intel', label: 'Competitive Intel', icon: '🎯', desc: 'Competitive landscape & signals', color: '#ef4444' },
]

export default function AIInsights({ contact, company }) {
  const [activeType, setActiveType] = useState(null)
  const [insights, setInsights] = useState({})
  const [loading, setLoading] = useState(false)

  async function generate(type) {
    setActiveType(type)
    if (insights[type]) return // cached
    setLoading(true)

    const data = type === 'meeting_prep'
      ? { contact, company }
      : type === 'persona_analysis' ? contact
      : company

    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    })
    const result = await res.json()
    setInsights(prev => ({ ...prev, [type]: result.insight || result.error }))
    setLoading(false)
  }

  const current = INSIGHT_TYPES.find(t => t.key === activeType)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {INSIGHT_TYPES.map(t => (
          <button key={t.key} onClick={() => generate(t.key)}
            className="text-left p-3 rounded-xl border transition-all"
            style={{
              borderColor: activeType === t.key ? t.color : '#e2e8f0',
              background: activeType === t.key ? `${t.color}10` : '#fff',
            }}>
            <div className="text-lg mb-1">{t.icon}</div>
            <div className="text-xs font-bold text-slate-800">{t.label}</div>
            <div className="text-xs text-slate-400">{t.desc}</div>
          </button>
        ))}
      </div>

      {activeType && (
        <div className="bg-slate-900 rounded-xl p-4 min-h-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{current?.icon}</span>
            <span className="text-sm font-bold" style={{ color: current?.color }}>{current?.label}</span>
            <button onClick={() => setInsights(prev => ({ ...prev, [activeType]: null })) || generate(activeType)}
              className="ml-auto text-xs text-slate-400 hover:text-slate-200">↻ Regenerate</button>
          </div>
          {loading && !insights[activeType] ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Spinner size={14} /> Generating insights...
            </div>
          ) : (
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {insights[activeType] || ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
