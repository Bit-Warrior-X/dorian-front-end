let originKeySeed = 0

export const createEmptyOriginServer = (overrides = {}) => ({
  key: `origin-${Date.now()}-${originKeySeed++}`,
  id: null,
  ip: '',
  port: '80',
  weight: '4',
  protocol: 'HTTP',
  maxFails: '3',
  failTimeout: '30',
  ...overrides,
})

export const buildOriginAddress = (origin) => {
  const ip = String(origin?.ip || '').trim()
  const port = String(origin?.port || '').trim()
  if (!ip || !port) return ''
  if (ip.includes(':') && !ip.startsWith('[')) {
    return `[${ip}]:${port}`
  }
  return `${ip}:${port}`
}

export const parseOriginAddress = (address) => {
  const trimmed = String(address || '').trim()
  if (!trimmed) return { ip: '', port: '' }

  if (trimmed.startsWith('[')) {
    const close = trimmed.indexOf(']')
    if (close > 1) {
      return {
        ip: trimmed.slice(1, close),
        port: trimmed.slice(close + 1).replace(/^:/, ''),
      }
    }
  }

  const lastColon = trimmed.lastIndexOf(':')
  if (lastColon <= 0) {
    return { ip: trimmed, port: '' }
  }

  return {
    ip: trimmed.slice(0, lastColon),
    port: trimmed.slice(lastColon + 1),
  }
}

export const normalizeOriginProtocol = (value) =>
  String(value || '').toUpperCase() === 'HTTPS' ? 'HTTPS' : 'HTTP'

export const buildOriginDescription = (origin) => {
  const weight = Number(origin?.weight) || 4
  const maxFails = Number(origin?.maxFails) || 3
  const failTimeout = Number(origin?.failTimeout) || 30
  return `weight=${weight} max_fails=${maxFails} fail_timeout=${failTimeout}s`
}

export const parseOriginDescription = (description) => {
  const text = String(description || '')
  const readNumber = (key, fallback) => {
    const match = text.match(new RegExp(`${key}=(\\d+)`, 'i'))
    return match ? match[1] : String(fallback)
  }
  return {
    weight: readNumber('weight', 4),
    maxFails: readNumber('max_fails', 3),
    failTimeout: readNumber('fail_timeout', 30),
  }
}

export const mapUpstreamToOriginServer = (upstream) => {
  const { ip, port } = parseOriginAddress(upstream?.address)
  const parsed = parseOriginDescription(upstream?.description)
  const legacyProtocolMatch = String(upstream?.description || '').match(/protocol=(HTTPS?)/i)
  const protocol =
    upstream?.protocol ||
    (legacyProtocolMatch ? legacyProtocolMatch[1] : 'HTTP')

  return createEmptyOriginServer({
    id: upstream?.id ?? null,
    ip,
    port: port || '80',
    protocol: normalizeOriginProtocol(protocol),
    ...parsed,
  })
}

export const toUpstreamPayload = (origin) => ({
  address: buildOriginAddress(origin),
  protocol: normalizeOriginProtocol(origin?.protocol),
  description: buildOriginDescription(origin),
  status: 'ENABLE',
})

export const isBlankOriginServer = (origin) => {
  const ip = String(origin?.ip || '').trim()
  const port = String(origin?.port || '').trim()
  const weight = String(origin?.weight || '').trim()
  const maxFails = String(origin?.maxFails || '').trim()
  const failTimeout = String(origin?.failTimeout || '').trim()
  const protocol = normalizeOriginProtocol(origin?.protocol)
  const defaultPort = !port || port === '80'
  const defaultWeight = !weight || weight === '4'
  const defaultMaxFails = !maxFails || maxFails === '3'
  const defaultFailTimeout = !failTimeout || failTimeout === '30'
  const defaultProtocol = protocol === 'HTTP'
  return !ip && defaultPort && defaultWeight && defaultMaxFails && defaultFailTimeout && defaultProtocol && !origin?.id
}

export const getFilledOriginServers = (origins) =>
  (Array.isArray(origins) ? origins : []).filter((origin) => !isBlankOriginServer(origin))

export const validateOriginServers = (origins) => {
  const list = getFilledOriginServers(origins)
  if (!list.length) {
    return 'At least one origin server is required.'
  }

  const seen = new Set()
  for (let index = 0; index < list.length; index += 1) {
    const origin = list[index]
    const label = `Origin server #${index + 1}`
    const ip = String(origin?.ip || '').trim()
    const portRaw = String(origin?.port || '').trim()
    const port = Number(portRaw)
    const weight = Number(origin?.weight)
    const maxFails = Number(origin?.maxFails)
    const failTimeout = Number(origin?.failTimeout)
    const protocol = String(origin?.protocol || '').toUpperCase()

    if (!ip) return `${label}: IP is required.`
    if (!portRaw || !Number.isInteger(port) || port < 1 || port > 65535) {
      return `${label}: Port must be an integer between 1 and 65535.`
    }
    if (!['HTTP', 'HTTPS'].includes(protocol)) {
      return `${label}: Protocol must be HTTP or HTTPS.`
    }
    if (!Number.isFinite(weight) || weight < 1) {
      return `${label}: Weight must be at least 1.`
    }
    if (!Number.isFinite(maxFails) || maxFails < 1) {
      return `${label}: Max Fails must be at least 1.`
    }
    if (!Number.isFinite(failTimeout) || failTimeout < 1) {
      return `${label}: Fail Timeout must be at least 1.`
    }

    const address = buildOriginAddress(origin).toLowerCase()
    if (seen.has(address)) {
      return `${label}: Duplicate origin address ${address}.`
    }
    seen.add(address)
  }

  return ''
}
