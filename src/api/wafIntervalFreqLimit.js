import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchIntervalRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/interval-freq-limit`)

export const createIntervalRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/interval-freq-limit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateIntervalRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/interval-freq-limit/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteIntervalRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/interval-freq-limit/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteIntervalRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/interval-freq-limit/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
