import { fetchAntiCcRules } from '@/api/wafAntiCc'
import { fetchAntiHeaderRules } from '@/api/wafAntiHeader'
import { fetchBlacklistRules } from '@/api/wafBlacklist'
import { fetchGeoRules } from '@/api/wafGeoLocation'
import { fetchIntervalRules } from '@/api/wafIntervalFreqLimit'
import { fetchResponseRules } from '@/api/wafResponseFreq'
import { fetchSecondRules } from '@/api/wafSecondFreqLimit'
import { fetchUserAgentRules } from '@/api/wafUserAgent'
import { fetchWhitelistRules } from '@/api/wafWhitelist'

const WINDOW_LABELS = {
  1: '1s',
  5: '5s',
  10: '10s',
  30: '30s',
  60: '1m',
}

const toWindowLabel = (seconds) => WINDOW_LABELS[Number(seconds)] || `${seconds}s`

const displayBehavior = (value) => {
  if (!value) return ''
  return value === 'Drop+Block' ? 'DROP+BLOCK' : String(value).toUpperCase()
}

const formatMethodValue = (method) => {
  const value = String(method || '').trim()
  return value || 'ANY'
}

const isDisabled = (status) => String(status || '').toUpperCase() === 'DISABLE'

const field = (label, value) => {
  if (value == null || value === '') return null
  return { label, value: String(value) }
}

const buildSummary = (type, parts, disabled = false) => ({
  type,
  parts: parts.filter(Boolean),
  disabled,
})

const safeList = async (fetcher, scope) => {
  try {
    const data = await fetcher(scope)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function fetchAllWafSubRules(wafRuleId) {
  const scope = { wafRuleId }
  const [
    whitelist,
    blacklist,
    geolocation,
    antiCc,
    antiHeader,
    intervalFreqLimit,
    secondFreqLimit,
    responseFreq,
    userAgent,
  ] = await Promise.all([
    safeList(fetchWhitelistRules, scope),
    safeList(fetchBlacklistRules, scope),
    safeList(fetchGeoRules, scope),
    safeList(fetchAntiCcRules, scope),
    safeList(fetchAntiHeaderRules, scope),
    safeList(fetchIntervalRules, scope),
    safeList(fetchSecondRules, scope),
    safeList(fetchResponseRules, scope),
    safeList(fetchUserAgentRules, scope),
  ])

  return {
    whitelist,
    blacklist,
    geolocation,
    antiCc,
    antiHeader,
    intervalFreqLimit,
    secondFreqLimit,
    responseFreq,
    userAgent,
  }
}

export function formatWafRuleSummaries(groups) {
  const summaries = []

  for (const rule of groups.whitelist || []) {
    summaries.push(
      buildSummary('Whitelist', [
        field('HTTP', formatMethodValue(rule.method)),
        field('URL', rule.url || '.*'),
        field('IP', rule.ips),
      ]),
    )
  }

  for (const rule of groups.blacklist || []) {
    summaries.push(
      buildSummary('Blacklist', [
        field('HTTP', formatMethodValue(rule.method)),
        field('URL', rule.url || '.*'),
        field('IP', rule.ips),
        field('BEHAVIOR', displayBehavior(rule.behavior)),
      ]),
    )
  }

  for (const rule of groups.geolocation || []) {
    summaries.push(
      buildSummary(
        'GEO',
        [
          field('URL', rule.url || '.*'),
          field('COUNTRY', rule.country),
          field('OPERATION', rule.operation ? String(rule.operation).toUpperCase() : ''),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.antiCc || []) {
    summaries.push(
      buildSummary(
        'Anti CC',
        [
          field('HTTP', formatMethodValue(rule.method)),
          field('URL', rule.url || '.*'),
          field('THRESHOLD', rule.threshold ?? 0),
          field('WINDOW', toWindowLabel(rule.window)),
          field('ACTION', rule.action ? String(rule.action).toLowerCase() : ''),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.antiHeader || []) {
    summaries.push(
      buildSummary(
        'Anti Header',
        [
          field('URL', rule.url || '.*'),
          field('HEADER', rule.header),
          field('VALUE', rule.value),
          field('BLOCK MODE', rule.blockMode ? String(rule.blockMode).toUpperCase() : ''),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.intervalFreqLimit || []) {
    summaries.push(
      buildSummary(
        'Interval Freq Limit',
        [
          field('URL', rule.url || '.*'),
          field('TIME', `${rule.time ?? 0}s`),
          field('REQUEST COUNT', rule.requestCount ?? 0),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.secondFreqLimit || []) {
    summaries.push(
      buildSummary(
        'Second Freq Limit',
        [
          field('URL', rule.url || '.*'),
          field('REQUEST COUNT', rule.requestCount ?? 0),
          field('BURST', rule.burst ?? 0),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.responseFreq || []) {
    summaries.push(
      buildSummary(
        'Response Freq',
        [
          field('URL', rule.url || '.*'),
          field('RESPONSE CODE', rule.responseCode),
          field('TIME', `${rule.time ?? 0}s`),
          field('RESPONSE COUNT', rule.responseCount ?? 0),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  for (const rule of groups.userAgent || []) {
    summaries.push(
      buildSummary(
        'User Agent',
        [
          field('URL', rule.url || '.*'),
          field('USER AGENT', rule.userAgent),
          field('MATCH', rule.match ? String(rule.match).toUpperCase() : ''),
          field('BEHAVIOR', displayBehavior(rule.behavior)),
        ],
        isDisabled(rule.status),
      ),
    )
  }

  return summaries
}

export async function fetchWafRuleSummaries(wafRuleId) {
  const groups = await fetchAllWafSubRules(wafRuleId)
  return formatWafRuleSummaries(groups)
}

/** @deprecated Use fetchWafRuleSummaries instead */
export async function fetchWafRuleSummaryLines(wafRuleId) {
  return fetchWafRuleSummaries(wafRuleId)
}
