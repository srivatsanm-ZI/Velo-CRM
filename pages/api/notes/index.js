import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { contact_id, company_id } = req.query
    let query = supabase.from('notes').select('*').order('created_at', { ascending: false })
    if (contact_id) query = query.eq('contact_id', contact_id)
    if (company_id) query = query.eq('company_id', company_id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { content, contact_id, company_id, type } = req.body
    if (!content) return res.status(400).json({ error: 'Note content is required' })
    if (!contact_id && !company_id) return res.status(400).json({ error: 'contact_id or company_id required' })

    const { data, error } = await supabase
      .from('notes')
      .insert([{ content, contact_id: contact_id || null, company_id: company_id || null, type: type || 'note' }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
