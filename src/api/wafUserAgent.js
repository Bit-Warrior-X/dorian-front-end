import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchUserAgentRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/user-agent`)

export const createUserAgentRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/user-agent`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUserAgentRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/user-agent/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUserAgentRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/user-agent/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteUserAgentRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/user-agent/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
