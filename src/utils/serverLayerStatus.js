/** Whether the license tier includes this layer. */
export function isLayerLicensed(license, layer) {
  const lic = String(license || '').trim().toLowerCase()
  if (layer === 'l4') {
    return lic === 'trial' || lic === 'l4' || lic === 'unified'
  }
  if (layer === 'l7') {
    return lic === 'trial' || lic === 'l7' || lic === 'unified'
  }
  return false
}

function isLicenseExpired(server) {
  const raw = server?.expiredDate ?? server?.expired_date
  if (!raw || raw === '—') return false
  const time = new Date(raw).getTime()
  if (Number.isNaN(time)) return false
  return time < Date.now()
}

/** L4 controls require a current license that includes Sparta. */
export function isL4LicenseValid(server) {
  const license = String(server?.license || '').trim()
  if (!license || !isLayerLicensed(license, 'l4')) return false
  return !isLicenseExpired(server)
}

/** Warning copy when XDP, Block IP, or Allow IP is opened without a valid L4 license. */
export function l4LicenseBlockMessage(server) {
  const license = String(server?.license || '').trim()
  if (!license) return 'The L4 license is not valid. No license is assigned to this edge.'
  if (!isLayerLicensed(license, 'l4')) {
    return `The L4 license is not valid. ${licenseAllowsPhrase(license)}`
  }
  if (isLicenseExpired(server)) return 'The L4 license is not valid. This license has expired.'
  return 'The L4 license is not valid.'
}

/** L7 controls require a current license that includes Athens. */
export function isL7LicenseValid(server) {
  const license = String(server?.license || '').trim()
  if (!license || !isLayerLicensed(license, 'l7')) return false
  return !isLicenseExpired(server)
}

/** Warning copy when L7 Guard is opened without a valid L7 license. */
export function l7LicenseBlockMessage(server) {
  const license = String(server?.license || '').trim()
  if (!license) return 'The L7 license is not valid. No license is assigned to this edge.'
  if (!isLayerLicensed(license, 'l7')) {
    return `The L7 license is not valid. ${licenseAllowsPhrase(license)}`
  }
  if (isLicenseExpired(server)) return 'The L7 license is not valid. This license has expired.'
  return 'The L7 license is not valid.'
}

/** Normalize deploy/runtime status tokens from API or systemd probes. */
export function normalizeRuntimeStatus(value) {
  const status = String(value ?? '').trim().toLowerCase()
  if (status === 'running' || status === 'active') return 'running'
  if (status === 'stopped' || status === 'inactive' || status === 'failed' || status === 'dead') {
    return 'stopped'
  }
  if (status === 'deployed') return 'deployed'
  if (status === 'unknown' || status === '') return 'unknown'
  return 'unknown'
}

const RUNTIME_LABELS = {
  running: 'Running',
  stopped: 'Stopped',
  deployed: 'Deployed',
  unknown: 'Unknown',
  na: 'Not licensed',
}

export function runtimeStatusLabel(status) {
  if (String(status ?? '').trim().toLowerCase() === 'na') return RUNTIME_LABELS.na
  return RUNTIME_LABELS[normalizeRuntimeStatus(status)] || 'Unknown'
}

export function runtimeStatusClass(status) {
  if (String(status ?? '').trim().toLowerCase() === 'na') return 'na'
  return normalizeRuntimeStatus(status)
}

/** Angelos orchestrator runtime status from persisted deploy probe fields. */
export function resolveAngelosRuntimeStatus(server) {
  const raw = server?.serviceStatus ?? server?.service_status
  if (raw != null && String(raw).trim() !== '') {
    return normalizeRuntimeStatus(raw)
  }
  const label = String(server?.statusLabel || '').trim().toLowerCase()
  if (label === 'running' || label === 'stopped' || label === 'deployed' || label === 'unknown') {
    return label
  }
  return 'unknown'
}

export function angelosStatusLabel(server) {
  return runtimeStatusLabel(resolveAngelosRuntimeStatus(server))
}

export function angelosStatusClass(server) {
  return resolveAngelosRuntimeStatus(server)
}

/** Resolve L4/L7 runtime status for indicator dots (running | stopped | deployed | unknown | na). */
export function resolveLayerStatus(server, layer) {
  const license = String(server?.license || '').trim()
  if (license && !isLayerLicensed(license, layer)) {
    return 'na'
  }
  const raw =
    layer === 'l4'
      ? server?.l4Status ?? server?.l4_status
      : server?.l7Status ?? server?.l7_status
  if (raw != null && String(raw).trim() !== '') {
    return normalizeRuntimeStatus(raw)
  }
  if (!isLayerLicensed(server?.license, layer)) {
    return 'na'
  }
  return 'unknown'
}

export function layerDotClass(server, layer) {
  const status = resolveLayerStatus(server, layer)
  return {
    'layer-dot': true,
    [`layer-dot--${layer}`]: true,
    [`layer-dot--${status}`]: true,
  }
}

const LAYER_META = {
  l4: {
    short: 'L4',
    service: 'Sparta',
    role: 'Layer 4 DDoS protection (network / XDP)',
  },
  l7: {
    short: 'L7',
    service: 'Athens',
    role: 'Layer 7 application security (WAF / HTTP)',
  },
}

const STATUS_COPY = {
  running: 'is running and healthy',
  stopped: 'is stopped',
  deployed: 'is deployed (artifacts present; service may be idle)',
  unknown: 'status is unknown — use Refresh status or redeploy to update',
  na: 'is disabled because this license does not include it',
}

function licenseAllowsPhrase(license) {
  const lic = String(license || '').trim().toLowerCase()
  if (lic === 'l7') return 'The current license allows L7 only.'
  if (lic === 'l4') return 'The current license allows L4 only.'
  if (lic === 'trial') return 'The trial license includes L4 and L7.'
  if (lic === 'unified') return 'The current license includes L4 and L7.'
  if (!lic) return 'No license is assigned to this edge.'
  return `The current license is ${String(license).trim()}.`
}

function unlicensedFeatureMessage(service, server) {
  const layer = service === 'sparta' ? 'L4' : 'L7'
  return `This feature is disabled because there is no ${layer} license. ${licenseAllowsPhrase(server?.license)}`
}

/** One-line label for native title / aria (accessibility). */
export function layerDotTitle(server, layer) {
  const meta = LAYER_META[layer] || LAYER_META.l4
  const status = resolveLayerStatus(server, layer)
  if (status === 'na') {
    return `${meta.short} (${meta.service}): ${unlicensedFeatureMessage(meta.service.toLowerCase(), server)}`
  }
  return `${meta.short} (${meta.service}): ${STATUS_COPY[status] || status}`
}

/** Full description shown in the hover tooltip. */
export function layerDotDescription(server, layer) {
  const meta = LAYER_META[layer] || LAYER_META.l4
  const status = resolveLayerStatus(server, layer)
  const statusLine = status === 'na'
    ? unlicensedFeatureMessage(meta.service.toLowerCase(), server)
    : `${(STATUS_COPY[status] || status).charAt(0).toUpperCase()}${(STATUS_COPY[status] || status).slice(1)}.`
  return `${meta.short} · ${meta.service}\n${meta.role}\n${statusLine}`
}

const SERVICE_META = {
  angelos: {
    unit: 'angelos.service',
    layer: 'Orchestrator',
    role: 'Deployment manager and service coordinator',
  },
  sparta: {
    unit: 'sparta.service',
    layer: LAYER_META.l4.short,
    role: LAYER_META.l4.role,
  },
  athens: {
    unit: 'athens.service',
    layer: LAYER_META.l7.short,
    role: LAYER_META.l7.role,
  },
}

const ANGELOS_STATUS_COPY = {
  running: 'Orchestrator is running and healthy',
  stopped: 'Orchestrator is stopped on the remote host',
  deployed: 'Orchestrator is deployed; service may be idle',
  unknown: 'Status is unknown — refresh or redeploy to update',
}

function serviceHealthMessage(service, status, server) {
  if (service === 'angelos') {
    return ANGELOS_STATUS_COPY[status] || ANGELOS_STATUS_COPY.unknown
  }
  if (status === 'na') {
    return unlicensedFeatureMessage(service, server)
  }
  const line = STATUS_COPY[status] || status
  const name = service === 'sparta' ? 'Sparta' : 'Athens'
  return `${name} ${line}`
}

function serviceLicenseLine(service, server) {
  if (service === 'angelos') {
    return 'Required for all deployments'
  }
  const layer = service === 'sparta' ? 'l4' : 'l7'
  const licensed = isLayerLicensed(server?.license, layer)
  const tier = String(server?.license || '—').trim() || '—'
  if (licensed) {
    return `Included (${tier} license)`
  }
  const lic = tier.toLowerCase()
  if (lic === 'l7') return 'Not included — license allows L7 only'
  if (lic === 'l4') return 'Not included — license allows L4 only'
  return `Not included. ${licenseAllowsPhrase(server?.license)}`
}

/** Short role blurb for Monitor card info icons. */
export function serviceStatusRoleHint(service) {
  return (SERVICE_META[service] || SERVICE_META.angelos).role
}

function serviceStatusReason(service, server, status) {
  const normalized =
    String(status ?? '').trim().toLowerCase() === 'na' ? 'na' : normalizeRuntimeStatus(status)
  if (normalized === 'running' || normalized === 'na') return ''
  if (service === 'angelos') {
    return String(server?.serviceStatusReason ?? server?.service_status_reason ?? '').trim()
  }
  if (service === 'sparta') {
    return String(server?.l4StatusReason ?? server?.l4_status_reason ?? '').trim()
  }
  if (service === 'athens') {
    return String(server?.l7StatusReason ?? server?.l7_status_reason ?? '').trim()
  }
  return ''
}

/** Detail rows for Server Status service panels. */
export function serviceStatusDetailRows(service, server, status, lastCheckedAt, now = Date.now()) {
  const meta = SERVICE_META[service] || SERVICE_META.angelos
  const normalized =
    String(status ?? '').trim().toLowerCase() === 'na' ? 'na' : normalizeRuntimeStatus(status)
  const rows = [
    { label: 'Unit', value: meta.unit },
    { label: 'Layer', value: meta.layer },
    { label: 'Health', value: serviceHealthMessage(service, normalized, server) },
  ]
  const reason = serviceStatusReason(service, server, normalized)
  if (reason) {
    rows.push({ label: 'Reason', value: reason, tone: 'warning' })
  } else if (normalized === 'stopped') {
    rows.push({
      label: 'Reason',
      value: 'No failure detail reported — refresh status or check journalctl on the host',
      tone: 'muted',
    })
  } else if (normalized === 'unknown') {
    rows.push({
      label: 'Reason',
      value: 'Could not determine service state — refresh status or verify SSH access',
      tone: 'muted',
    })
  }
  rows.push({ label: 'License', value: serviceLicenseLine(service, server) })
  rows.push(lastCheckedRow(lastCheckedAt, now))
  return rows
}

function lastCheckedRow(value, now) {
  if (!value) {
    return { label: 'Last checked', value: 'Not checked yet' }
  }
  return {
    label: 'Last checked',
    value: formatRelativeChecked(value, now),
    title: formatStatusTimestamp(value),
  }
}

export function formatRelativeChecked(value, now = Date.now()) {
  const date = value instanceof Date ? value : new Date(value)
  const checkedAt = date.getTime()
  if (Number.isNaN(checkedAt)) return '—'
  const seconds = Math.max(0, Math.round((Number(now) - checkedAt) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatStatusTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
