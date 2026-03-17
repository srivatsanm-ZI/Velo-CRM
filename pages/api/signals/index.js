import { supabase } from '../../../lib/supabase'

// Simple endpoint to write a single company signal to cache
// Used when adding a company from ICP Search
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { zi_company_id, company_name, intent_score, intent_topics, strength } = req.body
  if (!zi_company_id) return res.status(400).json({ error: 'zi_company_id required' })

  try {
    // Find company_id from companies table
    const { data: co } = await supabase
      .from('companies')
      .select('id')
      .eq('zi_company_id', String(zi_company_id))
      .maybeSingle()

    if (!co?.id) return res.status(200).json({ skipped: true })

    await supabase.from('signal_cache').upsert({
      company_id:    co.id,
      zi_company_id: String(zi_company_id),
      intent_score:  intent_score || 0,
      intent_topics: intent_topics || [],
      strength:      strength || 'none',
      cached_at:     new Date().toISOString(),
    }, { onConflict: 'company_id' })

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
