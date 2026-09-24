import { apiRequest } from './client'
import { getApiConfig } from './config'
import { licensePlans as fallbackPlans } from '@/data/licensePlans'

/** Active license tiers with monthly/annual prices from cdnproxy.license_plans. */
export const fetchLicensePlans = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return fallbackPlans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      tagline: plan.tagline,
      badge: plan.badge,
      accent: plan.accent,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      sortOrder: 0,
    }))
  }

  const data = await apiRequest('/api/v1/license-plans')
  return Array.isArray(data) ? data : []
}
