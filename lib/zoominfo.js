// ZoomInfo API integration using Okta OAuth2 authentication
// Runs server-side only — your credentials are never exposed to the browser

const ZI_BASE = 'https://api.zoominfo.com'
const OKTA_TOKEN_URL = 'https://okta-login.zoominfo.com/oauth2/default/v1/token'

// Get a fresh Bearer Token using Okta OAuth2 Client Credentials flow
async function getAccessToken() {
  const clientId = process.env.ZOOMINFO_CLIENT_ID
  const clientSecret = process.env.ZOOMINFO_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('ZOOMINFO_CLIENT_ID or ZOOMINFO_CLIENT_SECRET not set in environment variables')
  }

  // Okta Client Credentials — send client_id and client_secret in the body
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)

  const res = await fetch(OKTA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ZoomInfo Okta auth failed ${res.status}: ${err}`)
  }

  const data = await res.json()
  const token = data.access_token

  if (!token) {
    throw new Error('No access_token in Okta response: ' + JSON.stringify(data))
  }

  return token
}

// Make an authenticated request to ZoomInfo
async function ziRequest(endpoint, body) {
  const token = await getAccessToken()

  const res = await fetch(`${ZI_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ZoomInfo API error ${res.status}: ${err}`)
  }

  return res.json()
}

// Enrich a contact
export async function enrichContact(contact) {
  const matchInput = {}

  if (contact.email) {
    matchInput.email = contact.email
  } else if (contact.firstName && contact.lastName && contact.companyName) {
    matchInput.firstName = contact.firstName
    matchInput.lastName = contact.lastName
    matchInput.companyName = contact.companyName
  } else {
    matchInput.firstName = contact.firstName
    matchInput.lastName = contact.lastName
  }

  const data = await ziRequest('/enrich/contact', {
    matchPersonInput: [matchInput],
    outputFields: [
      'id', 'firstName', 'lastName', 'email', 'phone', 'mobilePhone',
      'jobTitle', 'jobFunction', 'managementLevel', 'department',
      'companyName', 'companyId', 'linkedInUrl',
      'city', 'state', 'country',
    ],
  })

  const result = data?.data?.result?.[0]?.data?.[0]
  if (!result) return null

  return {
    personId:    result.id,
    firstName:   result.firstName,
    lastName:    result.lastName,
    email:       result.email,
    phone:       result.phone,
    mobilePhone: result.mobilePhone,
    jobTitle:    result.jobTitle,
    department:  result.department || result.jobFunction,
    seniority:   result.managementLevel,
    companyName: result.companyName,
    companyId:   result.companyId,
    linkedInUrl: result.linkedInUrl,
    city:        result.city,
    state:       result.state,
    country:     result.country,
  }
}

// Enrich a company
export async function enrichCompany(company) {
  const matchInput = {}

  if (company.website) {
    matchInput.companyWebsite = company.website
  } else {
    matchInput.companyName = company.name
  }

  const data = await ziRequest('/enrich/company', {
    matchCompanyInput: [matchInput],
    outputFields: [
      'id', 'name', 'website', 'industry', 'employeeCount', 'revenue',
      'city', 'state', 'country', 'phone', 'description',
      'foundedYear', 'ticker',
    ],
  })

  const result = data?.data?.result?.[0]?.data?.[0]
  if (!result) return null

  return {
    companyId:   result.id,
    name:        result.name,
    website:     result.website,
    industry:    result.industry,
    employees:   result.employeeCount ? String(result.employeeCount) : null,
    revenue:     result.revenue ? String(result.revenue) : null,
    city:        result.city,
    state:       result.state,
    country:     result.country,
    phone:       result.phone,
    description: result.description,
    founded:     result.foundedYear ? String(result.foundedYear) : null,
    ticker:      result.ticker,
  }
}
