const parseBool = (value) => {
  if (value === undefined || value === null) return undefined
  return ['true', '1', 'yes'].includes(String(value).toLowerCase())
}

const envConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  useMocks: parseBool(import.meta.env.VITE_USE_MOCKS),
}

let cachedConfig = null

const loadFileConfig = async () => {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' })
    if (!response.ok) return {}
    const json = await response.json()
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

export const getApiConfig = async () => {
  if (cachedConfig) return cachedConfig

  const fileConfig = await loadFileConfig()
  const merged = {
    apiBaseUrl: fileConfig.apiBaseUrl || envConfig.apiBaseUrl || '',
    useMocks:
      envConfig.useMocks !== undefined ? envConfig.useMocks : fileConfig.useMocks,
  }

  cachedConfig = {
    ...merged,
    useMocks:
      merged.useMocks !== undefined
        ? merged.useMocks
        : !merged.apiBaseUrl,
  }

  return cachedConfig
}
