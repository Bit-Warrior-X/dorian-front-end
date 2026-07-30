import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchSecondRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/second-freq-limit`)

export const createSecondRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/second-freq-limit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateSecondRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/second-freq-limit/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteSecondRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/second-freq-limit/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteSecondRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/second-freq-limit/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
