import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query
  const { token } = req.body

  if (!token) return res.status(400).json({ error: 'ZoomInfo token is required.' })

  const { data: contact } = await supabase.from('contacts').select('*').eq('id', id).single()
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  if (!contact.zi_person_id) return res.status(422).json({ error: 'Enrich this contact first to find similar contacts.' })

  try {
    const ziRes = await fetch('https://api.zoominfo.com/gtm/data/v1/contacts/similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          type: 'SimilarContacts',
          attributes: {
            referencePersonId: contact.zi_person_id,
            pageSize: 10,
          },
        },
      }),
    })

    const rawText = await ziRes.text()
    if (!ziRes.ok) return res.status(ziRes.status).json({ error: rawText })

    const ziData = JSON.parse(rawText)

    // Response: { data: [{ id, attributes: { rank, score, firstName, lastName, jobTitle, companyName } }] }
    const results = (ziData?.data || ziData?.lookalikes || []).slice(0, 10).map(item => ({
      zoominfoContactId: item.zoominfoContactId || item.id,
      rank: item.attributes?.rank,
      score: item.attributes?.score,
      brief: item.attributes?.lookalikePersonBrief || '',
      firstName: item.attributes?.firstName || '',
      lastName: item.attributes?.lastName || '',
      jobTitle: item.attributes?.jobTitle || item.attributes?.lookalikePersonBrief?.match(/job_title: ([^|]+)/)?.[1]?.trim() || '',
      companyName: item.attributes?.companyName || '',
    }))

    return res.status(200).json({ results })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
