<template>
  <div
    class="license-selector"
    :class="{ 'license-selector--compact': compact }"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <div class="tier-grid">
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
          <h4 class="plan-section-label">Pricing</h4>
          <div class="pricing-rows">
            <div class="pricing-row">
              <span class="pricing-key">Monthly</span>
              <span class="pricing-val pricing-val--primary">
                {{ formatPlanPrice(plan.monthlyPrice) }}
                <span v-if="plan.monthlyPrice > 0" class="pricing-unit">/ mo</span>
              </span>
            </div>
            <div class="pricing-row">
              <span class="pricing-key">Annual</span>
              <span class="pricing-val">
                <template v-if="plan.annualPrice > 0">
                  {{ formatPlanPrice(plan.annualPrice) }}
                  <span class="pricing-unit">/ yr</span>
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div
              v-if="annualSavingsPercent(plan.monthlyPrice, plan.annualPrice) > 0"
              class="pricing-savings"
            >
              <span class="savings-pill">
                Save {{ annualSavingsPercent(plan.monthlyPrice, plan.annualPrice) }}%
              </span>
              <span class="savings-detail">
                ({{ formatPlanPrice(annualSavingsAmount(plan.monthlyPrice, plan.annualPrice)) }} vs monthly billing)
              </span>
            </div>
          </div>
        </section>

        <section v-if="!compact" class="plan-section plan-section--features">
          <h4 class="plan-section-label">Includes</h4>
          <ul class="feature-list">
            <li v-for="(feature, idx) in plan.features" :key="idx">
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
import {
  licensePlans,
  formatPlanPrice,
  annualSavingsPercent,
  annualSavingsAmount,
} from '@/data/licensePlans'

defineProps({
  modelValue: {
    type: String,
    required: true,
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

const emit = defineEmits(['update:modelValue'])

const select = (id) => {
  emit('update:modelValue', id)
}
</script>

<style scoped>
.license-selector {
  width: 100%;
}

.tier-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
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
  border-radius: 16px;
  border: 2px solid var(--tier-card-border, #e2e8f0);
  background: var(--tier-card-bg, #fff);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.18s ease;
  font: inherit;
  color: #1e293b;
}

.tier-card:hover:not(.disabled):not(.selected) {
  border-color: var(--app-accent, #a855f7);
  box-shadow: 0 8px 24px var(--app-accent-soft, rgba(168, 85, 247, 0.12));
  transform: translateY(-2px);
}

.tier-card.selected {
  border-color: var(--app-accent, #a855f7);
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.35),
    0 12px 32px var(--app-shadow, rgba(0, 0, 0, 0.2));
}

.tier-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.tier-card-accent {
  height: 4px;
  width: 100%;
  flex-shrink: 0;
}

.tier-card--slate .tier-card-accent {
  background: linear-gradient(90deg, #94a3b8, #64748b);
}

.tier-card--blue .tier-card-accent {
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
}

.tier-card--violet .tier-card-accent {
  background: linear-gradient(90deg, #a78bfa, #7c3aed);
}

.tier-card--indigo .tier-card-accent {
  background: linear-gradient(90deg, #818cf8, #4f46e5);
}

.tier-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
}

.tier-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tier-badge {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4338ca;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border: 1px solid rgba(99, 102, 241, 0.25);
  padding: 3px 8px;
  border-radius: 999px;
  margin-bottom: 4px;
}

.tier-title {
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--app-heading, #0f172a);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.tier-tagline {
  font-size: 0.82rem;
  color: var(--app-text-muted, #64748b);
  font-weight: 500;
}

.tier-radio {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.tier-radio.checked {
  border-color: #4f46e5;
  background: #4f46e5;
  color: #fff;
}

.tier-radio svg {
  width: 12px;
  height: 12px;
}

.plan-section {
  padding: 0 18px 14px;
}

.plan-section-label {
  margin: 0 0 8px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.plan-section--pricing {
  padding-top: 2px;
}

.pricing-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--tier-pricing-bg, linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%));
  border: 1px solid var(--app-border, #e2e8f0);
}

.pricing-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.pricing-key {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.pricing-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  text-align: right;
}

.pricing-val--primary {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.pricing-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

.pricing-savings {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
}

.savings-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #166534;
  background: rgba(34, 197, 94, 0.16);
  padding: 3px 8px;
  border-radius: 999px;
}

.savings-detail {
  font-size: 0.7rem;
  color: #64748b;
  text-align: right;
  line-height: 1.3;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--tier-card-bg, #fff);
  border: 1px solid var(--app-border, #f1f5f9);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.38;
}

.feature-list li:first-child {
  font-weight: 600;
  color: #334155;
}

.feature-check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  color: #6366f1;
}

.plan-section--features {
  padding-bottom: 18px;
  margin-top: auto;
}

.tier-card.selected .plan-section--pricing .pricing-rows {
  background: var(--app-accent-soft, linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%));
  border-color: rgba(168, 85, 247, 0.35);
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

/* Compact layout for dialogs (e.g. New Server) */
.license-selector--compact .tier-grid {
  grid-template-columns: repeat(4, minmax(132px, 1fr));
  gap: 8px;
}

.license-selector--compact .tier-card {
  min-height: 0;
}

.license-selector--compact .tier-header {
  padding: 10px 10px 6px;
}

.license-selector--compact .tier-title {
  font-size: 1rem;
}

.license-selector--compact .tier-tagline {
  font-size: 0.72rem;
}

.license-selector--compact .tier-radio {
  width: 18px;
  height: 18px;
}

.license-selector--compact .plan-section--pricing {
  padding: 0 10px 10px;
}

.license-selector--compact .plan-section-label {
  display: none;
}

.license-selector--compact .pricing-rows {
  padding: 8px;
  gap: 3px;
}

.license-selector--compact .price-monthly .price-amount {
  font-size: 0.95rem;
}

.license-selector--compact .price-annual .price-amount {
  font-size: 0.8rem;
}

.license-selector--compact .pricing-savings {
  margin-top: 2px;
  padding-top: 4px;
}

.license-selector--compact .savings-detail {
  display: none;
}
</style>
