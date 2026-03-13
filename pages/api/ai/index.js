// /api/ai — general purpose Claude endpoint used by email composer and other components
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { prompt, type, data } = req.body

  // Support both direct prompt and type+data format
  let finalPrompt = prompt

  if (!finalPrompt && type && data) {
    const prompts = {
      account_summary: `You are a B2B sales intelligence assistant. Given this company data, write a concise 3-4 sentence account summary covering: what they do, their scale, and what a salesperson should know. Be direct and practical.\n\nCompany: ${JSON.stringify(data)}`,
      meeting_prep: `You are a B2B sales coach. Given this contact and company data, provide 5 specific talking points for an upcoming meeting. Each should be actionable and reference real details.\n\nContact: ${JSON.stringify(data.contact)}\nCompany: ${JSON.stringify(data.company)}`,
      persona_analysis: `You are a sales intelligence analyst. Given this contact profile, provide a brief persona analysis covering: priorities, how to approach them, challenges they face, and what messaging resonates.\n\nContact: ${JSON.stringify(data)}`,
      competitive_intel: `You are a competitive intelligence analyst. Given this company profile, identify: solution categories they evaluate, probable competitors, buying signals, and key risks for a seller.\n\nCompany: ${JSON.stringify(data)}`,
    }
    finalPrompt = prompts[type]
  }

  if (!finalPrompt) return res.status(400).json({ error: 'prompt or type+data required' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: finalPrompt }],
      }),
    })
    const result = await response.json()
    const text = result.content?.map(b => b.text || '').join('') || ''
    return res.status(200).json({ insight: text, text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
