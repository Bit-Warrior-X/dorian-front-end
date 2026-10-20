export const maskIp = (ip) => {
  const raw = String(ip || '').trim()
  if (!raw) return 'IP hidden'
  if (raw.includes(':')) {
    const parts = raw.split(':').filter(Boolean)
    return `${parts.slice(0, 2).join(':')}:••••`
  }
  const parts = raw.split('.')
  if (parts.length !== 4) return '••••'
  return `${parts[0]}.${parts[1]}.•••.•••`
}
