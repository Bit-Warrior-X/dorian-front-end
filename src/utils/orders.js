export const ORDER_PURPOSES = [
  {
    id: 'site_own',
    title: 'Site protection · own edge',
    hint: 'Websites hosted on your server. Web attack protection (L7), L4 optional.',
  },
  {
    id: 'site_platform',
    title: 'Site protection · platform edge',
    hint: 'Your websites behind Dorian edges. Just point your domain — nothing to install.',
  },
  {
    id: 'edge',
    title: 'Edge protection',
    hint: 'Network flood protection (L4) for any service on your server. No websites.',
  },
  {
    id: 'edge_site',
    title: 'Edge + site protection',
    hint: 'Full protection on your server: network floods (L4) and websites (L7).',
  },
]

export const ORDER_STATUS = {
  draft: { label: 'Draft', tone: 'muted' },
  awaiting_payment: { label: 'Awaiting payment', tone: 'warn' },
  awaiting_setup: { label: 'Awaiting setup', tone: 'info' },
  provisioning: { label: 'Setting up', tone: 'info' },
  active: { label: 'Active', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

export const LICENSE_STATUS = {
  active: { label: 'Active', tone: 'ok' },
  past_due: { label: 'Past due', tone: 'warn' },
  expired: { label: 'Expired', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

export const LICENSE_KIND_LABEL = {
  L4: 'Edge · L4',
  L7: 'Edge · L7',
  Unified: 'Edge · L4 + L7',
  SITE_OWN: 'Site · own edge',
  SITE_PLATFORM: 'Site · platform',
}

export const purposeTitle = (purpose) => {
  if (purpose === 'addon') return 'Add-on'
  if (purpose === 'renewal') return 'Renewal'
  return ORDER_PURPOSES.find((p) => p.id === purpose)?.title || purpose
}

export const orderStatusMeta = (order) => {
  if (order?.status === 'provisioning' && order?.error) return { label: 'Setup failed', tone: 'danger' }
  return ORDER_STATUS[order?.status] || { label: order?.status || '—', tone: 'muted' }
}

export const formatMoney = (value, currency = 'USD') => {
  const amount = Number(value) || 0
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const periodLabel = (period) => (period === 'month' ? 'Monthly' : 'Annual')

export const daysUntil = (value) => {
  const t = Date.parse(value)
  if (!Number.isFinite(t)) return null
  return Math.ceil((t - Date.now()) / 86_400_000)
}

export const orderSummary = (order) => {
  const edges = order?.details?.edges?.length || 0
  const sites = order?.details?.sites?.length || 0
  const upgrades = order?.details?.upgradeServerIds?.length || 0
  const renewals = order?.details?.renewLicenseIds?.length || 0
  const parts = []
  if (edges) parts.push(`${edges} edge${edges === 1 ? '' : 's'}`)
  if (sites) parts.push(`${sites} site${sites === 1 ? '' : 's'}`)
  if (upgrades) parts.push(`${upgrades} L4 upgrade${upgrades === 1 ? '' : 's'}`)
  if (renewals) parts.push(`${renewals} license${renewals === 1 ? '' : 's'}`)
  return parts.join(' · ') || '—'
}
