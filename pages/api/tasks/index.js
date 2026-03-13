import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { contact_id, company_id, status } = req.query
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (contact_id) query = query.eq('contact_id', contact_id)
    if (company_id) query = query.eq('company_id', company_id)
    if (status) query = query.eq('status', status)
    else query = query.neq('status', 'done') // default: show open tasks

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (req.method === 'POST') {
    const body = { ...req.body, created_at: new Date().toISOString(), status: req.body.status || 'open' }
    const { data, error } = await supabase.from('tasks').insert([body]).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
