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
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          type: 'ContactEnrich',
          attributes: {
            matchPersonInput: [matchInput],
            outputFields: [
              'id', 'firstName', 'lastName', 'email', 'phone', 'mobilePhone',
              'jobTitle', 'managementLevel', 'companyName', 'companyId',
              'city', 'state', 'country',
            ],
          },
        },
      }),
    })

    const ziData = await ziRes.json()

    if (!ziRes.ok) {
      return res.status(ziRes.status).json({ error: JSON.stringify(ziData) })
    }

    const key = Object.keys(ziData).find(k => k.startsWith('contact_'))
    const entry = key ? ziData[key] : null

    if (!entry || !entry.success || !entry.data || !entry.data.id) {
      return res.status(422).json({ error: entry?.error || 'No match found in ZoomInfo' })
    }

    const r = entry.data

    const { data: updated, error: updateErr } = await supabase
      .from('contacts')
      .update({
        zi_person_id:  String(r.id),
        first_name:    r.firstName    || contact.first_name,
        last_name:     r.lastName     || contact.last_name,
        email:         r.email        || contact.email,
        job_title:     r.jobTitle     || r.title || contact.job_title,
        phone:         r.phone        || contact.phone,
        mobile_phone:  r.mobilePhone  || contact.mobile_phone,
        city:          r.city         || contact.city,
        state:         r.state        || contact.state,
        country:       r.country      || contact.country,
        company_name:  r.companyName || r.employmentHistory?.[0]?.company?.companyName || contact.company_name,
        zi_company_id: r.employmentHistory?.[0]?.company?.companyId
                         ? String(r.employmentHistory[0].company.companyId) : contact.zi_company_id,
        seniority:     Array.isArray(r.managementLevel) ? r.managementLevel[0] : r.managementLevel || contact.seniority,
        enriched:      true,
        enriched_at:   new Date().toISOString(),
        updated_at:    new Date().toISOString(),
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
