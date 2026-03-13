import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { id } = req.query

  // GET single profile
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('tam_settings').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: error.message })
    return res.status(200).json(data)
  }

  // PUT update profile
  if (req.method === 'PUT') {
    const { data, error } = await supabase
      .from('tam_settings')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  // DELETE profile
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('tam_settings').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).end()
}
