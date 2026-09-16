<template>
  <div
    class="license-selector"
    :class="{ 'license-selector--compact': compact }"
  >
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

    <div
      class="tier-grid"
      role="radiogroup"
      :aria-label="ariaLabel"
    >
      <button
        v-for="plan in licensePlans"
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
              <span v-if="showPriceUnit(plan)" class="pricing-unit">
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
</template>

<script setup>
import { computed } from 'vue'
import {
  licensePlans,
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

const billingPeriod = computed(() => normalizeBillingPeriod(props.billingPeriod))
const annualDiscountPercent = computed(() => maxAnnualSavingsPercent(licensePlans))

const select = (id) => {
  emit('update:modelValue', id)
}

const setBillingPeriod = (period) => {
  if (props.disabled) return
  emit('update:billingPeriod', normalizeBillingPeriod(period))
}

const displayPrice = (plan) => formatPlanPrice(planPriceForPeriod(plan, billingPeriod.value))

const showPriceUnit = (plan) => planPriceForPeriod(plan, billingPeriod.value) > 0

const priceSubline = (plan) => {
  if (plan.id === 'Trial') return 'No credit card required'
  if (billingPeriod.value === 'annual' && plan.annualPrice > 0) {
    const perMo = annualPerMonthRate(plan.annualPrice)
    return `${formatPlanPrice(perMo)}/mo billed annually`
  }
  if (billingPeriod.value === 'monthly' && plan.annualPrice > 0) {
    const pct = annualSavingsPercent(plan.monthlyPrice, plan.annualPrice)
    if (pct > 0) return `or ${formatPlanPrice(plan.annualPrice)}/yr (save ${pct}%)`
  }
  return ''
}

const featuresForPlan = (plan) => {
  if (plan.id === 'Trial') return plan.features
  const duration = `${licenseDurationLabel(plan.id, billingPeriod.value)} · one host`
  return [duration, ...plan.features.filter((f) => f !== 'One host')]
}
</script>

<style scoped>
.license-selector {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Billing period — segmented control (brand radius, not capsule SaaS) */
.billing-toggle {
  display: inline-flex;
  align-self: center;
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
  transition:
    background 0.18s ease,
    color 0.18s ease;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.tier-card--trial .tier-card-accent {
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
    grid-template-columns: repeat(4, minmax(240px, 1fr));
    scroll-snap-type: x proximity;
  }

  .tier-card {
    scroll-snap-align: start;
    min-height: 360px;
  }

  .license-selector--compact .tier-card {
    min-height: 0;
  }
}

/* Compact layout for dialogs (e.g. New Edge) */
.license-selector--compact .tier-grid {
  grid-template-columns: repeat(4, minmax(132px, 1fr));
  gap: 8px;
}

.license-selector--compact .tier-card {
  min-height: 0;
}

.license-selector--compact .billing-toggle {
  align-self: stretch;
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
</style>
