import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'ZoomInfo token is required.' })
  }

  const { data: company, error: fetchErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !company) {
    return res.status(404).json({ error: 'Company not found' })
  }

  // Build match input — best available signal in priority order
  let matchInput = {}
  if (company.zi_company_id) {
    matchInput = { companyId: String(company.zi_company_id) }
  } else if (company.website) {
    matchInput = { companyWebsite: company.website }
  } else {
    matchInput = { companyName: company.name }
  }

  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        data: {
          type: 'CompanyEnrich',
          attributes: {
            matchCompanyInput: [matchInput],
            outputFields: [
              'id', 'name', 'website', 'industry', 'employeeCount', 'revenue',
              'city', 'state', 'country', 'phone', 'description',
              'foundedYear', 'ticker',
            ],
          },
        },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const rawText = await ziRes.text()
    console.log('[ZI Company Enrich] status:', ziRes.status)
    console.log('[ZI Company Enrich] matchInput:', JSON.stringify(matchInput))
    console.log('[ZI Company Enrich] response:', rawText.slice(0, 1000))

    if (!ziRes.ok) {
      throw new Error(`ZoomInfo API error ${ziRes.status}: ${rawText}`)
    }

    const ziData = JSON.parse(rawText)

    // Try GTM v1 format first: { data: [ { id, attributes: {}, meta: { matchStatus } } ] }
    let r = null
    let ziId = null

    const v1Item = ziData?.data?.[0]
    if (v1Item?.attributes && v1Item?.meta?.matchStatus !== 'NO_MATCH') {
      r = v1Item.attributes
      ziId = v1Item.id
    }

    // Fall back to legacy format: { company_1: { success, data: { id, ... } } }
    if (!r) {
      const legacyKey = Object.keys(ziData).find(k => k.startsWith('company_'))
      const entry = legacyKey ? ziData[legacyKey] : null
      if (entry?.success && entry?.data?.id) {
        r = entry.data
        ziId = r.id
      }
    }

    if (!r) {
      return res.status(422).json({
        error: 'ZoomInfo found no match for this company.',
        debug: JSON.stringify(ziData).slice(0, 300),
      })
    }

    const updates = {
      enriched:    true,
      enriched_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }

    if (ziId)              updates.zi_company_id = String(ziId)
    if (r.name)            updates.name          = r.name
    if (r.website)         updates.website       = r.website || r.domain
    if (r.industry)        updates.industry      = r.industry
    if (r.employeeCount)   updates.employees     = String(r.employeeCount)
    if (r.revenue)         updates.revenue       = String(r.revenue)
    if (r.city)            updates.city          = r.city
    if (r.state)           updates.state         = r.state
    if (r.country)         updates.country       = r.country
    if (r.phone)           updates.phone         = r.phone
    if (r.description)     updates.description   = r.description
    if (r.foundedYear)     updates.founded       = String(r.foundedYear)
    if (r.ticker)          updates.ticker        = r.ticker

    const { data: updated, error: updateErr } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return res.status(500).json({ error: updateErr.message })
    return res.status(200).json(updated)

  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'ZoomInfo request timed out. Please try again.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
