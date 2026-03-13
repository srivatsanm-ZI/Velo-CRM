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
    console.log('[ZI Contact Enrich] response:', rawText.slice(0, 1000))

    if (!ziRes.ok) {
      return res.status(ziRes.status).json({ error: `ZoomInfo error ${ziRes.status}: ${rawText}` })
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

    // Fall back to legacy format: { contact_1: { success, data: { id, ... } } }
    if (!r) {
      const legacyKey = Object.keys(ziData).find(k => k.startsWith('contact_'))
      const entry = legacyKey ? ziData[legacyKey] : null
      if (entry?.success && entry?.data?.id) {
        r = entry.data
        ziId = r.id
      }
    }

    if (!r) {
      return res.status(422).json({
        error: 'No match found in ZoomInfo.',
        debug: JSON.stringify(ziData).slice(0, 300),
      })
    }

    const updates = {
      enriched:    true,
      enriched_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }

    if (ziId)              updates.zi_contact_id    = String(ziId)
    if (ziId)              updates.zi_person_id     = String(ziId)
    if (r.firstName)       updates.first_name       = r.firstName
    if (r.lastName)        updates.last_name        = r.lastName
    if (r.email)           updates.email            = r.email
    if (r.jobTitle)        updates.job_title        = r.jobTitle
    if (r.phone)           updates.phone            = r.phone
    if (r.mobilePhone)     updates.mobile_phone     = r.mobilePhone
    if (r.city)            updates.city             = r.city
    if (r.state)           updates.state            = r.state
    if (r.country)         updates.country          = r.country
    if (r.companyName)     updates.company_name     = r.companyName
    if (r.companyId)       updates.zi_company_id    = String(r.companyId)
    // legacy format stores company in employmentHistory
    if (!r.companyName && r.employmentHistory?.[0]?.company?.companyName)
      updates.company_name = r.employmentHistory[0].company.companyName
    if (!r.companyId && r.employmentHistory?.[0]?.company?.companyId)
      updates.zi_company_id = String(r.employmentHistory[0].company.companyId)
    if (r.managementLevel) updates.management_level = Array.isArray(r.managementLevel)
                             ? r.managementLevel[0] : r.managementLevel

    const { data: updated, error: updateErr } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return res.status(500).json({ error: updateErr.message })

    // If company_name is still blank after enrichment, resolve it from the companies table
    // using zi_company_id — this covers contacts enriched via email/name match where
    // ZI doesn't return companyName in the response
    if (!updated.company_name && updated.zi_company_id) {
      const { data: linkedCo } = await supabase
        .from('companies')
        .select('id, name')
        .eq('zi_company_id', updated.zi_company_id)
        .single()
      if (linkedCo?.name) {
        const { data: fixed } = await supabase
          .from('contacts')
          .update({ company_name: linkedCo.name, company_id: linkedCo.id })
          .eq('id', id)
          .select()
          .single()
        if (fixed) return res.status(200).json(fixed)
      }
    }

    return res.status(200).json(updated)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
