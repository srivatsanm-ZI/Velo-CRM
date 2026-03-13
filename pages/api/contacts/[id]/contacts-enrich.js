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

  if (!contact.email && !(contact.first_name && contact.last_name && contact.company_name)) {
    return res.status(422).json({ error: 'Add an email OR (first name + last name + company) to enrich this contact.' })
  }

  try {
    const matchInput = contact.email
      ? { emailAddress: contact.email }
      : { firstName: contact.first_name, lastName: contact.last_name, companyName: contact.company_name }

    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/contacts/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`,
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

    const ziData = await ziRes.json()

    if (!ziRes.ok) {
      return res.status(ziRes.status).json({ error: JSON.stringify(ziData) })
    }

    // GTM v1 enrich response: { data: [ { id, attributes: { ... } } ] }
    const r = ziData?.data?.[0]?.attributes

    if (!r) {
      return res.status(422).json({ error: 'No match found in ZoomInfo' })
    }

    const ziId = ziData?.data?.[0]?.id

    const { data: updated, error: updateErr } = await supabase
      .from('contacts')
      .update({
        zi_person_id:    ziId ? String(ziId) : contact.zi_person_id,
        first_name:      r.firstName     || contact.first_name,
        last_name:       r.lastName      || contact.last_name,
        email:           r.email         || contact.email,
        job_title:       r.jobTitle      || contact.job_title,
        phone:           r.phone         || contact.phone,
        mobile_phone:    r.mobilePhone   || contact.mobile_phone,
        department:      r.department    || contact.department,
        management_level: Array.isArray(r.managementLevel) ? r.managementLevel[0] : r.managementLevel || contact.management_level,
        city:            r.city          || contact.city,
        state:           r.state         || contact.state,
        country:         r.country       || contact.country,
        company_name:    r.companyName   || contact.company_name,
        zi_company_id:   r.companyId     ? String(r.companyId) : contact.zi_company_id,
        linkedin_url:    r.linkedInUrl   || contact.linkedin_url,
        enriched:        true,
        enriched_at:     new Date().toISOString(),
        updated_at:      new Date().toISOString(),
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
