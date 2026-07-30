import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchResponseRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/response-freq`)

export const createResponseRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/response-freq`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateResponseRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/response-freq/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteResponseRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/response-freq/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteResponseRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/response-freq/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
