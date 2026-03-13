import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { search, company_id } = req.query
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (company_id) {
      query = query.eq('company_id', company_id)
    } else if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,job_title.ilike.%${search}%`
      )
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      first_name, last_name, email, job_title, company_name, phone,
      city, state, country, company_id, zi_contact_id, zi_person_id,
      source, enriched, linkedin_url, department, seniority, management_level,
    } = req.body

    if (!first_name) {
      return res.status(400).json({ error: 'First name is required' })
    }
    const safeLastName = last_name || ''

    // ── 1. Dedup check (ZoomInfo imports only) ───────────────────────────
    // Only dedup on ZI IDs — re-importing the same ZI contact merges cleanly.
    // Email/name dedup intentionally removed so manual adds are never blocked.
    // Use the Duplicates tab to review and merge duplicates.
    let existing = null

    if (zi_contact_id) {
      const { data: byZi } = await supabase
        .from('contacts')
        .select('*')
        .eq('zi_contact_id', String(zi_contact_id))
        .limit(1)
        .maybeSingle()
      if (byZi) existing = byZi
    }

    if (!existing && zi_person_id) {
      const { data: byZp } = await supabase
        .from('contacts')
        .select('*')
        .eq('zi_person_id', String(zi_person_id))
        .limit(1)
        .maybeSingle()
      if (byZp) existing = byZp
    }

    // ── 2. Auto-link company_id ─────────────────────────────────────────
    // Priority: explicit company_id → ZI company ID → email domain → company name
    let resolvedCompanyId = company_id || null
    const FREE_DOMAINS = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','me.com','aol.com','protonmail.com','live.com'])

    if (!resolvedCompanyId) {
      // 1. Match by ZI company ID (most reliable — comes from ZI search results)
      const srcZiCompanyId = req.body.zi_company_id || req.body.company_zi_id
      if (srcZiCompanyId) {
        const { data: byZiCo } = await supabase
          .from('companies').select('id')
          .eq('zi_company_id', String(srcZiCompanyId))
          .limit(1).maybeSingle()
        if (byZiCo) resolvedCompanyId = byZiCo.id
      }

      // 2. Match by email domain against company website
      if (!resolvedCompanyId && email) {
        const emailDomain = email.split('@')[1]?.toLowerCase().trim()
        if (emailDomain && !FREE_DOMAINS.has(emailDomain)) {
          const { data: allCos } = await supabase.from('companies').select('id, website')
          if (allCos) {
            for (const co of allCos) {
              if (!co.website) continue
              const coDomain = co.website.toLowerCase()
                .replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
              if (coDomain === emailDomain) { resolvedCompanyId = co.id; break }
            }
          }
        }
      }

      // 3. Match by company name
      if (!resolvedCompanyId && company_name) {
        const { data: byCoName } = await supabase
          .from('companies').select('id')
          .ilike('name', company_name.trim())
          .limit(1).maybeSingle()
        if (byCoName) resolvedCompanyId = byCoName.id
      }
    }

    // ── 3. Build payload ─────────────────────────────────────────────────
    const payload = {
      first_name: first_name.trim(),
      last_name: safeLastName.trim(),
      ...(email        && { email: email.trim() }),
      ...(job_title    && { job_title }),
      ...(company_name && { company_name: company_name.trim() }),
      ...(phone        && { phone }),
      ...(city         && { city }),
      ...(state        && { state }),
      ...(country      && { country }),
      ...(resolvedCompanyId && { company_id: resolvedCompanyId }),
      ...(zi_contact_id && { zi_contact_id: String(zi_contact_id) }),
      ...(zi_person_id  && { zi_person_id: String(zi_person_id) }),
      ...(source        && { source }),
      ...(enriched !== undefined && { enriched }),
      ...(linkedin_url  && { linkedin_url }),
      ...(department    && { department }),
      ...(management_level && { seniority: management_level }),
      ...(seniority        && { seniority }),
    }

    // ── 4. If ZI duplicate found: merge new data in, return updated ──────
    if (existing) {
      const merged = {}
      for (const [k, v] of Object.entries(payload)) {
        if (v !== null && v !== undefined && v !== '' && !existing[k]) {
          merged[k] = v
        }
      }
      if (payload.zi_contact_id) merged.zi_contact_id = payload.zi_contact_id
      if (payload.zi_person_id)  merged.zi_person_id  = payload.zi_person_id
      if (payload.company_id)    merged.company_id    = payload.company_id
      if (payload.enriched === true) merged.enriched  = true

      if (Object.keys(merged).length > 0) {
        merged.updated_at = new Date().toISOString()
        const { data: updated, error: upErr } = await supabase
          .from('contacts').update(merged).eq('id', existing.id).select().single()
        if (upErr) return res.status(500).json({ error: upErr.message })
        return res.status(200).json(updated)
      }
      return res.status(200).json(existing)
    }

    // ── 5. Insert new contact ────────────────────────────────────────────
    const { data, error } = await supabase
      .from('contacts')
      .insert([payload])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
