export const AUDIT_ACTIONS = [
  { value: 'login', label: 'Sign in' },
  { value: 'login_failed', label: 'Sign-in failed' },
  { value: 'logout', label: 'Sign out' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'batch_delete', label: 'Batch delete' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'fork', label: 'Fork' },
  { value: 'assign', label: 'Assign users' },
  { value: 'operate', label: 'Operation' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'password_change', label: 'Password change' },
  { value: 'mfa_enable', label: '2FA enabled' },
  { value: 'mfa_disable', label: '2FA disabled' },
  { value: 'mfa_reset', label: '2FA reset' },
  { value: 'recovery_codes', label: 'Recovery codes' },
  { value: 'token_create', label: 'API token created' },
  { value: 'token_revoke', label: 'API token revoked' },
]

export const AUDIT_CATEGORIES = [
  { value: 'auth', label: 'Authentication' },
  { value: 'api_token', label: 'API tokens' },
  { value: 'user', label: 'Users' },
  { value: 'edge', label: 'Edges' },
  { value: 'listening_port', label: 'Listening ports' },
  { value: 'l4', label: 'L4 protection' },
  { value: 'site', label: 'Sites' },
  { value: 'origin', label: 'Origins' },
  { value: 'cache', label: 'Cache' },
  { value: 'compress', label: 'Compression' },
  { value: 'ports', label: 'Site ports' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'waf', label: 'WAF' },
  { value: 'waf_rule', label: 'WAF rule sets' },
  { value: 'blacklist', label: 'Blocked list' },
]

const actionLabels = Object.fromEntries(AUDIT_ACTIONS.map((item) => [item.value, item.label]))
const categoryLabels = Object.fromEntries(AUDIT_CATEGORIES.map((item) => [item.value, item.label]))

export const formatAuditAction = (value) => {
  const key = String(value || '').toLowerCase()
  return actionLabels[key] || value || 'Event'
}

export const formatAuditCategory = (value) => {
  const key = String(value || '').toLowerCase()
  return categoryLabels[key] || value || '—'
}

export const auditActionClass = (value) => {
  switch (String(value || '').toLowerCase()) {
    case 'login':
      return 'is-login'
    case 'logout':
      return 'is-logout'
    case 'login_failed':
    case 'delete':
    case 'batch_delete':
    case 'token_revoke':
    case 'mfa_disable':
    case 'mfa_reset':
      return 'is-delete'
    case 'create':
    case 'duplicate':
    case 'fork':
    case 'token_create':
    case 'mfa_enable':
      return 'is-create'
    case 'operate':
    case 'upgrade':
      return 'is-operate'
    case 'password_change':
    case 'recovery_codes':
      return 'is-security'
    default:
      return 'is-update'
  }
}

// Back-end details are a summary line followed by "• change" lines.
export const splitAuditDetails = (details) => {
  const lines = String(details || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return { summary: '', changes: [] }
  const [summary, ...rest] = lines
  return {
    summary,
    changes: rest.map((line) => line.replace(/^•\s*/, '')),
  }
}

export const auditSucceeded = (entry) => {
  const status = Number(entry?.statusCode || 0)
  if (String(entry?.action || '').toLowerCase() === 'login_failed') return false
  return !status || status < 400
}

export const auditResultLabel = (entry) => {
  if (auditSucceeded(entry)) return 'Success'
  const status = Number(entry?.statusCode || 0)
  if (status === 401 || status === 403) return `Denied (${status})`
  if (status === 429) return 'Rate limited'
  return status ? `Failed (${status})` : 'Failed'
}

const BROWSERS = [
  [/Edg\/(\d+)/, 'Edge'],
  [/OPR\/(\d+)/, 'Opera'],
  [/Firefox\/(\d+)/, 'Firefox'],
  [/Chrome\/(\d+)/, 'Chrome'],
  [/Version\/(\d+).*Safari/, 'Safari'],
]

const PLATFORMS = [
  [/Windows NT/, 'Windows'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iOS/, 'iOS'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

export const describeUserAgent = (userAgent) => {
  const ua = String(userAgent || '')
  if (!ua) return ''
  if (/^curl\//i.test(ua)) return 'curl'
  let browser = ''
  for (const [pattern, name] of BROWSERS) {
    const match = ua.match(pattern)
    if (match) {
      browser = `${name} ${match[1]}`
      break
    }
  }
  const platform = PLATFORMS.find(([pattern]) => pattern.test(ua))?.[1] || ''
  if (browser && platform) return `${browser} on ${platform}`
  return browser || platform || ua.slice(0, 60)
}
