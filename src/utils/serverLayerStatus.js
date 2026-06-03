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
}

export function runtimeStatusLabel(status) {
  return RUNTIME_LABELS[normalizeRuntimeStatus(status)] || 'Unknown'
}

export function runtimeStatusClass(status) {
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
  na: 'is not included in this server’s license tier',
}

/** One-line label for native title / aria (accessibility). */
export function layerDotTitle(server, layer) {
  const meta = LAYER_META[layer] || LAYER_META.l4
  const status = resolveLayerStatus(server, layer)
  return `${meta.short} (${meta.service}): ${STATUS_COPY[status] || status}`
}

/** Full description shown in the hover tooltip. */
export function layerDotDescription(server, layer) {
  const meta = LAYER_META[layer] || LAYER_META.l4
  const status = resolveLayerStatus(server, layer)
  const statusLine = STATUS_COPY[status] || status
  return `${meta.short} · ${meta.service}\n${meta.role}\n${statusLine.charAt(0).toUpperCase()}${statusLine.slice(1)}.`
}
