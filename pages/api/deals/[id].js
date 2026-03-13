import { supabase } from '../../../lib/supabase'
export default async function handler(req, res) {
  const { id } = req.query
  if (req.method === 'PUT') {
    const { data, error } = await supabase.from('deals').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'DELETE') {
    await supabase.from('activities').delete().eq('deal_id', id)
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ success: true })
  }
  res.setHeader('Allow', ['PUT', 'DELETE'])
  res.status(405).end()
}
