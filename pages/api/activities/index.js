import { supabase } from '../../../lib/supabase'
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { contact_id, company_id, deal_id } = req.query
    let query = supabase.from('activities').select('*').order('created_at', { ascending: false })
    if (contact_id) query = query.eq('contact_id', contact_id)
    if (company_id) query = query.eq('company_id', company_id)
    if (deal_id) query = query.eq('deal_id', deal_id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('activities').insert([{ ...req.body, created_at: new Date().toISOString() }]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }
  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
