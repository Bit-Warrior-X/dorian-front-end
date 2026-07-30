import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchAntiCcRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/anti-cc`)

export const createAntiCcRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/anti-cc`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateAntiCcRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/anti-cc/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteAntiCcRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/anti-cc/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteAntiCcRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/anti-cc/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
