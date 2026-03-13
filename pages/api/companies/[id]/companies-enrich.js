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

  try {
    const matchInput = {}
    if (company.website) matchInput.companyWebsite = company.website
    else matchInput.companyName = company.name

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`,
      },
      body: JSON.stringify({
        data: {
          type: 'CompanyEnrich',
          attributes: {
            matchCompanyInput: [matchInput],
            outputFields: [
              'name', 'website', 'industries', 'primaryIndustry', 'employeeCount', 'revenue',
              'city', 'state', 'country', 'phone', 'description',
              'foundedYear', 'ticker', 'logo', 'employeeRange', 'revenueRange',
            ],
          },
        },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!ziRes.ok) {
      const err = await ziRes.text()
      throw new Error(`ZoomInfo API error ${ziRes.status}: ${err}`)
    }

    const ziData = await ziRes.json()

    // GTM v1 enrich response: { data: [ { id, attributes: { ... } } ] }
    const item = ziData?.data?.[0]
    const r = item?.attributes
    const ziId = item?.id

    if (!r) {
      return res.status(422).json({ error: 'ZoomInfo found no match for this company' })
    }

    const industryVal = r.primaryIndustry
      || (Array.isArray(r.industries) ? r.industries[0] : r.industries)
      || company.industry

    const { data: updated, error: updateErr } = await supabase
      .from('companies')
      .update({
        zi_company_id: ziId        ? String(ziId)          : company.zi_company_id,
        name:          r.name       || company.name,
        website:       r.website    || company.website,
        industry:      industryVal,
        employees:     r.employeeCount ? String(r.employeeCount) : (r.employeeRange || company.employees),
        revenue:       r.revenue       ? String(r.revenue)       : (r.revenueRange  || company.revenue),
        city:          r.city          || company.city,
        state:         r.state         || company.state,
        country:       r.country       || company.country,
        phone:         r.phone         || company.phone,
        description:   r.description   || company.description,
        logo:          r.logo          || company.logo,
        enriched:      true,
        enriched_at:   new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      })
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
