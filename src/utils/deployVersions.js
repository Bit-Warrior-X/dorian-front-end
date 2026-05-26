/** Normalize version labels for comparison (e.g. v3.2.1 vs 3.2.1). */
export function normalizeVersionLabel(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
}

export function isSameProductVersion(a, b) {
  const left = normalizeVersionLabel(a)
  const right = normalizeVersionLabel(b)
  if (!left || !right) return false
  return left === right
}

/** Newest product version from deploy-versions list (API returns newest first). */
export function latestDeployVersionFromList(versions) {
  if (!Array.isArray(versions) || versions.length === 0) return ''
  return normalizeVersionLabel(versions[0]?.version)
}

/** Table label, e.g. `0.14 (Latest)` when server matches catalog head. */
export function formatServerVersionDisplay(serverVersion, latestVersion) {
  const raw = String(serverVersion ?? '').trim()
  if (!raw) return '—'
  const display = normalizeVersionLabel(serverVersion) || raw
  if (latestVersion && isSameProductVersion(serverVersion, latestVersion)) {
    return `${display} (Latest)`
  }
  return display
}

/** Format deploy_license `updated` field (ISO string, unix seconds/ms, or unknown). */
export function formatVersionUpdated(updated) {
  if (updated == null || updated === '') return '—'

  let date
  if (typeof updated === 'number') {
    date = new Date(updated < 1e12 ? updated * 1000 : updated)
  } else if (typeof updated === 'string') {
    const trimmed = updated.trim()
    if (!trimmed) return '—'
    const asNum = Number(trimmed)
    if (!Number.isNaN(asNum) && /^\d+(\.\d+)?$/.test(trimmed)) {
      date = new Date(asNum < 1e12 ? asNum * 1000 : asNum)
    } else {
      date = new Date(trimmed)
    }
  } else {
    return '—'
  }

  if (Number.isNaN(date.getTime())) return String(updated)

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Short package label from full_name or version. */
export function versionPackageLabel(item) {
  const full = String(item?.full_name || '').trim()
  if (full) return full
  const ver = String(item?.version || '').trim()
  return ver ? `dorian-ddos-firewall-${ver}` : 'Dorian product build'
}