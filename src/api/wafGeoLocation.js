import { apiRequest } from './client'
import { wafApiBase } from './wafScope'

export const fetchGeoRules = async (scope) =>
  apiRequest(`${wafApiBase(scope)}/geolocation`)

export const createGeoRule = async (scope, payload) =>
  apiRequest(`${wafApiBase(scope)}/geolocation`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateGeoRule = async (scope, ruleId, payload) =>
  apiRequest(`${wafApiBase(scope)}/geolocation/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteGeoRule = async (scope, ruleId) =>
  apiRequest(`${wafApiBase(scope)}/geolocation/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteGeoRules = async (scope, ids) =>
  apiRequest(`${wafApiBase(scope)}/geolocation/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
