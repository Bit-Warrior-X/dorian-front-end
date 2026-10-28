import { apiRequest } from './client'
import { createRandom, previewSeed, withPreviewFallback } from '@/utils/analyticsPreview'

export const FIREWALL_RULE_TYPES = [
  { ruleType: 'blacklist', label: 'IP / URL blacklist', weight: 0.24 },
  { ruleType: 'geo', label: 'GEO block', weight: 0.17 },
  { ruleType: 'anti-cc', label: 'Anti CC challenge', weight: 0.16 },
  { ruleType: 'second-freq-limit', label: 'Per-second limit', weight: 0.12 },
  { ruleType: 'interval-freq-limit', label: 'Interval limit', weight: 0.09 },
  { ruleType: 'user-agent', label: 'User agent', weight: 0.08 },
  { ruleType: 'anti-header', label: 'Anti header', weight: 0.05 },
  { ruleType: 'response-freq', label: 'Response freq', weight: 0.04 },
  { ruleType: 'ip-reputation', label: 'IP reputation', weight: 0.03 },
  { ruleType: 'temporary-block', label: 'Already on Temporary blocks', weight: 0.02 },
]

const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  return query.toString()
}

export const fetchSecuritySummary = async (params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/summary${suffix ? `?${suffix}` : ''}`)
}

export const fetchSecuritySeries = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/series/${metric}${suffix ? `?${suffix}` : ''}`)
}

export const fetchSecuritySummaryGroup = async (metric, params = {}) => {
  const suffix = buildQuery(params)
  return apiRequest(`/analytics/security/summary/${metric}${suffix ? `?${suffix}` : ''}`)
}

/** Blocks grouped by the WAF rule category that rejected them. Preview rows are scaled to `blockedTotal`. */
export const fetchSecurityRuleTypes = (params = {}, blockedTotal = 0) =>
  withPreviewFallback(
    () => fetchSecuritySummaryGroup('rule-types', params),
    () => {
      const random = createRandom(previewSeed('fw-rules', params))
      const weights = FIREWALL_RULE_TYPES.map((type) => type.weight * (0.6 + random() * 0.8))
      const sum = weights.reduce((total, value) => total + value, 0) || 1
      return FIREWALL_RULE_TYPES.map((type, index) => ({
        ruleType: type.ruleType,
        label: type.label,
        count: Math.round((Number(blockedTotal) || 0) * (weights[index] / sum)),
      })).sort((a, b) => b.count - a.count)
    },
  )

export const fetchSecurityAttacks = async (kind, params = {}) => {
  const query = new URLSearchParams()
  if (params.range) query.set('range', params.range)
  if (params.serverId && params.serverId !== 'all') query.set('serverId', params.serverId)
  if (params.siteId && params.siteId !== 'all') query.set('siteId', params.siteId)
  if (params.start) query.set('start', params.start)
  if (params.end) query.set('end', params.end)
  if (params.limit) query.set('limit', String(params.limit))
  if (params.ip) query.set('ip', String(params.ip))
  const suffix = query.toString()
  return apiRequest(`/analytics/security/attacks/${kind}${suffix ? `?${suffix}` : ''}`)
}
