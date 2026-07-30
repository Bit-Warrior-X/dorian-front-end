import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchWhitelistRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/whitelist`)

export const createWhitelistRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/whitelist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateWhitelistRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/whitelist/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteWhitelistRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/whitelist/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteWhitelistRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/whitelist/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
