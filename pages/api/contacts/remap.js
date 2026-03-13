import { supabase } from '../../../lib/supabase'

function norm(s) { return (s || '').toLowerCase().trim() }

function toDomain(input) {
  if (!input) return ''
  return input.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0].split('?')[0].trim()
}

const FREE_DOMAINS = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','me.com','aol.com','protonmail.com','live.com','msn.com','ymail.com'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }
  try {
    // Fetch ALL contacts — not just orphans. Also fix wrong/stale links.
    const { data: contacts, error: cErr } = await supabase
      .from('contacts')
      .select('id, email, company_name, company_id, zi_company_id')
    if (cErr) return res.status(500).json({ error: cErr.message })
    if (!contacts || contacts.length === 0) return res.status(200).json({ linked: 0, updated: 0, skipped: 0, total: 0 })

    const { data: companies, error: coErr } = await supabase
      .from('companies')
      .select('id, name, website, zi_company_id')
    if (coErr) return res.status(500).json({ error: coErr.message })

    const byZiId   = new Map()
    const byName   = new Map()
    const byDomain = new Map()

    const SUFFIX_RE = /\s+(inc\.?|llc\.?|corp\.?|ltd\.?|limited|incorporated|co\.?|company|group|holdings?)\s*$/

    for (const co of companies) {
      if (co.zi_company_id) byZiId.set(String(co.zi_company_id).trim(), co.id)
      if (co.name) {
        const n = norm(co.name)
        byName.set(n, co.id)
        const stripped = n.replace(SUFFIX_RE, '').trim()
        if (stripped && stripped !== n) byName.set(stripped, co.id)
      }
      if (co.website) {
        const d = toDomain(co.website)
        if (d && !FREE_DOMAINS.has(d)) byDomain.set(d, co.id)
      }
    }

    let linked = 0, updated = 0, skipped = 0
    const updates = []

    for (const contact of contacts) {
      let bestId = null

      // 1: ZI company ID
      if (!bestId && contact.zi_company_id) {
        bestId = byZiId.get(String(contact.zi_company_id).trim()) || null
      }

      // 2: email domain
      if (!bestId && contact.email) {
        const domain = contact.email.split('@')[1]?.toLowerCase().trim()
        if (domain && !FREE_DOMAINS.has(domain)) bestId = byDomain.get(domain) || null
      }

      // 3: company name (normalized + suffix-stripped)
      if (!bestId && contact.company_name) {
        const n = norm(contact.company_name)
        bestId = byName.get(n) || null
        if (!bestId) {
          const stripped = n.replace(SUFFIX_RE, '').trim()
          if (stripped) bestId = byName.get(stripped) || null
        }
      }

      if (!bestId) { skipped++; continue }
      if (contact.company_id === bestId) { skipped++; continue }

      updates.push({ id: contact.id, company_id: bestId })
      if (!contact.company_id) linked++
      else updated++
    }

    for (const u of updates) {
      await supabase
        .from('contacts')
        .update({ company_id: u.company_id, updated_at: new Date().toISOString() })
        .eq('id', u.id)
    }

    return res.status(200).json({ linked, updated, skipped, total: contacts.length })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
