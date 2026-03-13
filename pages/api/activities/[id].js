import { supabase } from '../../../lib/supabase'
export default async function handler(req, res) {
  const { id } = req.query
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ success: true })
  }
  res.setHeader('Allow', ['DELETE'])
  res.status(405).end()
}
