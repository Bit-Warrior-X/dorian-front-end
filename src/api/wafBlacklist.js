import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchBlacklistRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/blacklist`)

export const createBlacklistRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/blacklist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateBlacklistRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/blacklist/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteBlacklistRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/blacklist/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteBlacklistRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/blacklist/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
