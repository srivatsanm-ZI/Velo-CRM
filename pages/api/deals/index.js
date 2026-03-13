import { supabase } from '../../../lib/supabase'
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { company_id, contact_id, stage } = req.query
    let query = supabase.from('deals').select(`*, contacts(first_name,last_name,email), companies(name,zi_company_id)`).order('created_at', { ascending: false })
    if (company_id) query = query.eq('company_id', company_id)
    if (contact_id) query = query.eq('contact_id', contact_id)
    if (stage) query = query.eq('stage', stage)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('deals').insert([{ ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }
  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
