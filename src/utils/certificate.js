export const CERT_STATUS_LABELS = {
  none: 'Not configured',
  queued: 'Queued',
  pending: 'Queued',
  dns: 'Publishing DNS',
  validating: "Let's Encrypt checking",
  syncing: 'Pushing to edges',
  valid: 'Valid',
  expiring: 'Expiring soon',
  expired: 'Expired',
  failed: 'Failed',
}

export const CERT_STATUS_DETAILS = {
  none: 'No certificate is configured for this hostname.',
  queued: 'Issuance is queued and will start in the background.',
  pending: 'Issuance is queued and will start in the background.',
  dns: 'Writing the DNS-01 TXT record to acme-validation.dorian.center.',
  validating: "Let's Encrypt is verifying the DNS-01 challenge.",
  syncing: 'Certificate is issued and being pushed to selected edges.',
  valid: 'Certificate is active and will be used for HTTPS.',
  expiring: 'Certificate is still valid but should be renewed soon.',
  expired: 'Certificate has expired. HTTPS may fail until it is renewed.',
  failed: 'Automatic issuance failed. Check the error below and retry.',
}

const ISSUING_STATUSES = new Set(['queued', 'pending', 'dns', 'validating', 'syncing'])

export const normalizeCertStatus = (value) => String(value || 'none').toLowerCase()

export const isCertIssuing = (value) => ISSUING_STATUSES.has(normalizeCertStatus(value))

export const formatCertStatus = (value) =>
  CERT_STATUS_LABELS[normalizeCertStatus(value)] || normalizeCertStatus(value)

export const certStatusDetail = (value) =>
  CERT_STATUS_DETAILS[normalizeCertStatus(value)] || ''

export const certStatusClass = (value, prefix = 'is-') => {
  const status = normalizeCertStatus(value)
  if (status === 'valid') return `${prefix}valid`
  if (status === 'expiring') return `${prefix}expiring`
  if (status === 'expired' || status === 'failed') return `${prefix}failed`
  if (isCertIssuing(status)) return `${prefix}pending`
  return `${prefix}none`
}

export const formatCertExpiry = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const formatted = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (days < 0) return `${formatted} · expired ${Math.abs(days)}d ago`
  if (days === 0) return `${formatted} · expires today`
  return `${formatted} · ${days}d left`
}
