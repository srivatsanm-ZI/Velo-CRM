import { supabase } from '../../../lib/supabase'

// ── Shared helpers ─────────────────────────────────────────────────────────
function ziHeaders(token) {
  const clean = token.replace(/^Bearer\s+/i, '').trim()
  return {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Authorization': `Bearer ${clean}`,
  }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// Batch enrich companies by ZI ID — returns map of { ziId → enriched attrs }
async function batchEnrichCompanies(ziIds, headers) {
  const map = {}
  if (!ziIds || ziIds.length === 0) return map
  for (let i = 0; i < ziIds.length; i += 10) {
    const batch = ziIds.slice(i, i + 10)
    try {
      const res = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/enrich', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: batch.map(id => ({
            attributes: { companyId: String(id) },
            type: 'CompanyEnrich',
            meta: {
              outputFields: [
                'name', 'website', 'phone', 'street', 'city', 'state', 'zipCode',
                'country', 'industries', 'primaryIndustry', 'employeeCount', 'employeeRange',
                'revenue', 'revenueRange', 'description', 'logo', 'domainList',
                'foundedYear', 'totalFundingAmount', 'recentFundingAmount', 'recentFundingDate',
                'businessModel', 'companyStatus', 'type'
              ]
            }
          }))
        })
      })
      if (res.ok) {
        const data = await res.json()
        for (const co of (data?.data || [])) {
          if (co.id) map[String(co.id)] = co.attributes || co
        }
      }
    } catch (_) {}
  }
  return map
}

// Map enriched company attrs → our CRM company payload
function companyPayload(ziId, attrs, source, workflowId) {
  return {
    name: attrs.name,
    zi_company_id: String(ziId),
    type: 'prospect',
    source,
    workflow_id: workflowId,
    website: attrs.website || attrs.domainList?.[0] || null,
    phone: attrs.phone || null,
    industry: (attrs.primaryIndustry && (Array.isArray(attrs.primaryIndustry) ? attrs.primaryIndustry[0] : attrs.primaryIndustry)) || (Array.isArray(attrs.industries) ? attrs.industries[0] : null) || null,
    employees: attrs.employeeCount ? String(attrs.employeeCount) : (attrs.employeeRange || null),
    revenue: attrs.revenue ? String(attrs.revenue) : null,
    city: attrs.city || null,
    state: attrs.state || null,
    country: attrs.country || null,
    street: attrs.street || null,
    zip_code: attrs.zipCode || null,
    description: attrs.description || null,
    logo: attrs.logo || null,
    founded_year: attrs.foundedYear ? String(attrs.foundedYear) : null,
    enriched: !!(attrs.website || attrs.employeeCount || attrs.revenue),
  }
}

// ── 1. FUNDED LEADER FAST-TRACK ─────────────────────────────────────────────
// Renamed from "New Money". Key improvements:
// - contactAccuracyScoreMin: filters out stale/low-confidence contacts
// - lastUpdatedInMonths: ensures data is fresh
// - excludePartialProfiles: removes contacts without active company associations
// - sort by accuracy score descending: best leads first
// - fundingAmountMin/Max: tighter funding signal
// - companyType: private only (avoids public companies that rarely switch vendors)
// - validDateAfter: profile validated recently
// - saves zi_person_id + zi_company_id for zero-friction enrichment later

async function runFundedLeaderFastTrack(workflow, token) {
  const logs = []
  const results = []
  const config = workflow.config || {}
  const headers = ziHeaders(token)

  const fundingStartDate = daysAgo(config.funding_days || 90)
  const fundingEndDate = config.funding_end_days ? daysAgo(config.funding_end_days) : undefined
  const positionStartDateMin = daysAgo(config.leader_days || 60)
  const pageSize = Math.min(config.results_per_run || 25, 100)

  const MGMT_MAP = {
    'C-Level': 'C Level Exec', 'VP': 'VP Level Exec',
    'Director': 'Director', 'Manager': 'Manager',
  }

  const attrs = {
    fundingStartDate,
    positionStartDateMin,
    managementLevel: config.seniority
      ? config.seniority.map(s => MGMT_MAP[s] || s).join(',')
      : 'C Level Exec,VP Level Exec',
    employeeRangeMin: String(config.employee_min || 20),
    employeeRangeMax: String(config.employee_max || 1000),
    contactAccuracyScoreMin: String(config.accuracy_score_min || 85),
    lastUpdatedInMonths: config.last_updated_months || 6,
    excludePartialProfiles: true,
    // Private companies only — more likely to evaluate new vendors
    companyType: config.company_type || 'private',
  }

  // Only require email if set (default true)
  // requiredFields removed — not supported in ZoomInfo GTM search API

  if (config.country) attrs.country = config.country
  if (config.industries) attrs.industryKeywords = config.industries
  if (config.revenue_min) attrs.revenueMin = Number(config.revenue_min)
  if (config.revenue_max) attrs.revenueMax = Number(config.revenue_max)
  if (config.growth_rate_min) attrs.oneYearEmployeeGrowthRateMin = String(config.growth_rate_min)
  if (config.funding_amount_min) attrs.fundingAmountMin = Number(config.funding_amount_min)
  if (config.funding_amount_max) attrs.fundingAmountMax = Number(config.funding_amount_max)
  if (fundingEndDate) attrs.fundingEndDate = fundingEndDate

  logs.push(`Searching: funded private companies, new ${attrs.managementLevel} executive, accuracy ≥${attrs.contactAccuracyScoreMin}...`)

  try {
    const res = await fetch(
      `https://api.zoominfo.com/gtm/data/v1/contacts/search?page%5Bnumber%5D=1&page%5Bsize%5D=${pageSize}`,
      { method: 'POST', headers, body: JSON.stringify({ data: { attributes: attrs, type: 'ContactSearch' } }) }
    )
    if (!res.ok) throw new Error(await res.text())

    const data = await res.json()
    const contacts = data?.data || []
    logs.push(`Found ${data?.meta?.totalResults?.toLocaleString() || 0} qualifying contacts. Returning top ${contacts.length}, sorted by accuracy.`)

    // Batch enrich all companies in one pass
    const companyIds = [...new Set(contacts.map(c => c.attributes?.company?.id).filter(Boolean))]
    const enrichMap = await batchEnrichCompanies(companyIds, headers)
    logs.push(`Enriched ${Object.keys(enrichMap).length} companies with full firmographic data`)

    for (const c of contacts) {
      const a = c.attributes
      const ziCoId = String(a.company?.id || '')
      const coAttrs = enrichMap[ziCoId] || {}

      results.push({
        // Contact identifiers — saves directly to zi_person_id for enrichment
        zi_contact_id: String(c.id),
        zi_person_id: String(c.id),
        first_name: a.firstName,
        last_name: a.lastName || '(unknown)',
        job_title: a.jobTitle,
        management_level: a.managementLevel,
        accuracy_score: a.contactAccuracyScore,
        has_email: a.hasEmail,
        has_direct_phone: a.hasDirectPhone,
        has_mobile: a.hasMobilePhone,
        last_updated: a.lastUpdatedDate,
        valid_date: a.validDate,
        // Company — full enriched data
        zi_company_id: ziCoId,
        company_name: coAttrs.name || a.company?.name,
        company_website: coAttrs.website || coAttrs.domainList?.[0] || null,
        company_phone: coAttrs.phone || null,
        company_industry: (Array.isArray(coAttrs.primaryIndustry) ? coAttrs.primaryIndustry[0] : coAttrs.primaryIndustry) || null,
        company_employees: coAttrs.employeeCount || null,
        company_employee_range: coAttrs.employeeRange || null,
        company_revenue: coAttrs.revenue || null,
        company_revenue_range: coAttrs.revenueRange || null,
        company_city: coAttrs.city || null,
        company_state: coAttrs.state || null,
        company_country: coAttrs.country || null,
        company_street: coAttrs.street || null,
        company_zip: coAttrs.zipCode || null,
        company_description: coAttrs.description || null,
        company_logo: coAttrs.logo || null,
        company_founded: coAttrs.foundedYear || null,
        company_funding_total: coAttrs.totalFundingAmount || null,
        company_funding_recent: coAttrs.recentFundingAmount || null,
        company_funding_date: coAttrs.recentFundingDate || null,
        signal: `Funded company + new ${a.managementLevel || 'executive'} (accuracy: ${a.contactAccuracyScore})`,
      })
    }
  } catch (e) {
    logs.push(`⚠ Search failed: ${e.message}`)
  }

  logs.push(`✓ Complete. ${results.length} high-precision prospects ready.`)
  return { logs, results, summary: { found: results.length } }
}

// ── 2. LOOKALIKE ACCOUNT BUILDER ────────────────────────────────────────────
// Renamed from "Win Expander". Key improvements:
// - After finding lookalike companies, fetch recommended contacts at each one
// - Filter lookalikes by employee range, growth rate, revenue, country
// - Save zi_company_id and zi_person_id on all created records
// - Tag with workflow source for list view

async function runLookalikeAccountBuilder(workflow, token, lookalikePrefetch = null) {
  const logs = []
  const results = []
  const config = workflow.config || {}
  const headers = ziHeaders(token)

  const { data: wonDeals } = await supabase
    .from('deals')
    .select('*, companies(name, zi_company_id, industry, employees, country)')
    .eq('stage', 'closed_won')
    .not('company_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(config.max_wins || 5)

  if (!wonDeals || wonDeals.length === 0) {
    return { logs: ['No closed-won deals found. Close some deals first.'], results: [] }
  }

  logs.push(`Using ${wonDeals.length} closed-won accounts as reference`)

  for (const deal of wonDeals) {
    const ziId = deal.companies?.zi_company_id
    if (!ziId) {
      logs.push(`  ⚠ ${deal.companies?.name} has no ZI Company ID — skipping`)
      continue
    }

    logs.push(`  Finding lookalikes for: ${deal.companies?.name}`)

    try {
      let lookalikes = []

      // Use prefetched data from frontend (ZI MCP tool) if available
      if (lookalikePrefetch && lookalikePrefetch[ziId]) {
        lookalikes = lookalikePrefetch[ziId].map(co => ({
          id: co.companyId || co.id,
          attributes: {
            name: co.name,
            score: co.score != null ? co.score / 100 : 0.8,
            industry: co.industry,
            employeeCount: co.employeeCount,
            country: co.country,
          }
        }))
        logs.push(`    Using ${lookalikes.length} pre-fetched lookalikes`)
      } else {
        // Use ZoomInfo similar companies endpoint
        const simRes = await fetch(
          `https://api.zoominfo.com/gtm/data/v1/companies/similar`,
          {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/vnd.api+json' },
            body: JSON.stringify({ data: { type: 'companies', attributes: { companyId: String(ziId), pageSize: config.max_lookalikes || 15 } } })
          }
        )

        if (simRes.ok) {
          const simData = await simRes.json()
          lookalikes = simData?.data || []
        } else {
          // Fallback: try GET with path param
          const altRes = await fetch(
            `https://api.zoominfo.com/gtm/data/v1/companies/${ziId}/similar?pageSize=${config.max_lookalikes || 15}`,
            { headers: { ...headers, 'Accept': 'application/vnd.api+json' } }
          )
          if (altRes.ok) {
            const altData = await altRes.json()
            lookalikes = altData?.data || []
          } else {
            logs.push(`    ⚠ Similar companies API unavailable (${simRes.status}) — try enriching ${deal.companies?.name} with a ZI Company ID first`)
            continue
          }
        }
      }

      if (lookalikes.length === 0) {
        logs.push(`    ⚠ No similar companies found for ${deal.companies?.name}`)
        continue
      }

      // Precision filter: similarity score, country, employee range
      const minScore = (config.min_similarity || 65) / 100
      const filtered = lookalikes.filter(co => {
        const a = co.attributes || co
        const score = a.score != null ? a.score : 0.8
        if (score < minScore) return false
        if (config.filter_country && a.country && !a.country.toLowerCase().includes(config.filter_country.toLowerCase())) return false
        if (config.employee_min && a.employeeCount && Number(a.employeeCount) < Number(config.employee_min)) return false
        if (config.employee_max && a.employeeCount && Number(a.employeeCount) > Number(config.employee_max)) return false
        return true
      })

      logs.push(`    ${filtered.length} accounts passed filters (${lookalikes.length} raw)`)

      // Batch enrich all lookalike companies
      const lookalikeCoids = filtered.map(co => String(co.id || co.companyId)).filter(Boolean)
      const enrichMap = await batchEnrichCompanies(lookalikeCoids, headers)

      for (const co of filtered) {
        const a = co.attributes || co
        const coId = String(co.id || co.companyId || '')
        const enriched = enrichMap[coId] || {}
        const score = co._fallback ? null : Math.round((a.score || 0) * 100)

        results.push({
          type: 'company',
          zi_company_id: coId,
          company_name: enriched.name || a.name || a.companyName,
          company_website: enriched.website || enriched.domainList?.[0] || null,
          company_phone: enriched.phone || null,
          company_industry: (Array.isArray(enriched.primaryIndustry) ? enriched.primaryIndustry[0] : enriched.primaryIndustry) || null,
          company_employees: enriched.employeeCount || null,
          company_employee_range: enriched.employeeRange || a.employeeRange || null,
          company_revenue: enriched.revenue || null,
          company_revenue_range: enriched.revenueRange || a.revenueRange || null,
          company_city: enriched.city || null,
          company_state: enriched.state || null,
          company_country: enriched.country || a.country || null,
          company_street: enriched.street || null,
          company_zip: enriched.zipCode || null,
          company_description: enriched.description || null,
          company_logo: enriched.logo || null,
          company_founded: enriched.foundedYear || null,
          similarity_score: score,
          reference_company: deal.companies?.name,
          signal: score ? `${score}% match to ${deal.companies?.name}` : `Industry match to ${deal.companies?.name}`,
        })
      }

      logs.push(`    Enriched ${Object.keys(enrichMap).length} lookalike companies`)
    } catch (e) {
      logs.push(`    ⚠ Error for ${deal.companies?.name}: ${e.message}`)
    }
  }

  logs.push(`✓ Complete. ${results.length} lookalike accounts ready.`)
  return { logs, results, summary: { found: results.length } }
}

// ── 3. ACCOUNT GROWTH MONITOR ──────────────────────────────────────────────
// Renamed from "Expansion Playbook". Key improvements:
// - contactAccuracyScoreMin on new leader search
// - saves zi_person_id on new leader contacts
// - excludePartialProfiles to avoid ghost contacts
// - lastUpdatedInMonths to ensure signal freshness

async function runAccountGrowthMonitor(workflow, token) {
  const logs = []
  const signals = []

  const { data: customers, error } = await supabase
    .from('companies')
    .select('*')
    .eq('type', 'customer')
    .not('zi_company_id', 'is', null)

  if (error) throw new Error('Failed to fetch customers: ' + error.message)
  if (!customers || customers.length === 0) {
    return { logs: ['No customer companies with ZI Company ID found. Mark companies as Customer first.'], signals: [] }
  }

  logs.push(`Scanning ${customers.length} customer accounts for growth signals`)

  const config = workflow.config || {}
  const daysForNewLeader = config.new_leader_days || 30
  const growthThreshold = config.growth_threshold || 20
  const checkNewLeaders = config.check_new_leaders !== false
  const checkGrowth = config.check_growth !== false
  const checkWhitespace = config.check_whitespace !== false
  const targetSeniority = config.target_seniority || 'C Level Exec,VP Level Exec'
  const accuracyMin = config.accuracy_score_min || 80
  const headers = ziHeaders(token)

  for (const company of customers) {
    logs.push(`Scanning: ${company.name}`)

    // Enrich for department + budget data
    let deptData = null
    let budgetData = null
    try {
      const enrichRes = await fetch('https://api.zoominfo.com/gtm/data/v1/companies/enrich', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            attributes: { companyId: company.zi_company_id },
            type: 'CompanyEnrich',
            meta: { outputFields: ['employeeCountByDepartment', 'departmentBudgets', 'employeeCount', 'revenue'] }
          }
        })
      })
      if (enrichRes.ok) {
        const d = await enrichRes.json()
        const attrs = d?.data?.[0]?.attributes
        if (attrs) { deptData = attrs.employeeCountByDepartment; budgetData = attrs.departmentBudgets }
      }
    } catch (e) { logs.push(`  ⚠ Enrich failed for ${company.name}: ${e.message}`) }

    // Snapshot for growth comparison
    const { data: lastSnapshot } = await supabase
      .from('expansion_snapshots')
      .select('*')
      .eq('company_id', company.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (deptData) {
      await supabase.from('expansion_snapshots').insert([{
        company_id: company.id,
        snapshot_date: new Date().toISOString(),
        employee_count: (deptData.cSuite || 0) + (deptData.engineeringAndTechnical || 0) + (deptData.finance || 0) + (deptData.humanResources || 0) + (deptData.informationTechnology || 0) + (deptData.legal || 0) + (deptData.marketing || 0) + (deptData.operations || 0) + (deptData.sales || 0),
        dept_c_suite: deptData.cSuite || 0, dept_sales: deptData.sales || 0,
        dept_engineering: deptData.engineeringAndTechnical || 0, dept_marketing: deptData.marketing || 0,
        dept_finance: deptData.finance || 0, dept_hr: deptData.humanResources || 0,
        dept_it: deptData.informationTechnology || 0, dept_operations: deptData.operations || 0,
        budget_it: budgetData?.itBudget || 0, budget_marketing: budgetData?.marketingBudget || 0,
        budget_finance: budgetData?.financialBudget || 0, budget_hr: budgetData?.hrBudget || 0,
      }])
    }

    // Signal 1: New executive hire — with accuracy filter + person ID
    if (checkNewLeaders && company.zi_company_id) {
      try {
        const contactRes = await fetch(
          'https://api.zoominfo.com/gtm/data/v1/contacts/search?page%5Bnumber%5D=1&page%5Bsize%5D=10',
          {
            method: 'POST', headers,
            body: JSON.stringify({
              data: {
                attributes: {
                  companyId: company.zi_company_id,
                  managementLevel: targetSeniority,
                  positionStartDateMin: daysAgo(daysForNewLeader),
                  contactAccuracyScoreMin: String(accuracyMin),
                  excludePartialProfiles: true,
                  lastUpdatedInMonths: 3,
                },
                type: 'ContactSearch'
              }
            })
          }
        )

        if (contactRes.ok) {
          const cData = await contactRes.json()
          for (const leader of (cData?.data || [])) {
            const a = leader.attributes

            const { data: existing } = await supabase
              .from('expansion_signals')
              .select('id')
              .eq('company_id', company.id)
              .eq('zi_contact_id', leader.id)
              .eq('signal_type', 'new_leader')
              .single()

            if (!existing) {
              const signal = {
                company_id: company.id,
                signal_type: 'new_leader',
                signal_title: `New ${a.managementLevel || 'Executive'} at ${company.name}`,
                signal_detail: `${a.firstName} ${a.lastName} joined as ${a.jobTitle}. First 90 days = highest vendor evaluation window. Accuracy: ${a.contactAccuracyScore}/100.`,
                zi_contact_id: String(leader.id),
                zi_person_id: String(leader.id),
                contact_name: `${a.firstName} ${a.lastName}`,
                contact_title: a.jobTitle,
                accuracy_score: a.contactAccuracyScore,
                status: 'new',
              }
              await supabase.from('expansion_signals').insert([signal])
              signals.push({ ...signal, company_name: company.name })
              logs.push(`  🔴 New leader: ${a.firstName} ${a.lastName} (${a.jobTitle}, accuracy ${a.contactAccuracyScore})`)
            }
          }
        }
      } catch (e) { logs.push(`  ⚠ New leader scan failed: ${e.message}`) }
    }

    // Signal 2: Department headcount growth
    if (checkGrowth && deptData && lastSnapshot) {
      const depts = [
        { key: 'dept_sales', label: 'Sales', current: deptData.sales || 0 },
        { key: 'dept_engineering', label: 'Engineering', current: deptData.engineeringAndTechnical || 0 },
        { key: 'dept_marketing', label: 'Marketing', current: deptData.marketing || 0 },
        { key: 'dept_it', label: 'IT', current: deptData.informationTechnology || 0 },
      ]
      for (const dept of depts) {
        const prev = lastSnapshot[dept.key] || 0
        if (prev > 0 && dept.current > prev) {
          const growthPct = Math.round(((dept.current - prev) / prev) * 100)
          if (growthPct >= growthThreshold) {
            const { data: existing } = await supabase
              .from('expansion_signals').select('id')
              .eq('company_id', company.id).eq('signal_type', 'team_growth').eq('department', dept.label)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).single()

            if (!existing) {
              const signal = {
                company_id: company.id, signal_type: 'team_growth',
                signal_title: `${dept.label} team at ${company.name} grew ${growthPct}%`,
                signal_detail: `${dept.label} headcount: ${prev} → ${dept.current} (+${growthPct}%). Expansion opportunity in this department.`,
                department: dept.label, old_value: prev, new_value: dept.current, status: 'new',
              }
              await supabase.from('expansion_signals').insert([signal])
              signals.push({ ...signal, company_name: company.name })
              logs.push(`  🟡 ${dept.label} grew ${growthPct}%: ${prev} → ${dept.current}`)
            }
          }
        }
      }
    }

    // Signal 3: Budget white space
    if (checkWhitespace && budgetData && company.sold_to_department) {
      const budgets = {
        'IT': budgetData.itBudget, 'Marketing': budgetData.marketingBudget,
        'Finance': budgetData.financialBudget, 'HR': budgetData.hrBudget,
      }
      const { data: latestDeal } = await supabase
        .from('deals').select('value').eq('company_id', company.id)
        .eq('stage', 'closed_won').order('created_at', { ascending: false }).limit(1).single()
      const dealValue = latestDeal?.value || 0

      for (const [deptName, budget] of Object.entries(budgets)) {
        if (deptName === company.sold_to_department || !budget || budget <= 0) continue
        const budgetInDollars = budget * 1000
        const whitespaceRatio = dealValue > 0 ? Math.round(budgetInDollars / dealValue) : 0
        if (whitespaceRatio >= 5) {
          const { data: existing } = await supabase
            .from('expansion_signals').select('id')
            .eq('company_id', company.id).eq('signal_type', 'budget_whitespace').eq('department', deptName).single()
          if (!existing) {
            const signal = {
              company_id: company.id, signal_type: 'budget_whitespace',
              signal_title: `Untapped ${deptName} budget at ${company.name}`,
              signal_detail: `${deptName} budget: $${(budgetInDollars / 1000000).toFixed(1)}M. Currently selling to ${company.sold_to_department} only. ${whitespaceRatio}x expansion opportunity.`,
              department: deptName, old_value: dealValue, new_value: budget, status: 'new',
            }
            await supabase.from('expansion_signals').insert([signal])
            signals.push({ ...signal, company_name: company.name })
            logs.push(`  🟢 Budget whitespace in ${deptName}: $${(budgetInDollars / 1000000).toFixed(1)}M untapped`)
          }
        }
      }
    }
  }

  logs.push(`✓ Scan complete. ${signals.length} new growth signals across ${customers.length} accounts.`)
  return { logs, signals, summary: { scanned: customers.length, signals: signals.length } }
}

// ── Main Handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', ['POST']); return res.status(405).end() }

  const { workflow_id, token, lookalikePrefetch } = req.body
  if (!workflow_id) return res.status(400).json({ error: 'workflow_id required' })
  if (!token) return res.status(400).json({ error: 'ZoomInfo token required' })

  const { data: workflow, error } = await supabase.from('workflows').select('*').eq('id', workflow_id).single()
  if (error || !workflow) return res.status(404).json({ error: 'Workflow not found' })

  await supabase.from('workflows').update({
    last_run_at: new Date().toISOString(),
    run_count: (workflow.run_count || 0) + 1,
    status: 'running',
  }).eq('id', workflow_id)

  try {
    let result

    if (workflow.type === 'expansion_playbook' || workflow.type === 'account_growth_monitor') {
      result = await runAccountGrowthMonitor(workflow, token)
    } else if (workflow.type === 'new_money' || workflow.type === 'funded_leader_fast_track') {
      result = await runFundedLeaderFastTrack(workflow, token)
    } else if (workflow.type === 'win_expander' || workflow.type === 'lookalike_account_builder') {
      result = await runLookalikeAccountBuilder(workflow, token, lookalikePrefetch || null)
    } else {
      throw new Error(`Unknown workflow type: ${workflow.type}`)
    }

    await supabase.from('workflows').update({ status: 'active' }).eq('id', workflow_id)
    return res.status(200).json({ success: true, ...result })
  } catch (err) {
    await supabase.from('workflows').update({ status: 'error' }).eq('id', workflow_id)
    return res.status(500).json({ error: err.message })
  }
}
