import { supabase } from '../../../lib/supabase'

// Normalize a string for comparison
function normalize(str) {
  if (!str) return ''
  return str.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\b(inc|llc|ltd|corp|co|company|technologies|technology|solutions|group|services|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Simple similarity score 0-1 between two strings
function similarity(a, b) {
  const na = normalize(a), nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.9
  // Token overlap
  const ta = new Set(na.split(' ').filter(Boolean))
  const tb = new Set(nb.split(' ').filter(Boolean))
  const intersection = [...ta].filter(x => tb.has(x)).length
  const union = new Set([...ta, ...tb]).size
  return union > 0 ? intersection / union : 0
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const { type = 'contacts', threshold = 0.8 } = req.query
  const thresh = Number(threshold)

  try {
    if (type === 'contacts') {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const groups = []
      const matched = new Set()

      for (let i = 0; i < contacts.length; i++) {
        if (matched.has(contacts[i].id)) continue
        const group = [contacts[i]]

        for (let j = i + 1; j < contacts.length; j++) {
          if (matched.has(contacts[j].id)) continue
          const a = contacts[i], b = contacts[j]

          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim()
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim()
          const nameSim = similarity(nameA, nameB)

          // Also check email match (exact = definite duplicate)
          const emailMatch = a.email && b.email && normalize(a.email) === normalize(b.email)
          // ZI ID match
          const ziMatch = a.zi_contact_id && b.zi_contact_id && a.zi_contact_id === b.zi_contact_id
          // Same company context
          const companySim = similarity(a.company_name, b.company_name)

          let score = nameSim
          if (emailMatch) score = 1.0
          if (ziMatch) score = 1.0
          if (nameSim >= 0.7 && companySim >= 0.7) score = Math.max(score, 0.95)

          if (score >= thresh) {
            group.push({ ...contacts[j], _score: score })
            matched.add(contacts[j].id)
          }
        }

        if (group.length > 1) {
          matched.add(contacts[i].id)
          // Determine reason
          const reasons = []
          const base = group[0]
          for (let k = 1; k < group.length; k++) {
            const other = group[k]
            const nameA = `${base.first_name} ${base.last_name}`.trim()
            const nameB = `${other.first_name} ${other.last_name}`.trim()
            if (base.email && other.email && normalize(base.email) === normalize(other.email)) reasons.push('Same email')
            else if (base.zi_contact_id && other.zi_contact_id && base.zi_contact_id === other.zi_contact_id) reasons.push('Same ZoomInfo ID')
            else if (similarity(nameA, nameB) >= 0.9) reasons.push('Same name')
            else reasons.push('Similar name + company')
          }
          groups.push({
            type: 'contact',
            reason: [...new Set(reasons)].join(', '),
            records: group,
          })
        }
      }

      return res.status(200).json({ groups, total: groups.reduce((s, g) => s + g.records.length, 0) })

    } else if (type === 'companies') {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const groups = []
      const matched = new Set()

      for (let i = 0; i < companies.length; i++) {
        if (matched.has(companies[i].id)) continue
        const group = [companies[i]]

        for (let j = i + 1; j < companies.length; j++) {
          if (matched.has(companies[j].id)) continue
          const a = companies[i], b = companies[j]

          const nameSim = similarity(a.name, b.name)
          const ziMatch = a.zi_company_id && b.zi_company_id && a.zi_company_id === b.zi_company_id
          const websiteMatch = a.website && b.website && normalize(a.website.replace(/^https?:\/\/(www\.)?/, '')) === normalize(b.website.replace(/^https?:\/\/(www\.)?/, ''))

          let score = nameSim
          if (ziMatch) score = 1.0
          if (websiteMatch) score = Math.max(score, 0.95)

          if (score >= thresh) {
            group.push({ ...companies[j], _score: score })
            matched.add(companies[j].id)
          }
        }

        if (group.length > 1) {
          matched.add(companies[i].id)
          const reasons = []
          const base = group[0]
          for (let k = 1; k < group.length; k++) {
            const other = group[k]
            if (base.zi_company_id && other.zi_company_id && base.zi_company_id === other.zi_company_id) reasons.push('Same ZoomInfo ID')
            else if (base.website && other.website && normalize(base.website.replace(/^https?:\/\/(www\.)?/, '')) === normalize(other.website.replace(/^https?:\/\/(www\.)?/, ''))) reasons.push('Same website')
            else if (similarity(base.name, other.name) >= 0.9) reasons.push('Same name')
            else reasons.push('Similar name')
          }
          groups.push({
            type: 'company',
            reason: [...new Set(reasons)].join(', '),
            records: group,
          })
        }
      }

      return res.status(200).json({ groups, total: groups.reduce((s, g) => s + g.records.length, 0) })
    }

    return res.status(400).json({ error: 'type must be contacts or companies' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
