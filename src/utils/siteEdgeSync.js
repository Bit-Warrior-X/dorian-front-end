import { notifyError, notifySuccess, notifyWarning } from '@/utils/notify'

const formatEdge = (edge) => {
  const name = String(edge?.name || '').trim() || `server #${edge?.serverId ?? '?'}`
  const ip = String(edge?.ip || '').trim()
  return ip ? `${name} (${ip})` : name
}

const formatEdgeDetails = (edges) =>
  edges
    .map((edge) => {
      const reason = String(edge?.error || '').trim() || 'unknown error'
      return `${formatEdge(edge)}: ${reason}`
    })
    .join('; ')

/**
 * Shows success toasts for edges that synced, error toasts for edges that failed,
 * and warning toasts for non-blocking issues (for example outdated angelos on delete).
 * Failed edges are already deselected by the backend on create/update.
 */
export const notifySiteEdgeSync = (title, edgeSync, { fallbackSuccess } = {}) => {
  const succeeded = Array.isArray(edgeSync?.succeeded) ? edgeSync.succeeded : []
  const failed = Array.isArray(edgeSync?.failed) ? edgeSync.failed : []
  const warnings = Array.isArray(edgeSync?.warnings) ? edgeSync.warnings : []

  if (succeeded.length > 0) {
    notifySuccess(
      title,
      `Synced successfully: ${succeeded.map(formatEdge).join(', ')}`,
    )
  } else if (failed.length === 0 && warnings.length === 0 && fallbackSuccess) {
    notifySuccess(title, fallbackSuccess)
  }

  if (failed.length > 0) {
    notifyError(title, `Failed and deselected: ${formatEdgeDetails(failed)}`)
  }

  if (warnings.length > 0) {
    notifyWarning(title, formatEdgeDetails(warnings))
  }
}
