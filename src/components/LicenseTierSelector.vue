<template>
  <div
    class="license-selector"
    :class="{ 'license-selector--compact': compact }"
  >
    <!-- Trial is billing-independent — not shown under Monthly/Annual -->
    <button
      type="button"
      class="trial-banner"
      :class="{ selected: modelValue === 'Trial', disabled }"
      :disabled="disabled"
      :aria-pressed="modelValue === 'Trial'"
      @click="select('Trial')"
    >
      <div class="trial-banner__main">
        <span class="trial-banner__badge">Free evaluation</span>
        <div class="trial-banner__copy">
          <strong>Trial</strong>
          <span>3 days · full L4 + L7 preview · no credit card</span>
        </div>
      </div>
      <div class="trial-banner__meta">
        <span class="trial-banner__price num">{{ formatPlanPrice(trialPlan.monthlyPrice) }}</span>
        <span class="trial-banner__radio" :class="{ checked: modelValue === 'Trial' }" aria-hidden="true">
          <svg v-if="modelValue === 'Trial'" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>

    <div class="paid-section">
      <div class="paid-section__head">
        <div>
          <h3 class="paid-section__title">Paid plans</h3>
          <p class="paid-section__desc">Billed per edge · license bound to one host</p>
        </div>
        <div
          class="billing-toggle"
          role="radiogroup"
          aria-label="Billing period"
        >
          <button
            type="button"
            class="billing-option"
            :class="{ active: billingPeriod === 'monthly' }"
            role="radio"
            :aria-checked="billingPeriod === 'monthly'"
            :disabled="disabled"
            @click="setBillingPeriod('monthly')"
          >
            Monthly
          </button>
          <button
            type="button"
            class="billing-option"
            :class="{ active: billingPeriod === 'annual' }"
            role="radio"
            :aria-checked="billingPeriod === 'annual'"
            :disabled="disabled"
            @click="setBillingPeriod('annual')"
          >
            Annual
            <span v-if="annualDiscountPercent > 0" class="billing-save">
              Save {{ annualDiscountPercent }}%
            </span>
          </button>
        </div>
      </div>

      <div
        class="tier-grid"
        role="radiogroup"
        :aria-label="ariaLabel"
      >
        <button
          v-for="plan in paidPlans"
          :key="plan.id"
          type="button"
          class="tier-card"
          :class="[
            `tier-card--${plan.accent}`,
            { selected: modelValue === plan.id, disabled },
          ]"
          :disabled="disabled"
          :aria-pressed="modelValue === plan.id"
          @click="select(plan.id)"
        >
          <div class="tier-card-accent" aria-hidden="true"></div>

          <header class="tier-header">
            <div class="tier-header-text">
              <span v-if="plan.badge" class="tier-badge">{{ plan.badge }}</span>
              <span class="tier-title">{{ plan.title }}</span>
              <span class="tier-tagline">{{ plan.tagline }}</span>
            </div>
            <span class="tier-radio" :class="{ checked: modelValue === plan.id }" aria-hidden="true">
              <svg v-if="modelValue === plan.id" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8.5L6.5 11.5L12.5 4.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </header>

          <section class="plan-section plan-section--pricing">
            <div class="price-block">
              <div class="price-main">
                <span class="price-amount num">{{ displayPrice(plan) }}</span>
                <span class="pricing-unit">
                  {{ billingPeriod === 'monthly' ? '/ mo' : '/ yr' }}
                </span>
              </div>
              <p v-if="priceSubline(plan)" class="price-subline">
                {{ priceSubline(plan) }}
              </p>
              <div
                v-if="
                  billingPeriod === 'annual' &&
                  annualSavingsPercent(plan.monthlyPrice, plan.annualPrice) > 0
                "
                class="pricing-savings"
              >
                <span class="savings-pill">
                  Save {{ annualSavingsPercent(plan.monthlyPrice, plan.annualPrice) }}%
                </span>
                <span class="savings-detail">
                  {{ formatPlanPrice(annualSavingsAmount(plan.monthlyPrice, plan.annualPrice)) }}
                  vs monthly billing
                </span>
              </div>
            </div>
          </section>

          <section v-if="!compact" class="plan-section plan-section--features">
            <h4 class="plan-section-label">Includes</h4>
            <ul class="feature-list">
              <li v-for="(feature, idx) in featuresForPlan(plan)" :key="idx">
                <svg class="feature-check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                {{ feature }}
              </li>
            </ul>
          </section>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchLicensePlans } from '@/api/licensePlans'
import {
  licensePlans as catalogPlans,
  mergeLicensePlanPrices,
  formatPlanPrice,
  planPriceForPeriod,
  annualPerMonthRate,
  annualSavingsPercent,
  annualSavingsAmount,
  maxAnnualSavingsPercent,
  licenseDurationLabel,
  normalizeBillingPeriod,
} from '@/data/licensePlans'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  billingPeriod: {
    type: String,
    default: 'annual',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: 'License type',
  },
  /** Shorter cards for dialogs — pricing only, hides Includes list. */
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'update:billingPeriod'])

const plans = ref(catalogPlans.map((plan) => ({ ...plan })))

const billingPeriod = computed(() => normalizeBillingPeriod(props.billingPeriod))
const paidPlans = computed(() => plans.value.filter((plan) => plan.id !== 'Trial'))
const annualDiscountPercent = computed(() => maxAnnualSavingsPercent(paidPlans.value))
const trialPlan = computed(() => plans.value.find((plan) => plan.id === 'Trial') || catalogPlans[0])

const loadPrices = async () => {
  try {
    const rows = await fetchLicensePlans()
    if (Array.isArray(rows) && rows.length) {
      plans.value = mergeLicensePlanPrices(catalogPlans, rows)
    }
  } catch {
    // Keep catalog fallback prices when the API is unavailable.
  }
}

onMounted(() => {
  void loadPrices()
})

const select = (id) => {
  emit('update:modelValue', id)
}

const setBillingPeriod = (period) => {
  if (props.disabled) return
  emit('update:billingPeriod', normalizeBillingPeriod(period))
}

const displayPrice = (plan) => formatPlanPrice(planPriceForPeriod(plan, billingPeriod.value))

const priceSubline = (plan) => {
  if (billingPeriod.value === 'annual' && plan.annualPrice > 0) {
    const perMo = annualPerMonthRate(plan.annualPrice)
    return `${formatPlanPrice(perMo)}/mo billed annually · ${licenseDurationLabel(plan.id, 'annual')}`
  }
  if (billingPeriod.value === 'monthly' && plan.monthlyPrice > 0) {
    const pct = annualSavingsPercent(plan.monthlyPrice, plan.annualPrice)
    const base = `${licenseDurationLabel(plan.id, 'monthly')} · one host`
    if (pct > 0) return `${base} · or ${formatPlanPrice(plan.annualPrice)}/yr (save ${pct}%)`
    return base
  }
  return ''
}

const featuresForPlan = (plan) => {
  const duration = `${licenseDurationLabel(plan.id, billingPeriod.value)} · one host`
  return [duration, ...plan.features.filter((f) => f !== 'One host')]
}
</script>

<style scoped>
.license-selector {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trial-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border-strong);
  background:
    linear-gradient(90deg, rgba(107, 159, 212, 0.08) 0%, transparent 55%),
    var(--app-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.trial-banner:hover:not(.disabled):not(.selected) {
  border-color: #6b9fd4;
}

.trial-banner.selected {
  border-color: #6b9fd4;
  box-shadow: 0 0 0 1px #6b9fd4;
}

.trial-banner.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.trial-banner__main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.trial-banner__badge {
  flex-shrink: 0;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b9fd4;
  background: rgba(107, 159, 212, 0.14);
  border: 0.5px solid rgba(107, 159, 212, 0.35);
  padding: 4px 8px;
  border-radius: 4px;
}

.trial-banner__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.trial-banner__copy strong {
  font-size: var(--type-section-title);
  color: var(--app-heading);
}

.trial-banner__copy span {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.trial-banner__meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.trial-banner__price {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 22px;
  font-weight: 650;
  color: var(--app-heading);
}

.trial-banner__radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--app-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-surface-elevated);
}

.trial-banner__radio.checked {
  border-color: #6b9fd4;
  background: #6b9fd4;
  color: #0b0f0d;
}

.trial-banner__radio svg {
  width: 11px;
  height: 11px;
}

.paid-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.paid-section__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.paid-section__title {
  margin: 0 0 2px;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-heading);
}

.paid-section__desc {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.billing-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: var(--btn-radius, 8px);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border-strong);
  gap: 2px;
}

.billing-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: var(--type-base);
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.billing-option:hover:not(:disabled):not(.active) {
  color: var(--app-text);
  background: var(--app-surface-hover);
}

.billing-option.active {
  background: var(--app-surface-elevated);
  color: var(--app-heading);
  box-shadow: 0 1px 2px var(--app-shadow);
}

.billing-option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.billing-save {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--dorian-gold-500, #c9a24a);
  background: rgba(201, 162, 74, 0.16);
  padding: 2px 7px;
  border-radius: 4px;
}

.billing-option.active .billing-save {
  color: #08120e;
  background: var(--dorian-gold-500, #c9a24a);
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tier-card {
  position: relative;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 380px;
  padding: 0;
  min-width: 0;
  border-radius: 12px;
  border: 0.5px solid var(--tier-card-border, var(--app-border-strong));
  background: var(--tier-card-bg, var(--app-surface-elevated));
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
  font: inherit;
  color: var(--app-text);
}

.tier-card:hover:not(.disabled):not(.selected) {
  border-color: var(--app-accent);
  transform: translateY(-1px);
}

.tier-card.selected {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 1px var(--app-accent);
}

.tier-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.tier-card-accent {
  height: 3px;
  width: 100%;
  flex-shrink: 0;
  background: var(--dorian-text-faint, #5b6560);
}

.tier-card--l4 .tier-card-accent {
  background: var(--dorian-l4, #5b9df0);
}

.tier-card--l7 .tier-card-accent {
  background: var(--dorian-l7, #b08cf0);
}

.tier-card--unified .tier-card-accent {
  background: var(--dorian-viper-500, #2e9e6c);
}

.tier-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.tier-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tier-badge {
  align-self: flex-start;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--dorian-gold-500, #c9a24a);
  background: rgba(201, 162, 74, 0.14);
  border: 0.5px solid rgba(201, 162, 74, 0.35);
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.tier-title {
  font-weight: 700;
  font-size: var(--type-metric-value);
  color: var(--app-heading);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.tier-tagline {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  font-weight: 500;
}

.tier-radio {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--app-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-surface-elevated);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tier-radio.checked {
  border-color: var(--app-accent);
  background: var(--app-accent);
  color: #08120e;
}

.tier-radio svg {
  width: 11px;
  height: 11px;
}

.plan-section {
  padding: 0 16px 14px;
}

.plan-section-label {
  margin: 0 0 8px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--app-text-muted);
}

.plan-section--pricing {
  padding-top: 2px;
}

.price-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--tier-pricing-bg, var(--app-surface-muted));
  border: 0.5px solid var(--app-border);
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.price-amount {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: clamp(1.25rem, 1.05rem + 0.5vw, 1.55rem);
  font-weight: 600;
  color: var(--dorian-viper-500, var(--app-accent));
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.pricing-unit {
  font-size: var(--type-caption);
  font-weight: 500;
  color: var(--app-text-muted);
}

.price-subline {
  margin: 0;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  line-height: 1.35;
}

.pricing-savings {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 0.5px dashed var(--app-border-strong);
}

.savings-pill {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--dorian-viper-700, #1f6e4a);
  background: rgba(46, 158, 108, 0.14);
  padding: 3px 8px;
  border-radius: 4px;
}

:global([data-theme='dark']) .savings-pill {
  color: var(--dorian-viper-400, #3fbd85);
  background: var(--dorian-viper-dim, #17352a);
}

.savings-detail {
  font-size: var(--type-small);
  color: var(--app-text-muted);
  line-height: 1.3;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: transparent;
  border: 0.5px solid var(--app-border);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
  line-height: 1.38;
}

.feature-list li:first-child {
  font-weight: 600;
  color: var(--app-text);
}

.feature-check {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  margin-top: 1px;
  color: var(--dorian-viper-500, var(--app-accent));
}

.plan-section--features {
  padding-bottom: 16px;
  margin-top: auto;
}

.tier-card.selected .plan-section--pricing .price-block {
  background: var(--app-accent-soft);
  border-color: rgba(46, 158, 108, 0.35);
}

.tier-card--l4.selected {
  border-color: var(--dorian-l4, #5b9df0);
  box-shadow: 0 0 0 1px var(--dorian-l4, #5b9df0);
}

.tier-card--l4.selected .tier-radio.checked {
  border-color: var(--dorian-l4, #5b9df0);
  background: var(--dorian-l4, #5b9df0);
  color: #0b0f0d;
}

.tier-card--l7.selected {
  border-color: var(--dorian-l7, #b08cf0);
  box-shadow: 0 0 0 1px var(--dorian-l7, #b08cf0);
}

.tier-card--l7.selected .tier-radio.checked {
  border-color: var(--dorian-l7, #b08cf0);
  background: var(--dorian-l7, #b08cf0);
  color: #0b0f0d;
}

.tier-card--unified.selected .price-amount {
  color: var(--dorian-viper-400, #3fbd85);
}

@media (max-width: 1100px) {
  .tier-grid {
    overflow-x: auto;
    padding-bottom: 8px;
    grid-template-columns: repeat(3, minmax(240px, 1fr));
    scroll-snap-type: x proximity;
  }

  .tier-card {
    scroll-snap-align: start;
    min-height: 360px;
  }

  .license-selector--compact .tier-card {
    min-height: 0;
  }

  .trial-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}

.license-selector--compact {
  gap: 12px;
}

.license-selector--compact .trial-banner {
  padding: 10px 12px;
}

.license-selector--compact .trial-banner__copy span {
  display: none;
}

.license-selector--compact .trial-banner__price {
  font-size: 16px;
}

.license-selector--compact .paid-section__desc {
  display: none;
}

.license-selector--compact .tier-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.license-selector--compact .tier-card {
  min-height: 0;
}

.license-selector--compact .billing-toggle {
  width: 100%;
  justify-content: center;
}

.license-selector--compact .billing-option {
  flex: 1;
  justify-content: center;
  padding: 7px 10px;
  font-size: var(--type-caption);
}

.license-selector--compact .billing-save {
  padding: 1px 5px;
}

.license-selector--compact .tier-header {
  padding: 10px 10px 6px;
}

.license-selector--compact .tier-title {
  font-size: var(--type-section-title);
}

.license-selector--compact .tier-tagline {
  font-size: var(--type-caption);
}

.license-selector--compact .tier-radio {
  width: 18px;
  height: 18px;
}

.license-selector--compact .plan-section--pricing {
  padding: 0 10px 10px;
}

.license-selector--compact .price-block {
  padding: 8px;
  gap: 4px;
}

.license-selector--compact .price-amount {
  font-size: var(--type-base);
}

.license-selector--compact .price-subline {
  font-size: var(--type-small);
}

.license-selector--compact .pricing-savings {
  margin-top: 2px;
  padding-top: 4px;
}

.license-selector--compact .savings-detail {
  display: none;
}

.license-selector--compact .paid-section__head {
  flex-direction: column;
  align-items: stretch;
}
</style>
