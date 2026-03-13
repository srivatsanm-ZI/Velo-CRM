import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query
  const { token } = req.body

  if (!token) return res.status(400).json({ error: 'ZoomInfo token is required.' })

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) return res.status(404).json({ error: 'Company not found' })
  if (!company.zi_company_id && !company.name) return res.status(422).json({ error: 'Company needs a name or ZI ID to find similar companies.' })

  try {
    const matchAttr = company.zi_company_id
      ? { companyId: company.zi_company_id }
      : { companyName: company.name }

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          type: 'SimilarCompanies',
          attributes: { ...matchAttr, pageSize: 10 },
        },
      }),
    })

    const rawText = await ziRes.text()
    if (!ziRes.ok) return res.status(ziRes.status).json({ error: rawText })

    const ziData = JSON.parse(rawText)

    // Handle both response shapes
    const items = Array.isArray(ziData?.data) ? ziData.data
      : Array.isArray(ziData?.lookalikes) ? ziData.lookalikes : []

    const results = items.slice(0, 10).map(item => ({
      zoominfoCompanyId: item.zoominfoCompanyId || item.id,
      rank: item.attributes?.rank,
      score: item.attributes?.score,
      companyName: item.attributes?.companyName || item.attributes?.name || '',
      industry: item.attributes?.industry || '',
      revenueRange: item.attributes?.revenueRange || '',
      employeeRange: item.attributes?.employeeRange || '',
      country: item.attributes?.country || '',
    }))

    return res.status(200).json({ results })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
