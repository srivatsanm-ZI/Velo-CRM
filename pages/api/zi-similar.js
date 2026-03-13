// ZoomInfo Company Lookalikes
// Endpoint: GET https://api.zoominfo.com/gtm/copilot/v1/companies/lookalikes
// Docs: https://docs.zoominfo.com/reference/companylookalikesinterface_companylookalikes

export default async function handler(req, res) {
  const { companyId, companyName, token, pageSize = 15 } = req.method === 'GET' ? req.query : req.body

  if (!token) {
    return res.status(400).json({ error: 'token is required' })
  }
  if (!companyId && !companyName) {
    return res.status(400).json({ error: 'companyId or companyName is required' })
  }

  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()

    // Build query params — prefer companyId, fall back to companyName
    const params = new URLSearchParams()
    if (companyId) params.set('companyId', String(companyId))
    else           params.set('companyName', String(companyName))

    const ziRes = await fetch(
      `https://api.zoominfo.com/gtm/copilot/v1/companies/lookalikes?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${cleanToken}`,
        },
      }
    )

    const rawText = await ziRes.text()
    console.log('[ZI Lookalikes] status:', ziRes.status)
    console.log('[ZI Lookalikes] params:', params.toString())
    console.log('[ZI Lookalikes] response:', rawText.slice(0, 800))

    if (!ziRes.ok) {
      console.error('[ZI Lookalikes] error:', ziRes.status, rawText)
      // Return empty list instead of crashing the workflow
      return res.status(200).json({ companies: [], error: `ZI returned ${ziRes.status}: ${rawText.slice(0, 200)}` })
    }

    const data = JSON.parse(rawText)

    // Response: { data: [ { id, type, attributes: { name, score, rank, industry, revenueRange, employeeRange, country } } ] }
    const companies = (data?.data || [])
      .slice(0, Number(pageSize))
      .map(co => ({
        companyId:     String(co.id || ''),
        name:          co.attributes?.name          || '',
        score:         co.attributes?.score         || null,
        rank:          co.attributes?.rank          || null,
        industry:      co.attributes?.industry      || null,
        employeeRange: co.attributes?.employeeRange || null,
        revenueRange:  co.attributes?.revenueRange  || null,
        country:       co.attributes?.country       || null,
      }))

    return res.status(200).json({ companies })

  } catch (e) {
    console.error('[ZI Lookalikes] exception:', e.message)
    return res.status(200).json({ companies: [], error: e.message })
  }
}
