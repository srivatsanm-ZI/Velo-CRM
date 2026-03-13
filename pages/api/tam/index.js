import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  // GET all ICP profiles
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tam_settings')
      .select('*')
      .order('created_at')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  // POST create new ICP profile
  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('tam_settings')
      .insert([{ ...req.body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
