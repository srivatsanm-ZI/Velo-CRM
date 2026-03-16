import { supabase } from '../../../lib/supabase'

const ZI = 'https://api.zoominfo.com/gtm/data/v1'

function ziHeaders(token) {
  return {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Authorization': `Bearer ${token.replace(/^Bearer\s+/i, '').trim()}`,
  }
}

// Fetch intent signals for a list of ZI company IDs
async function fetchIntent(ziIds, topics, headers) {
  if (!ziIds.length || !topics.length) return {}
  try {
    const res = await fetch(`${ZI}/intent/search?page%5Bnumber%5D=1&page%5Bsize%5D=25`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'IntentSearch',
          attributes: {
            topics: topics.slice(0, 10),
            companyIds: ziIds.slice(0, 25).map(String),
          },
        },
      }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    const map = {}
    for (const item of (data?.data || [])) {
      const coId = String(item.attributes?.companyId || item.id || '')
      if (!coId) continue
      if (!map[coId] || (item.attributes?.score || 0) > (map[coId].score || 0)) {
        map[coId] = {
          score: item.attributes?.score || 0,
          topics: item.attributes?.topics || [],
          signalDate: item.attributes?.signalDate || null,
        }
      }
    }
    return map
  } catch { return {} }
}

// Fetch news for a list of ZI company IDs
async function fetchNews(ziIds, headers) {
  if (!ziIds.length) return {}
  try {
    const res = await fetch(`${ZI}/news/search?page%5Bnumber%5D=1&page%5Bsize%5D=25`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'NewsSearch',
          attributes: {
            companyIds: ziIds.slice(0, 25).map(String),
          },
        },
      }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    const map = {}
    for (const item of (data?.data || [])) {
      const coId = String(item.attributes?.companyId || '')
      if (!coId) continue
      if (!map[coId]) {
        map[coId] = {
          headline: item.attributes?.title || item.attributes?.headline || '',
          date: item.attributes?.publishedDate || item.attributes?.date || null,
          url: item.attributes?.url || null,
        }
      }
    }
    return map
  } catch { return {} }
}

// Fetch scoops for a list of ZI company IDs
async function fetchScoops(ziIds, headers) {
  if (!ziIds.length) return {}
  try {
    const res = await fetch(`${ZI}/scoops/search?page%5Bnumber%5D=1&page%5Bsize%5D=25`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: {
          type: 'ScoopSearch',
          attributes: {
            companyIds: ziIds.slice(0, 25).map(String),
          },
        },
      }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    const map = {}
    for (const item of (data?.data || [])) {
      const coId = String(item.attributes?.companyId || '')
      if (!coId) continue
      if (!map[coId]) {
        map[coId] = {
          title: item.attributes?.scoopTitle || item.attributes?.title || '',
          type: item.attributes?.scoopType || '',
          date: item.attributes?.publishedDate || item.attributes?.date || null,
        }
      }
    }
    return map
  } catch { return {} }
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function signalStrength(intentScore, hasNews, hasScoop) {
  const score = (intentScore || 0)
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

  const { token, mode, topics = [], dayFilter = 0, refresh = false } = req.body

  if (!token) return res.status(400).json({ error: 'ZoomInfo token required' })
  if (!mode) return res.status(400).json({ error: 'mode required: prospect or grow' })

  try {
    // Fetch companies based on mode
    let companiesQuery = supabase.from('companies').select(`
      id, name, industry, employees, city, country, zi_company_id, type,
      created_at, updated_at
    `)

    if (mode === 'grow') {
      // Grow mode: companies linked to won deals
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('company_id, value, created_at, updated_at')
        .eq('stage', 'closed_won')
        .not('company_id', 'is', null)
      const wonIds = [...new Set((wonDeals || []).map(d => d.company_id))]
      if (!wonIds.length) return res.status(200).json({ accounts: [] })
      companiesQuery = companiesQuery.in('id', wonIds)
    } else {
      // Prospect mode: all companies
      companiesQuery = companiesQuery.order('created_at', { ascending: false }).limit(50)
    }

    const { data: companies, error: coErr } = await companiesQuery
    if (coErr) return res.status(500).json({ error: coErr.message })
    if (!companies?.length) return res.status(200).json({ accounts: [] })

    // Get deal history for all companies
    const companyIds = companies.map(c => c.id)
    const { data: allDeals } = await supabase
      .from('deals')
      .select('company_id, stage, value, created_at, title')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    // Get last activity per company
    const { data: activities } = await supabase
      .from('activities')
      .select('company_id, logged_at, created_at')
      .in('company_id', companyIds)
      .order('logged_at', { ascending: false })

    // Build lookup maps
    const dealMap = {}
    const activityMap = {}

    for (const deal of (allDeals || [])) {
      if (!dealMap[deal.company_id]) dealMap[deal.company_id] = []
      dealMap[deal.company_id].push(deal)
    }
    for (const act of (activities || [])) {
      if (!activityMap[act.company_id]) {
        activityMap[act.company_id] = act.logged_at || act.created_at
      }
    }

    // Only fetch ZI signals for companies that have a zi_company_id
    const ziIds = companies.map(c => c.zi_company_id).filter(Boolean)
    const headers = ziHeaders(token)

    const [intentMap, newsMap, scoopsMap] = await Promise.all([
      fetchIntent(ziIds, topics, headers),
      fetchNews(ziIds, headers),
      fetchScoops(ziIds, headers),
    ])

    // Build account objects
    const accounts = companies.map(co => {
      const ziId = co.zi_company_id || ''
      const intent = intentMap[ziId] || null
      const news = newsMap[ziId] || null
      const scoop = scoopsMap[ziId] || null

      const deals = dealMap[co.id] || []
      const openDeal = deals.find(d => !['closed_won','closed_lost'].includes(d.stage))
      const wonDeal = deals.find(d => d.stage === 'closed_won')
      const lostDeal = deals.find(d => d.stage === 'closed_lost')

      const lastTouch = activityMap[co.id] || co.updated_at || co.created_at
      const lastTouchDays = daysSince(lastTouch)

      // Signal age — days since most recent signal
      const signalDates = [
        intent?.signalDate,
        news?.date,
        scoop?.date,
      ].filter(Boolean).map(d => daysSince(d)).filter(v => v !== null)
      const sigAge = signalDates.length ? Math.min(...signalDates) : null

      // Signal tags
      const sigs = []
      const sigLabels = []
      if (intent?.score >= 20) {
        sigs.push('intent')
        const topTopic = Array.isArray(intent.topics) ? intent.topics[0] : intent.topics
        sigLabels.push(topTopic ? `${topTopic} intent` : `Intent score ${intent.score}`)
      }
      if (news?.headline) {
        sigs.push('news')
        sigLabels.push(news.headline.length > 40 ? news.headline.slice(0, 40) + '…' : news.headline)
      }
      if (scoop?.title) {
        const isRisk = scoop.title.toLowerCase().includes('left') || scoop.title.toLowerCase().includes('depart')
        sigs.push(isRisk ? 'risk' : 'scoop')
        sigLabels.push(scoop.title.length > 40 ? scoop.title.slice(0, 40) + '…' : scoop.title)
      }

      const strength = signalStrength(intent?.score, !!news, !!scoop)

      // Deal status label
      let dealLabel = 'No active deal'
      let dealColor = ''
      if (openDeal) { dealLabel = `Open $${openDeal.value ? (openDeal.value >= 1000 ? Math.round(openDeal.value/1000)+'k' : openDeal.value) : '—'}`; dealColor = '#0F6E56' }
      else if (wonDeal) { dealLabel = `Won $${wonDeal.value ? (wonDeal.value >= 1000 ? Math.round(wonDeal.value/1000)+'k' : wonDeal.value) : '—'}`; dealColor = '#185FA5' }
      else if (lostDeal) { dealLabel = `Lost $${lostDeal.value ? (lostDeal.value >= 1000 ? Math.round(lostDeal.value/1000)+'k' : lostDeal.value) : '—'}`; dealColor = '#A32D2D' }

      function ltLabel(days) {
        if (!days) return 'Never'
        if (days < 7) return `${days}d ago`
        if (days < 30) return `${Math.round(days/7)}w ago`
        if (days < 365) return `${Math.round(days/30)}mo ago`
        return `${Math.round(days/365)}y ago`
      }

      return {
        id: co.id,
        name: co.name,
        meta: [co.industry, co.employees ? co.employees+' emp' : null, co.city].filter(Boolean).join(' · '),
        zi_company_id: ziId,
        score: intent?.score || 0,
        strength,
        sigs,
        sigLabels,
        sigAge,
        sigAgeLabel: sigAge !== null ? (sigAge === 0 ? 'Today' : sigAge === 1 ? 'Yesterday' : `${sigAge}d ago`) : '—',
        lt: lastTouchDays || 0,
        ltLabel: ltLabel(lastTouchDays),
        deal: dealLabel,
        dealColor,
        intent: intent ? `Score ${intent.score} · ${Array.isArray(intent.topics) ? intent.topics.slice(0,2).join(', ') : intent.topics || ''}` : '—',
        news: news ? `${news.headline}${news.date ? ' · '+new Date(news.date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''}` : '—',
        scoop: scoop ? `${scoop.title}${scoop.date ? ' · '+new Date(scoop.date).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''}` : '—',
        wonDeal: wonDeal ? { value: wonDeal.value, date: wonDeal.created_at } : null,
      }
    })

    // Sort: high strength first, then by score desc
    const strengthOrder = { high: 0, med: 1, low: 2, none: 3 }
    accounts.sort((a, b) => (strengthOrder[a.strength] - strengthOrder[b.strength]) || (b.score - a.score))

    return res.status(200).json({ accounts })
  } catch (err) {
    console.error('[Signals API]', err)
    return res.status(500).json({ error: err.message })
  }
}
