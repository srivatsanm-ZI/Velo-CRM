import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'ZoomInfo token is required. Please paste your token in the CRM.' })
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

    const requestBody = {
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
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!ziRes.ok) {
      const err = await ziRes.text()
      throw new Error(`ZoomInfo API error ${ziRes.status}: ${err}`)
    }

    const ziData = await ziRes.json()

    // Response shape: { company_1: { success, data: { id, name, ... } } }
    const companyKey = Object.keys(ziData).find(k => k.startsWith('company_'))
    const result = companyKey ? ziData[companyKey]?.data : null

    if (!result || !result.id) {
      return res.status(422).json({ error: 'ZoomInfo found no match for this company' })
    }

    // Parse industry — can be array or string
    const industryVal = result.primaryIndustry
      || (Array.isArray(result.industries) ? result.industries[0] : result.industries)
      || company.industry

    const updates = {
      zi_company_id: result.id ? String(result.id) : company.zi_company_id,
      name:          result.name        || company.name,
      website:       result.website     || company.website,
      industry:      industryVal,
      employees:     result.employeeCount ? String(result.employeeCount) : (result.employeeRange || company.employees),
      revenue:       result.revenue       ? String(result.revenue)       : (result.revenueRange  || company.revenue),
      city:          result.city          || company.city,
      state:         result.state         || company.state,
      country:       result.country       || company.country,
      phone:         result.phone         || company.phone,
      description:   result.description   || company.description,
      logo:          result.logo          || company.logo,
      enriched:      true,
      enriched_at:   new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    }

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
