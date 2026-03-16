import { supabase } from '../../../lib/supabase'

const ZI = 'https://api.zoominfo.com/gtm/data/v1'

function ziHeaders(token) {
  return {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Authorization': `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`,
  }
}

// Enrich intent for ONE company using the correct endpoint
// POST /gtm/data/v1/intent/enrich — requires companyId + topics
async function enrichIntent(ziId, topics, headers) {
  try {
    const res = await fetch(`${ZI}/intent/enrich`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'IntentEnrich',
          attributes: {
            companyId: String(ziId),
            topics: topics.slice(0, 10),
          },
        },
      }),
    })
    const rawText = await res.text()
    console.log(`[Intent Enrich] companyId=${ziId} status=${res.status} response=${rawText.slice(0,300)}`)
    if (!res.ok) return null
    const data = JSON.parse(rawText)
    // Response: { data: [ { id, type, attributes: { score, topics, signalDate, ... } } ] }
    const item = data?.data?.[0]
    if (!item) return null
    return {
      score: item.attributes?.score || item.attributes?.signalScore || 0,
      topics: item.attributes?.topics || item.attributes?.intentTopics || [],
      signalDate: item.attributes?.signalDate || item.attributes?.date || null,
    }
  } catch (e) {
    console.error(`[Intent Enrich] error for ${ziId}:`, e.message)
    return null
  }
}

// Enrich news for ONE company
// POST /gtm/data/v1/news/enrich
async function enrichNews(ziId, headers) {
  try {
    const res = await fetch(`${ZI}/news/enrich`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'NewsEnrich',
          attributes: { companyId: String(ziId) },
        },
      }),
    })
    const rawText = await res.text()
    console.log(`[News Enrich] companyId=${ziId} status=${res.status} response=${rawText.slice(0,300)}`)
    if (!res.ok) return null
    const data = JSON.parse(rawText)
    const item = data?.data?.[0]
    if (!item?.attributes) return null
    return {
      headline: item.attributes?.title || item.attributes?.headline || '',
      date: item.attributes?.publishedDate || item.attributes?.date || null,
      url: item.attributes?.url || null,
    }
  } catch { return null }
}

// Enrich scoops for ONE company
// POST /gtm/data/v1/scoops/enrich
async function enrichScoops(ziId, headers) {
  try {
    const res = await fetch(`${ZI}/scoops/enrich`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'ScoopEnrich',
          attributes: { companyId: String(ziId) },
        },
      }),
    })
    const rawText = await res.text()
    console.log(`[Scoops Enrich] companyId=${ziId} status=${res.status} response=${rawText.slice(0,300)}`)
    if (!res.ok) return null
    const data = JSON.parse(rawText)
    const item = data?.data?.[0]
    if (!item?.attributes) return null
    return {
      title: item.attributes?.scoopTitle || item.attributes?.title || '',
      type: item.attributes?.scoopType || '',
      date: item.attributes?.publishedDate || item.attributes?.date || null,
    }
  } catch { return null }
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function signalStrength(intentScore, hasNews, hasScoop) {
  const score = intentScore || 0
  if (score >= 70 || (score >= 50 && (hasNews || hasScoop))) return 'high'
  if (score >= 40 || ((hasNews || hasScoop) && score >= 20)) return 'med'
  if (score >= 20 || hasNews || hasScoop) return 'low'
  return 'none'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const { token, mode, topics = [] } = req.body

  if (!token) return res.status(400).json({ error: 'ZoomInfo token required' })
  if (!mode)  return res.status(400).json({ error: 'mode required: prospect or grow' })
  if (!topics.length) return res.status(400).json({ error: 'At least one intent topic required' })

  try {
    // Fetch companies based on mode
    let companiesQuery = supabase
      .from('companies')
      .select('id, name, industry, employees, city, country, zi_company_id, type, created_at, updated_at')

    if (mode === 'grow') {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('company_id')
        .eq('stage', 'closed_won')
        .not('company_id', 'is', null)
      const wonIds = [...new Set((wonDeals || []).map(d => d.company_id))]
      if (!wonIds.length) return res.status(200).json({ accounts: [] })
      companiesQuery = companiesQuery.in('id', wonIds)
    } else {
      companiesQuery = companiesQuery.order('created_at', { ascending: false }).limit(25)
    }

    const { data: companies, error: coErr } = await companiesQuery
    if (coErr) return res.status(500).json({ error: coErr.message })
    if (!companies?.length) return res.status(200).json({ accounts: [] })

    // Get deal history
    const companyIds = companies.map(c => c.id)
    const { data: allDeals } = await supabase
      .from('deals')
      .select('company_id, stage, value, created_at, title')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    const { data: activities } = await supabase
      .from('activities')
      .select('company_id, logged_at, created_at')
      .in('company_id', companyIds)
      .order('logged_at', { ascending: false })

    const dealMap = {}
    const activityMap = {}
    for (const d of (allDeals || [])) {
      if (!dealMap[d.company_id]) dealMap[d.company_id] = []
      dealMap[d.company_id].push(d)
    }
    for (const a of (activities || [])) {
      if (!activityMap[a.company_id]) activityMap[a.company_id] = a.logged_at || a.created_at
    }

    const headers = ziHeaders(token)

    // Fetch signals per company — only for companies with zi_company_id
    // Run in parallel but limit to avoid rate limits
    const enrichedCompanies = await Promise.all(
      companies.map(async co => {
        const ziId = co.zi_company_id
        if (!ziId) return { co, intent: null, news: null, scoop: null }
        const [intent, news, scoop] = await Promise.all([
          enrichIntent(ziId, topics, headers),
          enrichNews(ziId, headers),
          enrichScoops(ziId, headers),
        ])
        return { co, intent, news, scoop }
      })
    )

    // Build account objects
    const accounts = enrichedCompanies.map(({ co, intent, news, scoop }) => {
      const deals = dealMap[co.id] || []
      const openDeal = deals.find(d => !['closed_won','closed_lost'].includes(d.stage))
      const wonDeal  = deals.find(d => d.stage === 'closed_won')
      const lostDeal = deals.find(d => d.stage === 'closed_lost')

      const lastTouch = activityMap[co.id] || co.updated_at || co.created_at
      const lastTouchDays = daysSince(lastTouch) || 0

      // Signal age
      const signalDates = [intent?.signalDate, news?.date, scoop?.date]
        .filter(Boolean).map(d => daysSince(d)).filter(v => v !== null)
      const sigAge = signalDates.length ? Math.min(...signalDates) : null

      // Signal tags
      const sigs = []
      const sigLabels = []
      if (intent?.score >= 10) {
        sigs.push('intent')
        const topTopic = Array.isArray(intent.topics) ? intent.topics[0] : intent.topics
        sigLabels.push(topTopic ? `${topTopic} intent` : `Intent score ${intent.score}`)
      }
      if (news?.headline) {
        sigs.push('news')
        sigLabels.push(news.headline.length > 45 ? news.headline.slice(0, 45) + '…' : news.headline)
      }
      if (scoop?.title) {
        const isRisk = /left|depart|resign/i.test(scoop.title)
        sigs.push(isRisk ? 'risk' : 'scoop')
        sigLabels.push(scoop.title.length > 45 ? scoop.title.slice(0, 45) + '…' : scoop.title)
      }

      const strength = signalStrength(intent?.score, !!news, !!scoop)

      let dealLabel = 'No active deal', dealColor = ''
      if (openDeal)      { dealLabel = `Open $${openDeal.value >= 1000 ? Math.round(openDeal.value/1000)+'k' : openDeal.value||'—'}`; dealColor = '#059669' }
      else if (wonDeal)  { dealLabel = `Won $${wonDeal.value  >= 1000 ? Math.round(wonDeal.value/1000)+'k'  : wonDeal.value||'—'}`;  dealColor = '#1d4ed8' }
      else if (lostDeal) { dealLabel = `Lost $${lostDeal.value >= 1000 ? Math.round(lostDeal.value/1000)+'k' : lostDeal.value||'—'}`; dealColor = '#dc2626' }

      function ltLabel(d) {
        if (!d) return 'Never'
        if (d < 7)   return `${d}d ago`
        if (d < 30)  return `${Math.round(d/7)}w ago`
        if (d < 365) return `${Math.round(d/30)}mo ago`
        return `${Math.round(d/365)}y ago`
      }

      return {
        id: co.id,
        name: co.name,
        meta: [co.industry, co.employees ? co.employees+' emp' : null, co.city].filter(Boolean).join(' · '),
        zi_company_id: co.zi_company_id || '',
        score: intent?.score || 0,
        strength,
        sigs,
        sigLabels,
        sigAge,
        sigAgeLabel: sigAge !== null ? (sigAge === 0 ? 'Today' : sigAge === 1 ? 'Yesterday' : `${sigAge}d ago`) : '—',
        lt: lastTouchDays,
        ltLabel: ltLabel(lastTouchDays),
        deal: dealLabel,
        dealColor,
        intent: intent ? `Score ${intent.score} · ${Array.isArray(intent.topics) ? intent.topics.slice(0,2).join(', ') : intent.topics || '—'}` : '—',
        news:  news  ? `${news.headline}${news.date ? ' · '+new Date(news.date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''}` : '—',
        scoop: scoop ? `${scoop.title}${scoop.date ? ' · '+new Date(scoop.date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''}` : '—',
      }
    })

    // Sort: high first, then by score
    const order = { high:0, med:1, low:2, none:3 }
    accounts.sort((a,b) => (order[a.strength]-order[b.strength]) || (b.score-a.score))

    return res.status(200).json({ accounts })

  } catch (err) {
    console.error('[Signals API]', err)
    return res.status(500).json({ error: err.message })
  }
}
