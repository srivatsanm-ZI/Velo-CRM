export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { type, data } = req.body

  const prompts = {
    account_summary: `You are a B2B sales intelligence assistant. Given this company data, write a concise 3-4 sentence account summary covering: what they do, their scale, and what a salesperson should know about them. Be direct and practical.

Company: ${JSON.stringify(data)}`,

    meeting_prep: `You are a B2B sales coach. Given this contact and company data, provide 5 specific talking points for an upcoming sales meeting. Each point should be actionable and reference real details from their profile. Format as a numbered list.

Contact: ${JSON.stringify(data.contact)}
Company: ${JSON.stringify(data.company)}`,

    persona_analysis: `You are a sales intelligence analyst. Given this contact's profile, provide a brief persona analysis covering: their likely priorities, how they prefer to be approached, what challenges they probably face, and what messaging would resonate. Be specific and practical.

Contact: ${JSON.stringify(data)}`,

    competitive_intel: `You are a competitive intelligence analyst. Given this company profile, identify: 1) What categories of solutions they likely evaluate, 2) Who their probable competitors/alternatives are, 3) What buying signals are present, 4) Key risks for a seller. Be concise.

Company: ${JSON.stringify(data)}`,
  }

  const prompt = prompts[type]
  if (!prompt) return res.status(400).json({ error: 'Invalid insight type' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const result = await response.json()
    const text = result.content?.map(b => b.text || '').join('') || ''
    return res.status(200).json({ insight: text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
