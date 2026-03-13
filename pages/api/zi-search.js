export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { token, type, query, filters } = req.body
  if (!token) return res.status(400).json({ error: 'ZoomInfo token is required.' })

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim()

  // CONFIRMED WORKING FORMAT (from your Postman test):
  // URL: /gtm/data/v1/contacts/search and /gtm/data/v1/companies/search
  // Content-Type: application/vnd.api+json
  // Pagination: ?page[number]=1&page[size]=25 as URL query params
  // Body: { "data": { "attributes": { ...filters }, "type": "ContactSearch" } }
  const headers = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Authorization': `Bearer ${cleanToken}`,
  }

  const pagination = '?page%5Bnumber%5D=1&page%5Bsize%5D=25'

  // CONFIRMED valid managementLevel values (tested live via MCP):
  // "C Level Exec" ✅  "VP Level Exec" ✅  "Director" ✅  "Manager" ✅  "Non Manager" ✅
  // "C-Level" ❌  "VP" ❌  "C Level" ❌
  const MGMT_MAP = {
    'C-Level':                'C Level Exec',
    'VP':                     'VP Level Exec',
    'Director':               'Director',
    'Manager':                'Manager',
    'Individual Contributor': 'Non Manager',
    'Board Member':           'Board Member',
  }

  try {
    if (type === 'contacts') {
      const attributes = {}

      if (query && query.trim()) {
        const parts = query.trim().split(' ')
        if (parts.length >= 2) {
          attributes.firstName = parts[0]
          attributes.lastName = parts.slice(1).join(' ')
        } else {
          attributes.lastName = query.trim()
        }
      }
      if (filters?.jobTitle)         attributes.jobTitle = filters.jobTitle
      if (filters?.companyName)      attributes.companyName = filters.companyName
      if (filters?.country)          attributes.country = filters.country
      if (filters?.employeeRangeMin) attributes.employeeRangeMin = String(filters.employeeRangeMin)
      if (filters?.employeeRangeMax) attributes.employeeRangeMax = String(filters.employeeRangeMax)
      if (filters?.industryKeywords) attributes.industryKeywords = filters.industryKeywords

      // Map to exact ZoomInfo managementLevel values
      if (filters?.managementLevel) {
        const levels = filters.managementLevel.split(',').map(l => l.trim())
        const mapped = levels.map(l => MGMT_MAP[l] || l).join(',')
        attributes.managementLevel = mapped
      }

      const body = { data: { attributes, type: 'ContactSearch' } }

      const ziRes = await fetch(
        `https://api.zoominfo.com/gtm/data/v1/contacts/search${pagination}`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      )

      const raw = await ziRes.text()
      if (!ziRes.ok) return res.status(ziRes.status).json({ error: raw })
      const data = JSON.parse(raw)

      const results = (data?.data || []).map(item => ({
        zoominfoContactId: item.id || '',
        firstName: item.attributes?.firstName || '',
        lastName: item.attributes?.lastName || '',
        email: item.attributes?.email || '',
        jobTitle: item.attributes?.jobTitle || '',
        companyName: item.attributes?.company?.name || '',
        zoominfoCompanyId: item.attributes?.company?.id ? String(item.attributes.company.id) : '',
        companyWebsite: item.attributes?.company?.website || '',
        city: item.attributes?.city || '',
        state: item.attributes?.state || '',
        country: item.attributes?.country || '',
        department: item.attributes?.department || '',
        phone: item.attributes?.phone || '',
        managementLevel: item.attributes?.managementLevel || '',
        accuracyScore: item.attributes?.contactAccuracyScore || '',
      }))

      return res.status(200).json({ results, total: data?.meta?.totalResults || results.length })
    }

    if (type === 'companies') {
      const attributes = {}

      if (query && query.trim())       attributes.companyName = query.trim()
      if (filters?.country)            attributes.country = filters.country
      if (filters?.employeeRangeMin)   attributes.employeeRangeMin = String(filters.employeeRangeMin)
      if (filters?.employeeRangeMax)   attributes.employeeRangeMax = String(filters.employeeRangeMax)
      if (filters?.industryKeywords)   attributes.industryKeywords = filters.industryKeywords
      if (filters?.revenueMin)         attributes.revenueMin = filters.revenueMin
      if (filters?.revenueMax)         attributes.revenueMax = filters.revenueMax

      const body = { data: { attributes, type: 'CompanySearch' } }

      const ziRes = await fetch(
        `https://api.zoominfo.com/gtm/data/v1/companies/search${pagination}`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      )

      const raw = await ziRes.text()
      if (!ziRes.ok) return res.status(ziRes.status).json({ error: raw })
      const data = JSON.parse(raw)

      const results = (data?.data || []).map(item => ({
        zoominfoCompanyId: item.id || '',
        name: item.attributes?.name || '',
        website: item.attributes?.website || '',
        industry: Array.isArray(item.attributes?.industries)
          ? item.attributes.industries[0]
          : item.attributes?.industries || '',
        employeeCount: item.attributes?.employeeCount || '',
        revenue: item.attributes?.revenue || '',
        city: item.attributes?.city || '',
        country: item.attributes?.country || '',
        phone: item.attributes?.phone || '',
      }))

      return res.status(200).json({ results, total: data?.meta?.totalResults || results.length })
    }

    return res.status(400).json({ error: 'type must be contacts or companies' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
