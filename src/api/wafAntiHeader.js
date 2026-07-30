import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchAntiHeaderRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/anti-header`)

export const createAntiHeaderRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/anti-header`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateAntiHeaderRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/anti-header/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteAntiHeaderRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/anti-header/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteAntiHeaderRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/anti-header/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
