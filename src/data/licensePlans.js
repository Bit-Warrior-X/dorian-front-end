/** License tier catalog — pricing and copy for UI selectors. */
export const licensePlans = [
  {
    id: 'Trial',
    title: 'Trial',
    tagline: 'Evaluation',
    badge: null,
    accent: 'slate',
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
    accent: 'blue',
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      '365-day license · one host',
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
    accent: 'violet',
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      '365-day license · one host',
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
    accent: 'indigo',
    monthlyPrice: 449,
    annualPrice: 4490,
    features: [
      '365-day license · one host',
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

export function formatPlanPrice(amount) {
  if (amount == null || amount <= 0) return 'Free'
  return `$${Number(amount).toLocaleString('en-US')}`
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
