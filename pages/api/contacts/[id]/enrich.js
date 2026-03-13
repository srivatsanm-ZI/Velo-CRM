import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query
  const { token } = req.body

  if (!token) return res.status(400).json({ error: 'ZoomInfo token is required.' })

  const { data: contact, error: fetchErr } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !contact) return res.status(404).json({ error: 'Contact not found' })

  // Build match input — best available signal
  let matchInput = null
  if (contact.zi_contact_id || contact.zi_person_id) {
    matchInput = { contactId: String(contact.zi_contact_id || contact.zi_person_id) }
  } else if (contact.email) {
    matchInput = { emailAddress: contact.email }
  } else if (contact.first_name && contact.last_name && contact.company_name) {
    matchInput = { firstName: contact.first_name, lastName: contact.last_name, companyName: contact.company_name }
  } else {
    return res.status(422).json({ error: 'Contact needs an email or full name + company to enrich.' })
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
            outputFields: [
              'id', 'firstName', 'lastName', 'email', 'phone', 'mobilePhone',
              'jobTitle', 'managementLevel', 'department', 'companyName', 'companyId',
              'linkedInUrl', 'city', 'state', 'country',
            ],
          },
        },
      }),
    })

    const rawText = await ziRes.text()
    console.log('[ZI Enrich] status:', ziRes.status)
    console.log('[ZI Enrich] matchInput:', JSON.stringify(matchInput))
    console.log('[ZI Enrich] raw response:', rawText.slice(0, 1000))

    if (!ziRes.ok) {
      return res.status(ziRes.status).json({ error: `ZoomInfo error ${ziRes.status}: ${rawText}` })
    }

    let ziData
    try { ziData = JSON.parse(rawText) } catch {
      return res.status(500).json({ error: 'Invalid JSON from ZoomInfo: ' + rawText.slice(0, 200) })
    }

    // Try GTM v1 format: { data: [ { id, attributes: {} } ] }
    let item = ziData?.data?.[0]
    let r = item?.attributes
    let ziId = item?.id

    // Fall back to legacy format: { contact_1: { success, data: { id, ... } } }
    if (!r) {
      const legacyKey = Object.keys(ziData).find(k => k.startsWith('contact_'))
      if (legacyKey && ziData[legacyKey]?.data) {
        r = ziData[legacyKey].data
        ziId = r.id
      }
    }

    if (!r) {
      return res.status(422).json({
        error: 'No match found in ZoomInfo. Try adding the company name to the contact first.',
        debug: JSON.stringify(ziData).slice(0, 500),
      })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('contacts')
      .update({
        zi_contact_id:    ziId ? String(ziId) : contact.zi_contact_id,
        zi_person_id:     ziId ? String(ziId) : contact.zi_person_id,
        first_name:       r.firstName      || contact.first_name,
        last_name:        r.lastName       || contact.last_name,
        email:            r.email          || contact.email,
        job_title:        r.jobTitle       || contact.job_title,
        phone:            r.phone          || contact.phone,
        mobile_phone:     r.mobilePhone    || contact.mobile_phone,
        department:       r.department     || contact.department,
        management_level: Array.isArray(r.managementLevel) ? r.managementLevel[0] : r.managementLevel || contact.management_level,
        city:             r.city           || contact.city,
        state:            r.state          || contact.state,
        country:          r.country        || contact.country,
        company_name:     r.companyName    || contact.company_name,
        zi_company_id:    r.companyId      ? String(r.companyId) : contact.zi_company_id,
        linkedin_url:     r.linkedInUrl    || contact.linkedin_url,
        enriched:         true,
        enriched_at:      new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return res.status(500).json({ error: updateErr.message })
    return res.status(200).json(updated)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
