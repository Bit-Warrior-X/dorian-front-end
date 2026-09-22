/**
 * Client-side structured console logs + unified API error reporting.
 * Keep messages short for toasts; put technical fields in `details`.
 */

import { extractApiErrorDetails, extractApiErrorMessage } from '@/api/client'
import { notifyError } from '@/utils/notify'

const emit = (level, event, fields = {}) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component: 'frontend',
    event,
    ...fields,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }
  return entry
}

export const clientLog = {
  info: (event, fields) => emit('info', event, fields),
  warn: (event, fields) => emit('warn', event, fields),
  error: (event, fields) => emit('error', event, fields),
}

/**
 * Notify the user and emit a structured console error for any API failure.
 * @returns {{ message: string, details: object }}
 */
export function reportApiError(error, title = 'Action failed') {
  const message =
    error?.message ||
    extractApiErrorMessage(error?.payload, { status: error?.status }) ||
    'Request failed'
  const details = extractApiErrorDetails(error?.payload, { status: error?.status })
  clientLog.error('api_error', {
    title,
    message,
    status: error?.status,
    ...details,
  })
  notifyError(title, message, undefined, details)
  return { message, details }
}
