// Proxy to ZoomInfo find_similar_companies
// ZI API: POST /gtm/data/v1/companies/search with "similar" filter using a reference companyId
export default async function handler(req, res) {
  const { companyId, token, pageSize = 15 } = req.method === 'GET' ? req.query : req.body

  if (!companyId || !token) {
    return res.status(400).json({ error: 'companyId and token are required' })
  }

  try {
    // ZoomInfo's similar companies endpoint (lookalike)
    // Try the correct GTM v1 endpoint format
    const ziRes = await fetch(
      `https://api.zoominfo.com/gtm/data/v1/companies/similar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            type: 'companies',
            attributes: {
              companyId: String(companyId),
              pageSize: Number(pageSize),
            }
          }
        })
      }
    )

    if (!ziRes.ok) {
      // Fallback: use search_companies with the companyId to get its profile,
      // then search for similar via industry/size
      const errText = await ziRes.text()
      console.error('ZI similar API error:', ziRes.status, errText)

      // Try alternate URL format
      const altRes = await fetch(
        `https://api.zoominfo.com/gtm/data/v1/companies/${companyId}/similar?pageSize=${pageSize}`,
        {
          headers: {
            'Accept': 'application/vnd.api+json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      if (!altRes.ok) {
        return res.status(200).json({ companies: [], error: `ZI returned ${ziRes.status}` })
      }

      const altData = await altRes.json()
      const companies = (altData?.data || []).map(co => ({
        companyId: String(co.id || co.companyId || ''),
        name: co.attributes?.name || co.name || '',
        score: co.attributes?.score || co.score || null,
        industry: co.attributes?.industry || co.industry || null,
        employeeCount: co.attributes?.employeeCount || co.employeeCount || null,
        country: co.attributes?.country || co.country || null,
      }))
      return res.status(200).json({ companies })
    }

    const data = await ziRes.json()
    const companies = (data?.data || []).map(co => ({
      companyId: String(co.id || co.companyId || ''),
      name: co.attributes?.name || co.name || '',
      score: co.attributes?.score || co.score || null,
      industry: co.attributes?.industry || co.industry || null,
      employeeCount: co.attributes?.employeeCount || co.employeeCount || null,
      country: co.attributes?.country || co.country || null,
    }))

    return res.status(200).json({ companies })
  } catch (e) {
    console.error('zi-similar error:', e)
    return res.status(500).json({ error: e.message, companies: [] })
  }
}
