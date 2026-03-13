import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('companies').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: 'Company not found' })
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    await supabase.from('notes').delete().eq('company_id', id)
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
