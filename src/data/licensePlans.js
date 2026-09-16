/** License tier catalog — pricing and copy for UI selectors. */

export const BILLING_PERIODS = Object.freeze({
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
})

export const licensePlans = [
  {
    id: 'Trial',
    title: 'Trial',
    tagline: 'Evaluation',
    badge: null,
    accent: 'trial',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '3-day evaluation period',
      'Single host — auto-bound on deploy',
      'Auto-generated license · license-only deploy',
      'Full product evaluation (L4 + L7 preview)',
      'Dashboard, analytics & server management',
      'No payment or credit card required',
    ],
  },
  {
    id: 'L4',
    title: 'L4',
    tagline: 'Network protection',
    badge: null,
    accent: 'l4',
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      'One host',
      'Layer 4 DDoS & network protection scope',
      'Generate new or load existing license file',
      'SYN / UDP / ICMP flood mitigation',
      'Geo blocking & IP blacklist controls',
      'NIC-level traffic shaping & rate limits',
      'L4 attack analytics & realtime bandwidth',
    ],
  },
  {
    id: 'L7',
    title: 'L7',
    tagline: 'Application security',
    badge: null,
    accent: 'l7',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      'One host',
      'WAF, HTTP controls & application security',
      'Generate new or load existing license file',
      'Custom WAF rules & request rate limiting',
      'Bot detection & CC attack protection',
      'Upstream load balancing & health checks',
      'Access logs, security analytics & export',
    ],
  },
  {
    id: 'Unified',
    title: 'Unified',
    tagline: 'Complete stack',
    badge: 'Best value',
    accent: 'unified',
    monthlyPrice: 449,
    annualPrice: 4490,
    features: [
      'One host',
      'L4 + L7 combined — full stack on one license',
      'License-only upgrade · no full reinstall',
      'All L4 mitigation, geo & shaping features',
      'All L7 WAF, bot protection & balancing',
      'Unified dashboard & cross-layer policies',
      'Priority access to new features & updates',
    ],
  },
]

export function normalizeLicenseTier(raw) {
  const t = String(raw || 'Trial').trim().toLowerCase()
  if (t === 'trial') return 'Trial'
  if (t === 'l4') return 'L4'
  if (t === 'l7') return 'L7'
  if (t === 'unified') return 'Unified'
  const cap = String(raw || 'Trial').trim()
  const hit = licensePlans.find((p) => p.id.toLowerCase() === cap.toLowerCase())
  return hit?.id || 'Trial'
}

export function normalizeBillingPeriod(raw) {
  const v = String(raw || '').trim().toLowerCase()
  if (v === BILLING_PERIODS.MONTHLY || v === 'month' || v === 'mo') {
    return BILLING_PERIODS.MONTHLY
  }
  return BILLING_PERIODS.ANNUAL
}

/** License validity in days for the selected billing period. Trial is always 3. */
export function planDurationDays(tierId, billingPeriod) {
  if (normalizeLicenseTier(tierId) === 'Trial') return 3
  return normalizeBillingPeriod(billingPeriod) === BILLING_PERIODS.MONTHLY ? 30 : 365
}

export function licenseDurationLabel(tierId, billingPeriod) {
  const days = planDurationDays(tierId, billingPeriod)
  if (days === 3) return '3-day evaluation'
  if (days === 30) return '30-day license'
  return '365-day license'
}

export function formatPlanPrice(amount) {
  if (amount == null || amount <= 0) return 'Free'
  return `$${Number(amount).toLocaleString('en-US')}`
}

/** Price shown for the active billing period (annual total or monthly rate). */
export function planPriceForPeriod(plan, billingPeriod) {
  if (!plan) return 0
  if (normalizeBillingPeriod(billingPeriod) === BILLING_PERIODS.MONTHLY) {
    return Number(plan.monthlyPrice) || 0
  }
  return Number(plan.annualPrice) || 0
}

/** Effective monthly rate when paying annually (for comparison copy). */
export function annualPerMonthRate(annualPrice) {
  const annual = Number(annualPrice) || 0
  if (annual <= 0) return 0
  return Math.round((annual / 12) * 100) / 100
}

/** Dollar amount saved when paying annually vs 12 monthly payments. */
export function annualSavingsAmount(monthlyPrice, annualPrice) {
  const monthly = Number(monthlyPrice) || 0
  const annual = Number(annualPrice) || 0
  if (monthly <= 0 || annual <= 0) return 0
  const diff = monthly * 12 - annual
  return diff > 0 ? diff : 0
}

/** Percent saved vs paying monthly × 12 (0 when not applicable). */
export function annualSavingsPercent(monthlyPrice, annualPrice) {
  const monthly = Number(monthlyPrice) || 0
  const annual = Number(annualPrice) || 0
  if (monthly <= 0 || annual <= 0) return 0
  const fullYearMonthly = monthly * 12
  if (fullYearMonthly <= annual) return 0
  return Math.round((1 - annual / fullYearMonthly) * 100)
}

/** Largest annual discount across paid plans — used on the billing toggle. */
export function maxAnnualSavingsPercent(plans = licensePlans) {
  let max = 0
  for (const plan of plans) {
    const pct = annualSavingsPercent(plan.monthlyPrice, plan.annualPrice)
    if (pct > max) max = pct
  }
  return max
}
