import { apiRequest } from './client'

const json = (method, body) => ({ method, body: JSON.stringify(body ?? {}) })

export const fetchOrderCatalog = () => apiRequest('/api/v1/orders/catalog')

export const quoteOrder = (order) => apiRequest('/api/v1/orders/quote', json('POST', order))

export const fetchOrders = ({ scope, status } = {}) => {
  const params = new URLSearchParams()
  if (scope) params.set('scope', scope)
  if (status) params.set('status', Array.isArray(status) ? status.join(',') : status)
  const qs = params.toString()
  return apiRequest(`/api/v1/orders${qs ? `?${qs}` : ''}`)
}

export const fetchOrder = (id) => apiRequest(`/api/v1/orders/${id}`)

export const createOrder = (order) => apiRequest('/api/v1/orders', json('POST', order))

export const updateOrder = (id, order) => apiRequest(`/api/v1/orders/${id}`, json('PUT', order))

export const submitOrder = (id) => apiRequest(`/api/v1/orders/${id}/submit`, json('POST'))

export const cancelOrder = (id) => apiRequest(`/api/v1/orders/${id}/cancel`, json('POST'))

export const recordOrderPayment = (id, payment) =>
  apiRequest(`/api/v1/orders/${id}/payment`, json('POST', payment))

export const approveOrder = (id, body) => apiRequest(`/api/v1/orders/${id}/approve`, json('POST', body))

export const rejectOrder = (id, note) => apiRequest(`/api/v1/orders/${id}/reject`, json('POST', { note }))

export const fetchLicenses = (scope) =>
  apiRequest(`/api/v1/licenses${scope ? `?scope=${encodeURIComponent(scope)}` : ''}`)

export const renewLicenses = (licenseIds, period) =>
  apiRequest('/api/v1/licenses/renew', json('POST', { licenseIds, period }))

export const updateCatalogPrice = (code, monthlyPrice, annualPrice) =>
  apiRequest(`/api/v1/admin/order-catalog/${encodeURIComponent(code)}`, json('PUT', { monthlyPrice, annualPrice }))

export const fetchServerKinds = () => apiRequest('/api/v1/admin/server-kinds')

export const setServerKind = (id, kind) => apiRequest(`/api/v1/admin/server-kinds/${id}`, json('PUT', { kind }))

export const cancelLicense = (id, immediate = false) =>
  apiRequest(`/api/v1/licenses/${id}/cancel`, json('POST', { immediate }))

export const resumeLicense = (id) => apiRequest(`/api/v1/licenses/${id}/resume`, json('POST'))
