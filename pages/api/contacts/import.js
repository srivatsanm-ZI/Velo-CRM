import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { contacts } = req.body
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'contacts array is required' })
  }

  // Map CSV columns to DB columns (flexible column name matching)
  const mapped = contacts.map((row) => {
    const get = (...keys) => {
      for (const k of keys) {
        const found = Object.keys(row).find(
          (rk) => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, '')
        )
        if (found && row[found]) return row[found]
      }
      return null
    }
    return {
      first_name: get('firstname', 'first_name', 'first') || 'Unknown',
      last_name: get('lastname', 'last_name', 'last') || '',
      email: get('email', 'emailaddress', 'e_mail'),
      job_title: get('title', 'jobtitle', 'job_title', 'position'),
      company_name: get('company', 'companyname', 'company_name', 'organization'),
      phone: get('phone', 'phonenumber', 'phone_number', 'telephone'),
      city: get('city'),
      state: get('state', 'province'),
      country: get('country'),
      enriched: false,
    }
  }).filter((c) => c.first_name && c.first_name !== 'Unknown' || c.email)

  const { data, error } = await supabase
    .from('contacts')
    .insert(mapped)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ imported: data.length, records: data })
}
