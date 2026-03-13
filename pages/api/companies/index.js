import { supabase } from '../../../lib/supabase'

// Links contacts that reference this company by ZI company ID, email domain, or name
// Runs on both new inserts and updates. Does NOT require company_id to be null —
// it also corrects contacts that have zi_company_id pointing here but company_id is wrong.
function toDomain(url) {
  if (!url) return ''
  return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].trim()
}
const FREE_DOMAINS = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','me.com','aol.com','protonmail.com','live.com'])

async function linkOrphanedContacts(company) {
  if (!company?.id) return
  try {
    // Build OR filter: match by zi_company_id, email domain, or company_name — all with no company_id yet
    const queries = []

    // 1. Match by ZI company ID on the contact record
    if (company.zi_company_id) {
      const { data: byZi } = await supabase
        .from('contacts')
        .select('id')
        .eq('zi_company_id', String(company.zi_company_id))
        .is('company_id', null)
      if (byZi?.length) queries.push(...byZi.map(r => r.id))
    }

    // 2. Match by company name
    if (company.name) {
      const { data: byName } = await supabase
        .from('contacts')
        .select('id')
        .ilike('company_name', company.name.trim())
        .is('company_id', null)
      if (byName?.length) queries.push(...byName.map(r => r.id))
    }

    // 3. Match by email domain against company website
    if (company.website) {
      const domain = toDomain(company.website)
      if (domain && !FREE_DOMAINS.has(domain)) {
        const { data: allOrphans } = await supabase
          .from('contacts')
          .select('id, email')
          .is('company_id', null)
          .not('email', 'is', null)
        const byDomain = (allOrphans || [])
          .filter(c => c.email?.split('@')[1]?.toLowerCase().trim() === domain)
          .map(c => c.id)
        if (byDomain.length) queries.push(...byDomain)
      }
    }

    const uniqueIds = [...new Set(queries)]
    if (!uniqueIds.length) return

    await supabase
      .from('contacts')
      .update({ company_id: company.id, updated_at: new Date().toISOString() })
      .in('id', uniqueIds)
  } catch (e) {
    console.error('linkOrphanedContacts error:', e.message)
  }
}



export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { search } = req.query
    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,industry.ilike.%${search}%,website.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const {
      name, website, industry, city, state, country, phone,
      zi_company_id, type, source, enriched,
      employees, revenue, description, logo,
      street, zip_code, founded_year,
      became_customer_at, sold_to_department,
    } = req.body

    if (!name) return res.status(400).json({ error: 'Company name is required' })

    // ── Dedup: check if company already exists by zi_company_id or exact name ──
    let existing = null
    if (zi_company_id) {
      const { data: byZi } = await supabase
        .from('companies')
        .select('*')
        .eq('zi_company_id', String(zi_company_id))
        .limit(1)
        .single()
      if (byZi) existing = byZi
    }
    if (!existing) {
      const { data: byName } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', name.trim())
        .limit(1)
        .single()
      if (byName) existing = byName
    }

    const payload = {
      name: name.trim(),
      ...(website      !== undefined && { website }),
      ...(industry     && { industry }),
      ...(city         && { city }),
      ...(state        && { state }),
      ...(country      && { country }),
      ...(phone        && { phone }),
      ...(zi_company_id && { zi_company_id: String(zi_company_id) }),
      ...(type         && { type }),
      ...(source       && { source }),
      ...(enriched !== undefined && { enriched }),
      ...(employees    && { employees: String(employees) }),
      ...(revenue      && { revenue: String(revenue) }),
      ...(description  && { description }),
      ...(logo         && { logo }),
      ...(street       && { street }),
      ...(zip_code     && { zip_code }),
      ...(founded_year && { founded_year: String(founded_year) }),
      ...(became_customer_at  && { became_customer_at }),
      ...(sold_to_department  && { sold_to_department }),
    }

    if (existing) {
      // Update existing company with any new/richer data, then return it
      const merged = {}
      for (const [k, v] of Object.entries(payload)) {
        // Only overwrite if existing field is blank/null and new value is set
        if (v !== null && v !== undefined && v !== '' && !existing[k]) {
          merged[k] = v
        }
      }
      // Always update zi_company_id and enriched if provided
      if (payload.zi_company_id) merged.zi_company_id = payload.zi_company_id
      if (payload.enriched === true) merged.enriched = true

      let savedCompany = existing
      if (Object.keys(merged).length > 0) {
        merged.updated_at = new Date().toISOString()
        const { data: updated, error: upErr } = await supabase
          .from('companies').update(merged).eq('id', existing.id).select().single()
        if (upErr) return res.status(500).json({ error: upErr.message })
        savedCompany = updated
      }

      // Auto-link any contacts with matching company_name but no company_id
      await linkOrphanedContacts(savedCompany)
      return res.status(200).json(savedCompany)
    }

    // New company — insert then auto-link contacts
    const { data, error } = await supabase
      .from('companies')
      .insert([payload])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Auto-link any contacts that reference this company by name
    await linkOrphanedContacts(data)
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
