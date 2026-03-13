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

  const { data: contact, error: fetchErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !contact) {
    return res.status(404).json({ error: 'Contact not found' })
  }

  // Build match input — best available signal in priority order
  let matchInput = null
  if (contact.zi_contact_id || contact.zi_person_id) {
    matchInput = { personId: String(contact.zi_contact_id || contact.zi_person_id) }
  } else if (contact.email) {
    matchInput = { emailAddress: contact.email }
  } else if (contact.first_name && contact.last_name && contact.company_name) {
    matchInput = { firstName: contact.first_name, lastName: contact.last_name, companyName: contact.company_name }
  } else if (contact.first_name && contact.last_name) {
    matchInput = { firstName: contact.first_name, lastName: contact.last_name }
  } else {
    return res.status(422).json({ error: 'Contact needs an email or full name to enrich.' })
  }

  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/contacts/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        data: {
          type: 'ContactEnrich',
          attributes: {
            matchPersonInput: [matchInput],
            requiredFields: ['id'],
            outputFields: [
              'id', 'firstName', 'lastName', 'email', 'phone', 'mobilePhone',
              'jobTitle', 'managementLevel', 'companyName', 'companyId',
              'city', 'state', 'country',
            ],
          },
        },
      }),
    })

    const rawText = await ziRes.text()
    console.log('[ZI Contact Enrich] status:', ziRes.status)
    console.log('[ZI Contact Enrich] matchInput:', JSON.stringify(matchInput))
    console.log('[ZI Contact Enrich] response:', rawText.slice(0, 2000))

    if (!ziRes.ok) {
      return res.status(ziRes.status).json({ error: `ZoomInfo error ${ziRes.status}: ${rawText}` })
    }

    const ziData = JSON.parse(rawText)

    // ZI GTM v1 response structure (confirmed from logs):
    // { data: [{ id, type, attributes: { firstName, lastName, email, city, state, country,
    //   jobTitle, managementLevel, mobilePhone,
    //   company: { id, name }   <-- company is nested here, NOT companyName/companyId
    // }, meta: { matchStatus } }] }
    const item = ziData?.data?.[0]

    if (!item || item.meta?.matchStatus === 'NO_MATCH') {
      return res.status(422).json({
        error: 'No match found in ZoomInfo.',
        debug: JSON.stringify(ziData).slice(0, 300),
      })
    }

    const a = item.attributes  // shorthand
    const ziId = item.id

    const updates = {
      enriched:     true,
      enriched_at:  new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }

    if (ziId)                updates.zi_contact_id    = String(ziId)
    if (ziId)                updates.zi_person_id     = String(ziId)
    if (a.firstName)         updates.first_name       = a.firstName
    if (a.lastName)          updates.last_name        = a.lastName
    if (a.email)             updates.email            = a.email
    if (a.jobTitle)          updates.job_title        = a.jobTitle
    if (a.phone)             updates.phone            = a.phone
    if (a.mobilePhone)       updates.mobile_phone     = a.mobilePhone
    if (a.city)              updates.city             = a.city
    if (a.state)             updates.state            = a.state
    if (a.country)           updates.country          = a.country
    if (a.managementLevel)   updates.management_level = Array.isArray(a.managementLevel)
                               ? a.managementLevel[0] : a.managementLevel

    // Company: GTM v1 returns as a.company.name / a.company.id
    if (a.company?.name)     updates.company_name     = a.company.name
    if (a.company?.id)       updates.zi_company_id    = String(a.company.id)

    const { data: updated, error: updateErr } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return res.status(500).json({ error: updateErr.message })
    return res.status(200).json(updated)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
