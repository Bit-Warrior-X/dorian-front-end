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

/** Resolve L4/L7 runtime status for indicator dots (running | stopped | deployed | unknown | na). */
export function resolveLayerStatus(server, layer) {
  if (!isLayerLicensed(server?.license, layer)) {
    return 'na'
  }
  const raw =
    layer === 'l4'
      ? server?.l4Status || server?.l4_status
      : server?.l7Status || server?.l7_status
  const status = String(raw || '').trim().toLowerCase()
  if (status === 'running' || status === 'active') return 'running'
  if (status === 'stopped' || status === 'inactive' || status === 'failed') return 'stopped'
  if (status === 'deployed') return 'deployed'

  const svc = String(server?.serviceStatus || '').trim().toLowerCase()
  if (svc === 'running') return 'running'
  if (svc === 'stopped') return 'stopped'
  if (svc === 'deployed') return 'deployed'
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
  unknown: 'status is unknown — upgrade or redeploy to refresh',
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
