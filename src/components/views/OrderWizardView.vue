<template>
  <div class="dashboard-view ord-view order-wizard">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="ord-kicker">Billing · {{ isAddon ? 'Add-on order' : editingId ? `Draft #${editingId}` : 'New order' }}</p>
        <h2>{{ pageTitle }}</h2>
        <p>{{ pageHint }}</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <nav class="co-progress" aria-label="Checkout progress">
      <ol>
        <li
          v-for="(item, index) in steps"
          :key="item.id"
          :class="{ active: step === index, done: step > index, reachable: index <= maxVisited }"
        >
          <button type="button" :disabled="index > maxVisited" @click="goTo(index)">
            <span class="co-progress__dot">
              <svg v-if="step > index" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="co-progress__text">
              <strong>{{ item.label }}</strong>
              <small>{{ item.sub }}</small>
            </span>
          </button>
        </li>
      </ol>
    </nav>

    <div v-if="loading" class="dash-panel ord-empty"><span class="dash-spinner" /></div>

    <div v-else class="co-layout">
      <div class="co-main">
        <!-- Plan -->
        <template v-if="stepId === 'plan'">
          <section class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>What do you want to protect?</h3>
                <p>Choose one option. You can add more sites or edges later.</p>
              </div>
              <div class="co-billing" role="radiogroup" aria-label="Billing period">
                <button type="button" role="radio" :aria-checked="form.period === 'month'" :class="{ active: form.period === 'month' }" @click="form.period = 'month'">Monthly</button>
                <button type="button" role="radio" :aria-checked="form.period === 'year'" :class="{ active: form.period === 'year' }" @click="form.period = 'year'">
                  Annual
                  <span v-if="annualSaving > 0" class="co-billing__save">Save {{ annualSaving }}%</span>
                </button>
              </div>
            </header>

            <div v-for="group in planGroups" :key="group.id" class="co-group" role="radiogroup" :aria-label="group.label">
              <p class="co-group__label">
                {{ group.label }}
                <span>{{ group.hint }}</span>
              </p>
              <div class="co-options">
                <div
                  v-for="plan in group.plans"
                  :key="plan.id"
                  :class="['co-option', { active: form.purpose === plan.id }]"
                >
                  <div
                    class="co-option__row"
                    role="radio"
                    tabindex="0"
                    :aria-checked="form.purpose === plan.id"
                    @click="choosePurpose(plan.id)"
                    @keydown.enter.prevent="choosePurpose(plan.id)"
                    @keydown.space.prevent="choosePurpose(plan.id)"
                  >
                    <span class="co-plan__radio" aria-hidden="true" />
                    <span class="co-option__icon" aria-hidden="true" v-html="plan.icon" />
                    <span class="co-option__text">
                      <strong>{{ plan.title }}</strong>
                      <small>{{ plan.hint }}</small>
                    </span>
                    <span class="co-option__price">
                      <code>{{ plan.formula }}</code>
                      <small>{{ perLabel }}</small>
                    </span>
                  </div>

                  <div v-if="form.purpose === plan.id" class="co-option__detail">
                    <div class="co-bill">
                      <dl class="co-bill__units">
                        <div v-for="row in plan.units" :key="row.label" class="co-bill__unit">
                          <dt>{{ row.label }}</dt>
                          <dd>{{ row.price }}</dd>
                        </div>
                      </dl>
                      <p class="co-bill__example">{{ plan.example }}</p>
                    </div>
                    <div class="co-facts">
                      <div class="co-facts__col">
                        <span class="co-facts__label">Included</span>
                        <ul><li v-for="item in plan.includes" :key="item">{{ item }}</li></ul>
                      </div>
                      <div class="co-facts__col">
                        <span class="co-facts__label">You provide</span>
                        <ul><li v-for="item in plan.youProvide" :key="item">{{ item }}</li></ul>
                      </div>
                      <div class="co-facts__col">
                        <span class="co-facts__label">After payment</span>
                        <ul><li v-for="item in plan.afterPay" :key="item">{{ item }}</li></ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-if="isAdmin" class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>Ordering for</h3>
                <p>Operators can place an order on behalf of a customer.</p>
              </div>
            </header>
            <label class="ord-field co-narrow">
              <span>Customer</span>
              <select v-model.number="form.userId" class="ord-select">
                <option :value="0">Myself ({{ auth.state.user?.name || 'me' }})</option>
                <option v-for="user in customerOptions" :key="user.id" :value="user.id">{{ user.name }} · {{ user.email }}</option>
              </select>
            </label>
          </section>
        </template>

        <!-- Edges -->
        <template v-if="stepId === 'edges'">
          <section v-if="isAddon && upgradeableEdges.length" class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>Add L4 to existing edges</h3>
                <p>Sparta network-flood protection for your L7 edges. {{ priceOf('L4_ADDON') }} each, prorated.</p>
              </div>
            </header>
            <div class="co-tiles">
              <label v-for="license in upgradeableEdges" :key="license.id" :class="['co-tile', { active: form.upgradeServerIds.includes(license.targetId) }]">
                <input v-model="form.upgradeServerIds" type="checkbox" :value="license.targetId" />
                <span class="co-tile__body">
                  <strong>{{ license.targetName || `Edge #${license.targetId}` }}</strong>
                  <small>L7 today · add L4</small>
                </span>
              </label>
            </div>
          </section>

          <p v-if="isAddon" class="co-section-title">New edges <span>optional</span></p>

          <section v-for="(edge, index) in form.edges" :key="edge.key" class="dash-panel co-panel co-item">
            <header class="co-item__head">
              <span class="co-item__index">{{ index + 1 }}</span>
              <div class="co-item__title">
                <h3>{{ edge.name || `Edge ${index + 1}` }}</h3>
                <p>{{ edge.ip || 'Your server that we set up and protect' }}</p>
              </div>
              <span class="co-item__tags">
                <span v-if="edgeHasL4(edge)" class="co-tag tone-l4">L4</span>
                <span v-if="edgeHasL7(edge)" class="co-tag tone-l7">L7</span>
              </span>
              <button v-if="canRemoveEdge" type="button" class="ghost-btn co-item__remove" @click="form.edges.splice(index, 1)">Remove</button>
            </header>

            <div class="co-block">
              <p class="co-block__label">Server</p>
              <div class="co-fields">
                <label class="ord-field">
                  <span>Name</span>
                  <input v-model.trim="edge.name" :class="['ord-input', { invalid: err(`edge.${edge.key}.name`) }]" placeholder="edge-fra-1" />
                  <small v-if="err(`edge.${edge.key}.name`)" class="co-err">{{ err(`edge.${edge.key}.name`) }}</small>
                </label>
                <label class="ord-field">
                  <span>Public IP</span>
                  <input v-model.trim="edge.ip" :class="['ord-input mono', { invalid: err(`edge.${edge.key}.ip`) }]" placeholder="203.0.113.10" />
                  <small v-if="err(`edge.${edge.key}.ip`)" class="co-err">{{ err(`edge.${edge.key}.ip`) }}</small>
                </label>
              </div>
            </div>

            <div class="co-block">
              <p class="co-block__label">SSH access <span>used once by our team to install the edge</span></p>
              <div class="co-fields co-fields--ssh">
                <label class="ord-field"><span>User</span><input v-model.trim="edge.sshUser" class="ord-input" placeholder="root" /></label>
                <label class="ord-field"><span>Port</span><input v-model.trim="edge.sshPort" class="ord-input" placeholder="22" /></label>
                <div class="ord-field">
                  <span>Sign in with</span>
                  <div class="ord-segment">
                    <button type="button" :class="{ active: edge.sshAuthType !== 'key' }" @click="edge.sshAuthType = 'password'">Password</button>
                    <button type="button" :class="{ active: edge.sshAuthType === 'key' }" @click="edge.sshAuthType = 'key'">Private key</button>
                  </div>
                </div>
              </div>
              <label v-if="edge.sshAuthType !== 'key'" class="ord-field">
                <span>Password</span>
                <input
                  v-model="edge.sshPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="['ord-input', { invalid: err(`edge.${edge.key}.auth`) }]"
                  :placeholder="edge.hasSshPassword ? 'Stored · leave blank to keep' : ''"
                />
                <small v-if="err(`edge.${edge.key}.auth`)" class="co-err">{{ err(`edge.${edge.key}.auth`) }}</small>
              </label>
              <div v-else class="co-fields">
                <label class="ord-field co-span">
                  <span>Private key</span>
                  <textarea
                    v-model="edge.sshPrivateKey"
                    :class="['ord-textarea', { invalid: err(`edge.${edge.key}.auth`) }]"
                    :placeholder="edge.hasSshKey ? 'Stored · leave blank to keep' : '-----BEGIN OPENSSH PRIVATE KEY-----'"
                  />
                  <small v-if="err(`edge.${edge.key}.auth`)" class="co-err">{{ err(`edge.${edge.key}.auth`) }}</small>
                </label>
                <label class="ord-field">
                  <span>Key passphrase <em>optional</em></span>
                  <input v-model="edge.sshKeyPassphrase" type="password" autocomplete="new-password" class="ord-input" />
                </label>
              </div>
            </div>

            <div v-if="form.purpose === 'site_own' || isAddon" class="co-block">
              <p class="co-block__label">Protection</p>
              <div class="co-tiles">
                <label v-if="isAddon" :class="['co-tile', { active: edge.l7 }]">
                  <input v-model="edge.l7" type="checkbox" />
                  <span class="co-tile__body">
                    <strong>L7 · host my sites</strong>
                    <small>Athens web protection · {{ priceOf('EDGE_L7') }}</small>
                  </span>
                </label>
                <label :class="['co-tile', { active: edge.l4 }]">
                  <input v-model="edge.l4" type="checkbox" />
                  <span class="co-tile__body">
                    <strong>L4 network protection</strong>
                    <small>Sparta flood filtering · {{ isAddon && !edge.l7 ? priceOf('EDGE_L4') : `+${priceOf('L4_ADDON')}` }}</small>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <button type="button" class="co-add" @click="addEdge">
            <span aria-hidden="true">+</span>
            {{ form.edges.length ? 'Add another edge' : 'Add an edge' }}
          </button>
        </template>

        <!-- Sites -->
        <template v-if="stepId === 'sites'">
          <section v-for="(site, index) in form.sites" :key="site.key" class="dash-panel co-panel co-item">
            <header class="co-item__head">
              <span class="co-item__index">{{ index + 1 }}</span>
              <div class="co-item__title">
                <h3>{{ site.domain || `Site ${index + 1}` }}</h3>
                <p>{{ sitePlacementLabel(site) }} · {{ site.origins.filter((o) => o.address).length || 'no' }} origin{{ site.origins.filter((o) => o.address).length === 1 ? '' : 's' }}</p>
              </div>
              <button v-if="canRemoveSite" type="button" class="ghost-btn co-item__remove" @click="form.sites.splice(index, 1)">Remove</button>
            </header>

            <div class="co-block">
              <div class="co-fields">
                <label class="ord-field">
                  <span>Domain</span>
                  <input
                    v-model.trim="site.domain"
                    :class="['ord-input', { invalid: err(`site.${site.key}.domain`) }]"
                    placeholder="shop.example.com"
                    @blur="site.domain = site.domain.toLowerCase()"
                  />
                  <small v-if="err(`site.${site.key}.domain`)" class="co-err">{{ err(`site.${site.key}.domain`) }}</small>
                </label>
                <label v-if="isAddon" class="ord-field">
                  <span>Served by</span>
                  <select v-model="site.target" :class="['ord-select', { invalid: err(`site.${site.key}.target`) }]">
                    <option value="platform">Dorian platform edge</option>
                    <option v-if="form.edges.some((e) => e.l7)" value="new">New edge(s) in this order</option>
                    <option v-for="license in hostingEdges" :key="license.id" :value="`edge:${license.targetId}`">
                      {{ license.targetName || `Edge #${license.targetId}` }}
                    </option>
                  </select>
                  <small v-if="err(`site.${site.key}.target`)" class="co-err">{{ err(`site.${site.key}.target`) }}</small>
                </label>
              </div>
            </div>

            <div class="co-block">
              <p class="co-block__label">
                Origin servers
                <span>where your site really runs · traffic is balanced across all of them</span>
              </p>
              <div class="co-origins">
                <div v-for="(origin, oIndex) in site.origins" :key="origin.key" class="co-origin">
                  <span class="co-origin__num">{{ oIndex + 1 }}</span>
                  <select v-model="origin.protocol" class="ord-select co-origin__proto" aria-label="Protocol">
                    <option value="http">http://</option>
                    <option value="https">https://</option>
                  </select>
                  <input
                    v-model.trim="origin.address"
                    :class="['ord-input mono', { invalid: err(`origin.${origin.key}`) }]"
                    placeholder="198.51.100.7:80 or origin.example.com"
                    aria-label="Origin address"
                    @paste="onOriginPaste($event, site, oIndex)"
                  />
                  <button
                    type="button"
                    class="icon-btn co-origin__remove"
                    :disabled="site.origins.length === 1"
                    aria-label="Remove origin"
                    @click="site.origins.splice(oIndex, 1)"
                  >×</button>
                  <small v-if="err(`origin.${origin.key}`)" class="co-err co-origin__err">{{ err(`origin.${origin.key}`) }}</small>
                </div>
                <small v-if="err(`site.${site.key}.origins`)" class="co-err">{{ err(`site.${site.key}.origins`) }}</small>
                <button v-if="site.origins.length < MAX_ORIGINS" type="button" class="ghost-btn co-origin__add" @click="site.origins.push(blankOrigin())">
                  + Add origin
                </button>
              </div>
            </div>
          </section>

          <button type="button" class="co-add" @click="addSite">
            <span aria-hidden="true">+</span>
            {{ form.sites.length ? 'Add another site' : 'Add a site' }}
          </button>

          <section class="dash-panel co-panel co-bulk">
            <button type="button" class="co-bulk__toggle" :aria-expanded="bulkOpen" @click="bulkOpen = !bulkOpen">
              <span>
                <strong>Many domains?</strong>
                Paste them all at once.
              </span>
              <span class="co-bulk__chev" aria-hidden="true">{{ bulkOpen ? '−' : '+' }}</span>
            </button>
            <template v-if="bulkOpen">
              <textarea
                v-model="bulkText"
                class="ord-textarea mono"
                placeholder="One site per line: domain, then one or more origins&#10;shop.example.com 198.51.100.7:80 198.51.100.8:80&#10;api.example.com https://10.0.0.5:443"
              />
              <div class="ord-actions">
                <button type="button" class="secondary-btn" :disabled="!bulkText.trim()" @click="applyBulk">Add to order</button>
              </div>
            </template>
          </section>
        </template>

        <!-- Checkout -->
        <template v-if="stepId === 'checkout'">
          <section class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>Billing period</h3>
                <p v-if="isAddon">Add-ons are prorated to end together with your current licenses.</p>
                <p v-else>Your licenses renew every period until you cancel.</p>
              </div>
            </header>
            <div class="co-periods" role="radiogroup">
              <button
                v-for="option in periodOptions"
                :key="option.id"
                type="button"
                role="radio"
                :aria-checked="form.period === option.id"
                :class="['co-period', { active: form.period === option.id }]"
                @click="form.period = option.id"
              >
                <span class="co-plan__radio" aria-hidden="true" />
                <span class="co-period__body">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.hint }}</small>
                </span>
                <span class="co-period__price">
                  {{ option.total === null ? '—' : money(option.total) }}
                  <small>{{ option.per }}</small>
                </span>
                <span v-if="option.save" class="co-period__save">Save {{ money(option.save) }}</span>
              </button>
            </div>
          </section>

          <section class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>Review your order</h3>
                <p>{{ planTitle }}<template v-if="customerLabel"> · for {{ customerLabel }}</template></p>
              </div>
            </header>
            <div v-if="form.edges.length || form.upgradeServerIds.length" class="co-review">
              <div class="co-review__head">
                <span>Edges</span>
                <button type="button" class="ghost-btn" @click="goToId('edges')">Edit</button>
              </div>
              <div v-for="edge in form.edges" :key="edge.key" class="co-review__row">
                <strong>{{ edge.name || 'Unnamed edge' }}</strong>
                <span class="mono">{{ edge.ip || 'no IP' }}</span>
                <span class="co-item__tags">
                  <span v-if="edgeHasL4(edge)" class="co-tag tone-l4">L4</span>
                  <span v-if="edgeHasL7(edge)" class="co-tag tone-l7">L7</span>
                </span>
              </div>
              <div v-for="name in upgradeNames" :key="name" class="co-review__row">
                <strong>{{ name }}</strong>
                <span>existing edge</span>
                <span class="co-item__tags"><span class="co-tag tone-l4">+ L4</span></span>
              </div>
            </div>
            <div v-if="form.sites.length" class="co-review">
              <div class="co-review__head">
                <span>Sites</span>
                <button type="button" class="ghost-btn" @click="goToId('sites')">Edit</button>
              </div>
              <div v-for="site in form.sites" :key="site.key" class="co-review__row co-review__row--site">
                <strong>{{ site.domain || 'no domain' }}</strong>
                <span class="co-review__origins">
                  <span v-for="origin in site.origins.filter((o) => o.address)" :key="origin.key" class="mono">{{ origin.protocol }}://{{ origin.address }}</span>
                </span>
                <span class="ord-muted">{{ sitePlacementLabel(site) }}</span>
              </div>
            </div>
            <label class="ord-field">
              <span>Note for our team <em>optional</em></span>
              <textarea v-model="form.note" class="ord-textarea co-note" placeholder="Preferred setup window, contact person…" />
            </label>
          </section>

          <section class="dash-panel co-panel">
            <header class="co-panel__head">
              <div>
                <h3>Payment</h3>
                <p>Bank transfer · invoice issued when you place the order</p>
              </div>
            </header>
            <ol class="co-flow">
              <li><strong>Place the order</strong><span>The price is locked and an invoice number is issued.</span></li>
              <li><strong>Pay the invoice</strong><span>Transfer the total and put the invoice number in the reference.</span></li>
              <li><strong>We set everything up</strong><span>After we confirm the payment, our team installs your edges and sites; licenses start then.</span></li>
            </ol>
            <label :class="['co-terms', { invalid: termsError }]">
              <input v-model="termsAccepted" type="checkbox" />
              <span>
                I understand the licenses renew each {{ form.period === 'month' ? 'month' : 'year' }} until cancelled and that
                payments are not refundable.
              </span>
            </label>
          </section>
        </template>

        <div v-if="errorMessage" class="ord-error" role="alert">{{ errorMessage }}</div>

        <div class="co-nav">
          <button v-if="step > 0" type="button" class="secondary-btn" @click="goTo(step - 1)">← Back</button>
          <span class="co-nav__spacer" />
          <button type="button" class="ghost-btn" :disabled="saving || !form.purpose" @click="save(false)">Save draft</button>
          <button v-if="!isLastStep" type="button" class="primary-btn" :disabled="!form.purpose" @click="next">
            Continue to {{ steps[step + 1]?.label.toLowerCase() }} →
          </button>
          <button v-else type="button" class="primary-btn co-nav__place" :disabled="saving || !quote.items.length" @click="save(true)">
            Place order · {{ money(quote.total) }}
          </button>
        </div>
      </div>

      <aside class="co-cart dash-panel" aria-label="Your order">
        <header class="co-cart__head">
          <h3>Your order</h3>
          <span v-if="quoting" class="dash-spinner dash-spinner--btn" aria-label="Updating" />
        </header>
        <div class="co-cart__plan">
          <strong>{{ planTitle || 'No plan selected' }}</strong>
          <span>{{ form.period === 'month' ? 'Billed monthly' : 'Billed annually' }}</span>
        </div>

        <div v-if="recurringItems.length || oneTimeItems.length" class="co-cart__lines">
          <div v-for="item in recurringItems" :key="item.code" class="co-cart__line">
            <span>
              {{ item.label }}
              <small>{{ item.quantity }} × {{ money(item.unitPrice) }}<template v-if="item.note"> · {{ item.note }}</template></small>
            </span>
            <span>{{ money(item.lineTotal) }}</span>
          </div>
          <div v-for="item in oneTimeItems" :key="item.code" class="co-cart__line co-cart__line--once">
            <span>
              {{ item.label }}
              <small>{{ item.quantity }} × {{ money(item.unitPrice) }} · one-time</small>
            </span>
            <span>{{ money(item.lineTotal) }}</span>
          </div>
        </div>
        <p v-else class="co-cart__empty">{{ form.purpose ? 'Add edges or sites to see your price.' : 'Pick a plan to get started.' }}</p>

        <div class="co-cart__total">
          <span>Due today</span>
          <strong>{{ money(quote.total) }}</strong>
        </div>
        <p v-if="oneTimeItems.length && recurringTotal && !isAddon" class="co-cart__renew">
          Then {{ money(recurringTotal) }} {{ perLabel }}
        </p>
        <p v-if="quote.coTermEnd" class="co-cart__renew">Prorated to {{ formatDate(quote.coTermEnd) }}, when your licenses renew together.</p>

        <button
          v-if="isLastStep"
          type="button"
          class="primary-btn co-cart__cta"
          :disabled="saving || !quote.items.length"
          @click="save(true)"
        >
          <span v-if="saving" class="dash-spinner dash-spinner--btn" />
          Place order · {{ money(quote.total) }}
        </button>
        <button v-else type="button" class="primary-btn co-cart__cta" :disabled="!form.purpose" @click="next">
          Continue →
        </button>

        <ul class="co-cart__trust">
          <li>Pay by bank transfer, no card needed</li>
          <li>Set up by our team after payment</li>
          <li>Cancel any time before renewal</li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { useAuth } from '@/stores/auth'
import { fetchUsers } from '@/api/users'
import { createOrder, fetchLicenses, fetchOrder, fetchOrderCatalog, quoteOrder, updateOrder } from '@/api/orders'
import { notifySuccess } from '@/utils/notify'
import { ORDER_PURPOSES, formatDate, formatMoney, purposeTitle } from '@/utils/orders'

const MAX_ORIGINS = 16
const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/

const ICONS = {
  site_platform:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  site_own:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="12" cy="6.5" r="3.5"/><path d="M7 16.5h.01"/></svg>',
  edge:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
  edge_site:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/><path d="M9.5 12.2l1.8 1.8 3.7-3.8"/></svg>',
}

const PLAN_META = {
  site_platform: {
    includes: [
      'Athens L7 (WAF, cache, TLS) on our edges',
      'Several origins per site',
      'Panel access for each site',
    ],
    youProvide: [
      'Each domain name',
      'Origin host or IP (port optional)',
    ],
    afterPay: [
      'We place each site on a platform edge',
      'License starts once setup is done',
    ],
  },
  site_own: {
    includes: [
      'Athens L7 on your edge',
      'One site license per domain',
      'Optional Sparta L4 on that edge',
    ],
    youProvide: [
      'Server IP and SSH access',
      'Each domain and its origins',
    ],
    afterPay: [
      'We install the edge over SSH',
      'License starts once setup is done',
    ],
  },
  edge: {
    includes: [
      'Sparta L4 flood filtering',
      'L4 analytics in the panel',
    ],
    youProvide: [
      'Server IP and SSH access',
    ],
    afterPay: [
      'We install Sparta on each edge',
      'License starts once setup is done',
    ],
  },
  edge_site: {
    includes: [
      'Sparta L4 + Athens L7 on each edge',
      'One site license per domain',
      'WAF and flood filtering together',
    ],
    youProvide: [
      'Server IP and SSH access',
      'Each domain and its origins',
    ],
    afterPay: [
      'We install the full stack over SSH',
      'License starts once setup is done',
    ],
  },
}

const PLAN_GROUPS = [
  { id: 'platform', label: 'No server of your own', hint: 'We host and protect your sites on Dorian edges', plans: ['site_platform'] },
  { id: 'own', label: 'On your own server', hint: 'We install protection on a server you control', plans: ['site_own', 'edge', 'edge_site'] },
]

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const isAdmin = computed(() => String(auth.state.user?.role || '').toLowerCase() === 'admin')
const editingId = computed(() => (route.name === 'order-edit' ? Number(route.params.id) : 0))

let keySeq = 0
const nextKey = () => `k${++keySeq}`

const form = reactive({
  purpose: '',
  period: 'month',
  userId: 0,
  parentOrderId: null,
  note: '',
  edges: [],
  sites: [],
  upgradeServerIds: [],
})

const step = ref(0)
const maxVisited = ref(0)
const loading = ref(true)
const saving = ref(false)
const quoting = ref(false)
const errorMessage = ref('')
const catalog = ref([])
const licenses = ref([])
const customers = ref([])
const quote = reactive({ items: [], total: 0, currency: 'USD', coTermEnd: null })
const altQuoteTotal = ref(null)
const bulkOpen = ref(false)
const bulkText = ref('')
const termsAccepted = ref(false)
const termsError = ref(false)
const fieldErrors = ref({})

const isAddon = computed(() => form.purpose === 'addon')
const showEdges = computed(() => ['edge', 'site_own', 'edge_site', 'addon'].includes(form.purpose))
const showSites = computed(() => ['site_own', 'site_platform', 'edge_site', 'addon'].includes(form.purpose))

const steps = computed(() => {
  const list = []
  if (!isAddon.value) list.push({ id: 'plan', label: 'Plan', sub: purposeTitle(form.purpose) || 'Choose protection' })
  if (!form.purpose || showEdges.value) {
    list.push({
      id: 'edges',
      label: isAddon.value ? 'Edges & L4' : 'Edges',
      sub: form.edges.length || form.upgradeServerIds.length
        ? `${form.edges.length + form.upgradeServerIds.length} selected`
        : 'Your servers',
    })
  }
  if (!form.purpose || showSites.value) {
    list.push({ id: 'sites', label: 'Sites', sub: form.sites.length ? `${form.sites.length} domain${form.sites.length === 1 ? '' : 's'}` : 'Domains & origins' })
  }
  list.push({ id: 'checkout', label: 'Checkout', sub: 'Review & pay' })
  return list
})
const stepId = computed(() => steps.value[step.value]?.id)
const isLastStep = computed(() => stepId.value === 'checkout')

const pageTitle = computed(() => {
  if (isAddon.value) return 'Add to your protection'
  if (editingId.value) return 'Edit order'
  return 'Order protection'
})
const pageHint = computed(() =>
  isAddon.value
    ? 'Add sites, edges or L4 to what you already have. Pricing is prorated to your current billing period.'
    : 'Pick a plan, tell us about your servers and sites, and check out. Save a draft any time.',
)

const money = (value) => formatMoney(value, quote.currency)
const moneyShort = (value) => {
  const n = Number(value) || 0
  const formatted = money(n)
  return Number.isInteger(n) ? formatted.replace(/\.00(?!\d)/, '') : formatted
}
const perLabel = computed(() => (form.period === 'month' ? '/ month' : '/ year'))
const perShort = computed(() => (form.period === 'month' ? '/mo' : '/yr'))

const catalogItem = (code) => catalog.value.find((c) => c.code === code)
const unitPrice = (code, period = form.period) => {
  const item = catalogItem(code)
  if (!item) return 0
  return period === 'month' || item.oneTime ? Number(item.monthlyPrice) || 0 : Number(item.annualPrice) || 0
}
const priceOf = (code) => {
  const item = catalogItem(code)
  if (!item) return '—'
  return `${money(unitPrice(code))}${item.oneTime ? ' one-time' : form.period === 'month' ? '/mo' : '/yr'}`
}
const annualSaving = computed(() => {
  const month = unitPrice('SITE_PLATFORM', 'month')
  const year = unitPrice('SITE_PLATFORM', 'year')
  if (!month || !year) return 0
  return Math.max(0, Math.round((1 - year / (month * 12)) * 100))
})

const unitRow = (code, label, { oneTime = false, amount = null } = {}) => {
  const value = amount == null ? unitPrice(code) : amount
  const item = catalogItem(code)
  const isOneTime = oneTime || item?.oneTime
  return {
    label,
    price: isOneTime
      ? value > 0
        ? `${money(value)} once`
        : 'Included'
      : `${money(value)}${perShort.value}`,
  }
}

const buildPlan = (id) => {
  const meta = ORDER_PURPOSES.find((p) => p.id === id) || { title: id, hint: '' }
  const extra = PLAN_META[id]
  const setup = unitPrice('SETUP_FEE')
  const per = perShort.value
  const setupNote = setup > 0 ? ` One-time setup of ${moneyShort(setup)} per edge.` : ''
  let formula = ''
  let example = ''
  let units = []
  switch (id) {
    case 'site_platform': {
      const site = unitPrice('SITE_PLATFORM')
      formula = `${moneyShort(site)} × sites`
      example = `For example, 3 sites cost ${moneyShort(site)} × 3 = ${moneyShort(site * 3)}${per}.`
      units = [unitRow('SITE_PLATFORM', 'Per site')]
      break
    }
    case 'site_own': {
      const edge = unitPrice('EDGE_L7')
      const site = unitPrice('SITE_OWN')
      const l4 = unitPrice('L4_ADDON')
      formula = `${moneyShort(edge)} + ${moneyShort(site)} × sites`
      example = `For example, 1 edge with 3 sites costs ${moneyShort(edge)} + ${moneyShort(site)} × 3 = ${moneyShort(edge + site * 3)}${per}.${setupNote}`
      units = [unitRow('EDGE_L7', 'Per edge (Athens L7)'), unitRow('SITE_OWN', 'Per site on the edge')]
      if (l4 > 0) units.push(unitRow('L4_ADDON', 'Optional L4, per edge'))
      if (setup > 0) units.push(unitRow('SETUP_FEE', 'Setup, per new edge', { oneTime: true }))
      break
    }
    case 'edge': {
      const edge = unitPrice('EDGE_L4')
      formula = `${moneyShort(edge)} × edges`
      example = `For example, 2 servers cost ${moneyShort(edge)} × 2 = ${moneyShort(edge * 2)}${per}.${setupNote}`
      units = [unitRow('EDGE_L4', 'Per edge (Sparta L4)')]
      if (setup > 0) units.push(unitRow('SETUP_FEE', 'Setup, per new edge', { oneTime: true }))
      break
    }
    default: {
      const edge = unitPrice('EDGE_L7') + unitPrice('L4_ADDON')
      const site = unitPrice('SITE_OWN')
      formula = `${moneyShort(edge)} + ${moneyShort(site)} × sites`
      example = `For example, 1 edge with 3 sites costs ${moneyShort(edge)} + ${moneyShort(site)} × 3 = ${moneyShort(edge + site * 3)}${per}.${setupNote}`
      units = [{ label: 'Per edge (L4 + L7)', price: `${money(edge)}${per}` }, unitRow('SITE_OWN', 'Per site on the edge')]
      if (setup > 0) units.push(unitRow('SETUP_FEE', 'Setup, per new edge', { oneTime: true }))
    }
  }
  return {
    id,
    title: meta.title,
    hint: meta.hint,
    includes: extra.includes,
    youProvide: extra.youProvide,
    afterPay: extra.afterPay,
    formula,
    example,
    units,
    icon: ICONS[id],
  }
}

const planGroups = computed(() => PLAN_GROUPS.map((g) => ({ ...g, plans: g.plans.map(buildPlan) })))

const planTitle = computed(() => (form.purpose ? purposeTitle(form.purpose) : ''))

const customerId = computed(() => (isAdmin.value && form.userId ? form.userId : auth.state.user?.id))
const customerOptions = computed(() => customers.value.filter((u) => u.id !== auth.state.user?.id))
const customerLabel = computed(() => {
  if (!isAdmin.value || !form.userId) return ''
  const user = customers.value.find((u) => u.id === form.userId)
  return user ? `${user.name} · ${user.email}` : `User #${form.userId}`
})

const customerLicenses = computed(() =>
  licenses.value.filter(
    (l) => l.userId === customerId.value && l.scope === 'server' && !['expired', 'cancelled'].includes(l.status),
  ),
)
const hostingEdges = computed(() => customerLicenses.value.filter((l) => l.kind === 'L7' || l.kind === 'Unified'))
const upgradeableEdges = computed(() => customerLicenses.value.filter((l) => l.kind === 'L7'))
const upgradeNames = computed(() =>
  form.upgradeServerIds.map((id) => upgradeableEdges.value.find((l) => l.targetId === id)?.targetName || `Edge #${id}`),
)

const canRemoveEdge = computed(() => isAddon.value || form.edges.length > 1)
const canRemoveSite = computed(() => isAddon.value || form.sites.length > 1)

const recurringItems = computed(() => quote.items.filter((i) => !catalogItem(i.code)?.oneTime))
const oneTimeItems = computed(() => quote.items.filter((i) => catalogItem(i.code)?.oneTime))
const recurringTotal = computed(() => recurringItems.value.reduce((sum, i) => sum + (Number(i.lineTotal) || 0), 0))

const periodOptions = computed(() => {
  const current = quote.items.length ? quote.total : null
  const other = altQuoteTotal.value
  const monthTotal = form.period === 'month' ? current : other
  const yearTotal = form.period === 'year' ? current : other
  const oneTime = oneTimeItems.value.reduce((sum, i) => sum + (Number(i.lineTotal) || 0), 0)
  let save = 0
  if (!isAddon.value && monthTotal !== null && yearTotal !== null) {
    save = Math.max(0, Math.round(((monthTotal - oneTime) * 12 - (yearTotal - oneTime)) * 100) / 100)
  }
  return [
    { id: 'month', label: 'Monthly', hint: 'Flexible, renew every month', total: monthTotal, per: isAddon.value ? 'prorated' : '/ month', save: 0 },
    { id: 'year', label: 'Annual', hint: 'One payment per year', total: yearTotal, per: isAddon.value ? 'prorated' : '/ year', save },
  ]
})

const edgeHasL4 = (edge) => form.purpose === 'edge' || form.purpose === 'edge_site' || edge.l4
const edgeHasL7 = (edge) => ['site_own', 'edge_site'].includes(form.purpose) || (isAddon.value && edge.l7)

const sitePlacementLabel = (site) => {
  if (form.purpose === 'site_platform' || (isAddon.value && site.target === 'platform')) return 'Dorian platform edge'
  if (site.target?.startsWith('edge:')) {
    const id = Number(site.target.slice(5))
    return hostingEdges.value.find((l) => l.targetId === id)?.targetName || `Edge #${id}`
  }
  if (isAddon.value && site.target === 'new') return 'New edge in this order'
  return 'Your edge'
}

const blankEdge = () => ({
  key: nextKey(),
  name: '',
  ip: '',
  sshUser: 'root',
  sshPort: '22',
  sshAuthType: 'password',
  sshPassword: '',
  sshPrivateKey: '',
  sshKeyPassphrase: '',
  hasSshPassword: false,
  hasSshKey: false,
  l4: false,
  l7: isAddon.value,
})

const blankOrigin = (address = '', protocol = 'http') => ({ key: nextKey(), address, protocol })

const parseOrigin = (raw) => {
  const match = String(raw).trim().match(/^(https?):\/\/(.+)$/i)
  if (match) return blankOrigin(match[2].replace(/\/+$/, ''), match[1].toLowerCase())
  return blankOrigin(String(raw).trim())
}

const blankSite = (domain = '', origins = []) => ({
  key: nextKey(),
  domain,
  origins: origins.length ? origins : [blankOrigin()],
  target: isAddon.value ? (hostingEdges.value[0] ? `edge:${hostingEdges.value[0].targetId}` : 'platform') : 'own',
})

const addEdge = () => form.edges.push(blankEdge())
const addSite = () => form.sites.push(blankSite())

const applyBulk = () => {
  const lines = bulkText.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    const [domain, ...origins] = line.split(/[\s,;]+/).filter(Boolean)
    if (!domain) continue
    const empty = form.sites.findIndex((s) => !s.domain && !s.origins.some((o) => o.address))
    const site = blankSite(domain.toLowerCase(), origins.slice(0, MAX_ORIGINS).map(parseOrigin))
    if (empty >= 0) form.sites.splice(empty, 1, site)
    else form.sites.push(site)
  }
  bulkText.value = ''
  bulkOpen.value = false
}

// Pasting several addresses into one origin field splits them into rows.
const onOriginPaste = (event, site, index) => {
  const text = event.clipboardData?.getData('text') || ''
  const parts = text.split(/[\s,;]+/).filter(Boolean)
  if (parts.length < 2) return
  event.preventDefault()
  const parsed = parts.map(parseOrigin)
  site.origins.splice(index, 1, ...parsed)
  site.origins.splice(MAX_ORIGINS)
}

const choosePurpose = (purpose) => {
  form.purpose = purpose
  if (['edge', 'site_own', 'edge_site'].includes(purpose) && !form.edges.length) addEdge()
  if (['site_own', 'site_platform', 'edge_site'].includes(purpose) && !form.sites.length) addSite()
}

const err = (key) => fieldErrors.value[key] || ''

const validIP = (value) => IPV4_RE.test(value) || (value.includes(':') && /^[0-9a-f:.]+$/i.test(value))

const validOrigin = (address) => {
  let host = address
  let port = ''
  const v6 = address.match(/^\[([^\]]+)\](?::(\d+))?$/)
  if (v6) {
    host = v6[1]
    port = v6[2] || ''
  } else if ((address.match(/:/g) || []).length === 1) {
    ;[host, port] = address.split(':')
  }
  if (port && !(Number(port) >= 1 && Number(port) <= 65535 && /^\d+$/.test(port))) return false
  return validIP(host) || HOST_RE.test(host)
}

const validateStep = (id) => {
  const errors = {}
  if (id === 'edges') {
    const seen = new Set()
    for (const edge of form.edges) {
      if (!edge.name) errors[`edge.${edge.key}.name`] = 'Give the edge a name.'
      if (!validIP(edge.ip)) errors[`edge.${edge.key}.ip`] = 'Enter the public IP address.'
      else if (seen.has(edge.ip)) errors[`edge.${edge.key}.ip`] = 'This IP is listed twice.'
      seen.add(edge.ip)
      if (edge.sshAuthType === 'key' ? !edge.hasSshKey && !edge.sshPrivateKey.trim() : !edge.hasSshPassword && !edge.sshPassword) {
        errors[`edge.${edge.key}.auth`] = edge.sshAuthType === 'key' ? 'Paste the private key.' : 'Enter the SSH password.'
      }
    }
    if (!isAddon.value && !form.edges.length) errors.form = 'Add at least one edge.'
  }
  if (id === 'sites') {
    const seen = new Set()
    for (const site of form.sites) {
      if (!DOMAIN_RE.test(site.domain)) errors[`site.${site.key}.domain`] = 'Enter a domain like shop.example.com.'
      else if (seen.has(site.domain)) errors[`site.${site.key}.domain`] = 'This domain is listed twice.'
      seen.add(site.domain)
      const filled = site.origins.filter((o) => o.address)
      if (!filled.length) errors[`site.${site.key}.origins`] = 'Add at least one origin server.'
      for (const origin of filled) {
        if (!validOrigin(origin.address)) errors[`origin.${origin.key}`] = 'Use a host or IP, optionally with :port.'
      }
      if (isAddon.value && site.target === 'new' && !form.edges.some((e) => e.l7)) {
        errors[`site.${site.key}.target`] = 'No new L7 edge in this order.'
      }
    }
    if (!isAddon.value && !form.sites.length) errors.form = 'Add at least one site.'
  }
  return errors
}

const goTo = (index) => {
  if (index < 0 || index >= steps.value.length || index > maxVisited.value) return
  fieldErrors.value = {}
  errorMessage.value = ''
  step.value = index
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const goToId = (id) => goTo(steps.value.findIndex((s) => s.id === id))

const next = () => {
  errorMessage.value = ''
  if (stepId.value === 'plan' && !form.purpose) {
    errorMessage.value = 'Choose a plan to continue.'
    return
  }
  const errors = validateStep(stepId.value)
  fieldErrors.value = errors
  if (Object.keys(errors).length) {
    errorMessage.value = errors.form || 'Please fix the highlighted fields.'
    return
  }
  step.value += 1
  maxVisited.value = Math.max(maxVisited.value, step.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const buildPayload = (submit, period = form.period) => ({
  userId: isAdmin.value ? form.userId || 0 : 0,
  purpose: form.purpose,
  period,
  parentOrderId: form.parentOrderId || null,
  note: form.note,
  submit,
  details: {
    edges: form.edges.map((edge) => ({
      name: edge.name,
      ip: edge.ip,
      sshUser: edge.sshUser,
      sshPort: edge.sshPort,
      sshAuthType: edge.sshAuthType,
      sshPassword: edge.sshAuthType === 'key' ? '' : edge.sshPassword,
      sshPrivateKey: edge.sshAuthType === 'key' ? edge.sshPrivateKey : '',
      sshKeyPassphrase: edge.sshAuthType === 'key' ? edge.sshKeyPassphrase : '',
      l4: edgeHasL4(edge),
      l7: edgeHasL7(edge),
    })),
    sites: form.sites.map((site) => {
      const out = {
        domain: site.domain,
        origins: site.origins.filter((o) => o.address).map((o) => ({ address: o.address, protocol: o.protocol })),
        placement: 'own',
      }
      if (form.purpose === 'site_platform' || (isAddon.value && site.target === 'platform')) out.placement = 'platform'
      if (isAddon.value && site.target?.startsWith('edge:')) out.serverIds = [Number(site.target.slice(5))]
      return out
    }),
    upgradeServerIds: isAddon.value ? form.upgradeServerIds : [],
  },
})

let quoteTimer = null
let quoteSeq = 0
const refreshQuote = () => {
  clearTimeout(quoteTimer)
  if (!form.purpose) {
    quote.items = []
    quote.total = 0
    altQuoteTotal.value = null
    return
  }
  quoteTimer = setTimeout(async () => {
    const seq = ++quoteSeq
    quoting.value = true
    const otherPeriod = form.period === 'month' ? 'year' : 'month'
    try {
      const [data, alt] = await Promise.all([
        quoteOrder(buildPayload(false)),
        quoteOrder(buildPayload(false, otherPeriod)).catch(() => null),
      ])
      if (seq !== quoteSeq) return
      quote.items = data?.items || []
      quote.total = data?.total || 0
      quote.currency = data?.currency || 'USD'
      quote.coTermEnd = data?.coTermEnd || null
      altQuoteTotal.value = alt?.items?.length ? alt.total : null
    } catch {
      /* keep last quote */
    } finally {
      if (seq === quoteSeq) quoting.value = false
    }
  }, 300)
}

watch(
  () => [
    form.purpose,
    form.period,
    form.userId,
    form.edges.map((e) => [e.l4, e.l7]),
    form.sites.map((s) => [s.target, Boolean(s.domain || s.origins.some((o) => o.address))]),
    form.upgradeServerIds.length,
  ],
  refreshQuote,
  { deep: true },
)

watch(
  () => [form.edges, form.sites],
  () => {
    const current = Object.keys(fieldErrors.value).filter((k) => k !== 'form')
    if (!current.length) return
    const fresh = validateStep(stepId.value)
    fieldErrors.value = Object.fromEntries(current.filter((k) => fresh[k]).map((k) => [k, fresh[k]]))
    if (!Object.keys(fieldErrors.value).length) errorMessage.value = ''
  },
  { deep: true },
)

watch(termsAccepted, (value) => {
  if (value) termsError.value = false
})

const save = async (submit) => {
  errorMessage.value = ''
  if (!form.purpose) {
    errorMessage.value = 'Choose a plan first.'
    goTo(0)
    return
  }
  if (submit) {
    for (const [index, item] of steps.value.entries()) {
      const errors = validateStep(item.id)
      if (Object.keys(errors).length) {
        step.value = index
        fieldErrors.value = errors
        errorMessage.value = errors.form || 'Please fix the highlighted fields.'
        return
      }
    }
    if (!termsAccepted.value) {
      termsError.value = true
      errorMessage.value = 'Please confirm the billing terms.'
      return
    }
  }
  saving.value = true
  try {
    const payload = buildPayload(submit)
    const saved = editingId.value ? await updateOrder(editingId.value, payload) : await createOrder(payload)
    notifySuccess(
      submit ? 'Order placed' : 'Draft saved',
      submit ? `Order #${saved.id} is awaiting payment (invoice ${saved.invoiceNo}).` : `Draft #${saved.id} saved.`,
    )
    router.push({ name: 'order-detail', params: { id: saved.id } })
  } catch (e) {
    errorMessage.value = e?.message || 'Could not save the order.'
  } finally {
    saving.value = false
  }
}

const hydrateFromOrder = (order) => {
  form.purpose = order.purpose
  form.period = order.period || 'month'
  form.userId = isAdmin.value && order.userId !== auth.state.user?.id ? order.userId : 0
  form.parentOrderId = order.parentOrderId || null
  form.note = order.note || ''
  form.edges = (order.details?.edges || []).map((edge) => ({
    ...blankEdge(),
    ...edge,
    sshPassword: '',
    sshPrivateKey: '',
    sshKeyPassphrase: '',
    key: nextKey(),
  }))
  form.sites = (order.details?.sites || []).map((site) => {
    const origins = site.origins?.length
      ? site.origins.map((o) => blankOrigin(o.address, o.protocol || 'http'))
      : site.origin
        ? [blankOrigin(site.origin, site.originProtocol || 'http')]
        : []
    return {
      ...blankSite(site.domain, origins),
      target:
        site.placement === 'platform'
          ? 'platform'
          : site.serverIds?.length
            ? `edge:${site.serverIds[0]}`
            : order.purpose === 'addon'
              ? 'new'
              : 'own',
    }
  })
  form.upgradeServerIds = [...(order.details?.upgradeServerIds || [])]
}

const startAt = (index) => {
  step.value = index
  maxVisited.value = steps.value.length - 1
}

onMounted(async () => {
  try {
    const [cat, lic] = await Promise.all([fetchOrderCatalog(), fetchLicenses().catch(() => [])])
    catalog.value = Array.isArray(cat) ? cat : []
    licenses.value = Array.isArray(lic) ? lic : []
    if (isAdmin.value) {
      customers.value = await fetchUsers().catch(() => [])
    }
    if (editingId.value) {
      const order = await fetchOrder(editingId.value)
      if (order.status !== 'draft') {
        router.replace({ name: 'order-detail', params: { id: order.id } })
        return
      }
      hydrateFromOrder(order)
      startAt(isAddon.value ? 0 : 1)
    } else if (route.query.addon) {
      form.purpose = 'addon'
      if (route.query.parent) form.parentOrderId = Number(route.query.parent)
      if (route.query.customer && isAdmin.value) form.userId = Number(route.query.customer)
      if (route.query.upgrade) form.upgradeServerIds = [Number(route.query.upgrade)]
      if (route.query.period) form.period = route.query.period === 'year' ? 'year' : 'month'
      if (!route.query.upgrade) addSite()
      step.value = route.query.upgrade ? 0 : 1
      maxVisited.value = step.value
    } else if (route.query.purpose && ORDER_PURPOSES.some((p) => p.id === route.query.purpose)) {
      choosePurpose(route.query.purpose)
      step.value = 1
      maxVisited.value = 1
    }
  } catch (e) {
    errorMessage.value = e?.message || 'Could not load the order form.'
  } finally {
    loading.value = false
    refreshQuote()
  }
})
</script>

<style scoped>
.order-wizard {
  --co-accent: var(--dorian-viper-400, var(--app-accent, #3fbd85));
  --co-accent-soft: color-mix(in srgb, var(--co-accent) 12%, transparent);
}

.mono {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

/* progress */
.co-progress ol {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.co-progress li {
  position: relative;
  flex: 1;
  min-width: 0;
}

.co-progress li + li::before {
  content: '';
  position: absolute;
  top: 17px;
  left: calc(-50% + 22px);
  right: calc(50% + 22px);
  height: 2px;
  border-radius: 2px;
  background: var(--app-border-strong);
}

.co-progress li.done + li::before,
.co-progress li.active::before {
  background: var(--co-accent);
}

.co-progress button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
  border: none;
  background: none;
  font: inherit;
  color: var(--app-text-muted);
  cursor: pointer;
}

.co-progress button:disabled {
  cursor: default;
}

.co-progress__dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid var(--app-border-strong);
  background: var(--app-surface);
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.co-progress__dot svg {
  width: 16px;
  height: 16px;
}

.co-progress li.active .co-progress__dot {
  border-color: var(--co-accent);
  color: var(--co-accent);
  box-shadow: 0 0 0 4px var(--co-accent-soft);
}

.co-progress li.done .co-progress__dot {
  border-color: var(--co-accent);
  background: var(--co-accent);
  color: var(--app-bg, #0a0a0a);
}

.co-progress__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 0;
  max-width: 100%;
}

.co-progress__text strong {
  font-size: 13px;
  font-weight: 650;
}

.co-progress__text small {
  font-size: 11px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.co-progress li.active strong,
.co-progress li.done strong {
  color: var(--app-heading);
}

.co-progress li.reachable:not(.active) button:hover .co-progress__dot {
  border-color: var(--co-accent);
}

/* layout */
.co-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

.co-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.co-panel {
  padding: 20px;
  gap: 16px;
}

.co-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.co-panel__head h3,
.co-item__title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--app-heading);
}

.co-panel__head p,
.co-item__title p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.co-narrow {
  max-width: 420px;
}

.co-section-title {
  margin: 6px 0 -4px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.co-section-title span {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

/* billing toggle */
.co-billing {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-muted);
}

.co-billing button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 999px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
}

.co-billing button.active {
  color: var(--app-heading);
  background: var(--app-surface);
  box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
}

.co-billing__save {
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10.5px;
  color: var(--co-accent);
  background: var(--co-accent-soft);
}

/* plan options */
.co-group + .co-group {
  margin-top: 4px;
}

.co-group__label {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.co-group__label span {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

.co-options {
  display: flex;
  flex-direction: column;
  border: 0.5px solid var(--app-border-strong);
  border-radius: 10px;
  overflow: hidden;
  background: var(--app-surface-muted);
}

.co-option + .co-option {
  border-top: 0.5px solid var(--app-border);
}

.co-option.active {
  background: linear-gradient(180deg, var(--co-accent-soft) 0%, transparent 120px), var(--app-surface-muted);
  box-shadow: inset 3px 0 0 var(--co-accent);
}

.co-option__row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease;
}

.co-option:not(.active) .co-option__row:hover,
.co-option__row:focus-visible {
  background: color-mix(in srgb, var(--app-heading) 3%, transparent);
}

.co-option__icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: var(--co-accent);
  background: var(--co-accent-soft);
}

.co-option__icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.co-option__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.co-option__text strong {
  font-size: 14px;
  font-weight: 650;
  color: var(--app-heading);
}

.co-option__text small {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.co-option__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  text-align: right;
}

.co-option__price code {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 14px;
  font-weight: 700;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  background: none;
}

.co-option__price small {
  font-size: 11px;
  color: var(--app-text-muted);
}

.co-option__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2px 18px 18px 84px;
}

.co-bill {
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
  align-items: center;
  gap: 18px;
}

.co-bill__units {
  margin: 0;
  border: 0.5px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--app-surface);
}

.co-bill__unit {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 12.5px;
}

.co-bill__unit + .co-bill__unit {
  border-top: 0.5px solid var(--app-border);
}

.co-bill__unit dt {
  color: var(--app-text-muted);
}

.co-bill__unit dd {
  margin: 0;
  font-weight: 650;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.co-bill__example {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--app-text);
}

.co-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding-top: 14px;
  border-top: 0.5px solid var(--app-border);
}

.co-facts__label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.co-facts ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.co-facts li {
  position: relative;
  padding-left: 18px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text);
}

.co-facts li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 0.35em;
  width: 8px;
  height: 4px;
  border-left: 1.6px solid var(--co-accent);
  border-bottom: 1.6px solid var(--co-accent);
  transform: rotate(-45deg);
}

@media (max-width: 900px) {
  .co-option__row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .co-option__icon {
    display: none;
  }

  .co-option__price {
    grid-column: 2;
    align-items: flex-start;
    text-align: left;
  }

  .co-option__detail {
    padding-left: 18px;
  }

  .co-bill,
  .co-facts {
    grid-template-columns: 1fr;
  }
}

.co-plan__radio {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--app-border-strong);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.co-option.active .co-plan__radio,
.co-period.active .co-plan__radio {
  border-color: var(--co-accent);
  box-shadow: inset 0 0 0 3px var(--app-surface-muted), inset 0 0 0 9px var(--co-accent);
}

/* item panels */
.co-item__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.co-item__index {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--co-accent);
  background: var(--co-accent-soft);
}

.co-item__title {
  min-width: 0;
  flex: 1;
}

.co-item__title h3,
.co-item__title p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.co-item__tags {
  display: inline-flex;
  gap: 4px;
}

.co-tag {
  --tag-tone: var(--app-text-muted);
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 650;
  color: var(--tag-tone);
  background: color-mix(in srgb, var(--tag-tone) 14%, transparent);
}

.co-tag.tone-l4 { --tag-tone: var(--dorian-l4, #6b9fd4); }
.co-tag.tone-l7 { --tag-tone: var(--dorian-l7, #8fa3b8); }

.co-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.co-block + .co-block {
  padding-top: 14px;
  border-top: 0.5px dashed var(--app-border);
}

.co-block__label {
  margin: 0;
  font-size: 12px;
  font-weight: 650;
  color: var(--app-heading);
}

.co-block__label span {
  margin-left: 6px;
  font-weight: 400;
  color: var(--app-text-muted);
}

.co-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.co-fields--ssh {
  grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1.2fr);
}

.co-span {
  grid-column: 1 / -1;
}

.ord-field em {
  font-style: normal;
  font-weight: 400;
  color: var(--app-text-muted);
}

.ord-input.invalid,
.ord-select.invalid,
.ord-textarea.invalid {
  border-color: var(--dorian-danger, #e15241);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dorian-danger, #e15241) 15%, transparent);
}

.co-err {
  font-size: 11.5px;
  color: var(--dorian-danger, #e15241);
}

/* selectable tiles */
.co-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.co-tile {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.co-tile:hover {
  border-color: color-mix(in srgb, var(--co-accent) 45%, var(--app-border-strong));
}

.co-tile.active {
  border-color: var(--co-accent);
  background: linear-gradient(180deg, var(--co-accent-soft), transparent), var(--app-surface-muted);
}

.co-tile input {
  margin-top: 2px;
  accent-color: var(--co-accent);
}

.co-tile__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.co-tile__body strong {
  font-size: 13px;
  color: var(--app-heading);
}

.co-tile__body small {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

/* origins */
.co-origins {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.co-origin {
  display: grid;
  grid-template-columns: 26px 104px minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
}

.co-origin__num {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 650;
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
}

.co-origin__remove {
  font-size: 17px;
  line-height: 1;
}

.co-origin__remove:disabled {
  opacity: 0.3;
  cursor: default;
}

.co-origin__err {
  grid-column: 3 / 4;
  margin-top: -4px;
}

.co-origin__add {
  align-self: flex-start;
  margin-left: 34px;
}

/* add buttons */
.co-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  border: 1px dashed var(--app-border-strong);
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.co-add span {
  font-size: 18px;
  line-height: 1;
}

.co-add:hover {
  border-color: var(--co-accent);
  color: var(--co-accent);
  background: var(--co-accent-soft);
}

.co-bulk {
  padding: 0;
  gap: 0;
}

.co-bulk__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  background: none;
  font: inherit;
  font-size: 12.5px;
  color: var(--app-text-muted);
  text-align: left;
  cursor: pointer;
}

.co-bulk__toggle strong {
  color: var(--app-heading);
  margin-right: 4px;
}

.co-bulk__chev {
  font-size: 18px;
}

.co-bulk > textarea,
.co-bulk > .ord-actions {
  margin: 0 20px 16px;
}

.co-bulk > textarea {
  min-height: 110px;
}

/* checkout */
.co-periods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.co-period {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  font: inherit;
  text-align: left;
  color: var(--app-text);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.co-period:hover {
  border-color: color-mix(in srgb, var(--co-accent) 45%, var(--app-border-strong));
}

.co-period.active {
  border-color: var(--co-accent);
  box-shadow: 0 0 0 1px var(--co-accent);
}

.co-period__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.co-period__body strong {
  font-size: 14px;
  color: var(--app-heading);
}

.co-period__body small,
.co-period__price small {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--app-text-muted);
}

.co-period__price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 17px;
  font-weight: 700;
  color: var(--app-heading);
}

.co-period__save {
  position: absolute;
  top: -9px;
  right: 14px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--app-bg, #0a0a0a);
  background: var(--co-accent);
}

.co-review {
  display: flex;
  flex-direction: column;
  border: 0.5px solid var(--app-border);
  border-radius: 10px;
  overflow: hidden;
}

.co-review__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 14px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
}

.co-review__row {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
  border-top: 0.5px solid var(--app-border);
}

.co-review__row strong {
  color: var(--app-heading);
  overflow: hidden;
  text-overflow: ellipsis;
}

.co-review__row--site {
  align-items: start;
}

.co-review__origins {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--app-text-muted);
  min-width: 0;
}

.co-review__origins span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.co-note {
  min-height: 70px;
  font-family: inherit;
  font-size: 13px;
}

.co-flow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: flow;
}

.co-flow li {
  counter-increment: flow;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 10px;
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
  font-size: 12px;
  color: var(--app-text-muted);
}

.co-flow li::before {
  content: counter(flow);
  width: 22px;
  height: 22px;
  margin-bottom: 4px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--co-accent);
  background: var(--co-accent-soft);
}

.co-flow strong {
  font-size: 13px;
  color: var(--app-heading);
}

.co-terms {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  font-size: 12.5px;
  color: var(--app-text);
  cursor: pointer;
}

.co-terms input {
  margin-top: 2px;
  accent-color: var(--co-accent);
}

.co-terms.invalid {
  border-color: var(--dorian-danger, #e15241);
}

.co-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.co-nav__spacer {
  flex: 1;
}

@media (min-width: 1281px) {
  .co-nav__place {
    display: none;
  }
}

/* cart */
.co-cart {
  position: sticky;
  top: 14px;
  padding: 20px;
  gap: 14px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--co-accent) 7%, transparent) 0%, transparent 35%), var(--app-surface);
}

.co-cart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.co-cart__head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--app-heading);
}

.co-cart__plan {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 10px;
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
}

.co-cart__plan strong {
  font-size: 13px;
  color: var(--app-heading);
}

.co-cart__plan span {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.co-cart__lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.co-cart__line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: var(--app-text);
}

.co-cart__line > span:first-child {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.co-cart__line small {
  font-size: 11px;
  color: var(--app-text-muted);
}

.co-cart__line > span:last-child {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.co-cart__line--once {
  padding-top: 10px;
  border-top: 0.5px dashed var(--app-border);
}

.co-cart__empty {
  margin: 0;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.co-cart__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 0.5px solid var(--app-border-strong);
  font-size: 13px;
  color: var(--app-text-muted);
}

.co-cart__total strong {
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
}

.co-cart__renew {
  margin: -8px 0 0;
  font-size: 11.5px;
  text-align: right;
  color: var(--app-text-muted);
}

.co-cart__cta {
  width: 100%;
  justify-content: center;
  padding: 11px;
  font-size: 14px;
}

.co-cart__trust {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 12px 0 0;
  list-style: none;
  border-top: 0.5px solid var(--app-border);
}

.co-cart__trust li {
  position: relative;
  padding-left: 18px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.co-cart__trust li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 4px;
  width: 8px;
  height: 4px;
  border-left: 1.5px solid var(--co-accent);
  border-bottom: 1.5px solid var(--co-accent);
  transform: rotate(-45deg);
}

@media (max-width: 1280px) {
  .co-layout {
    grid-template-columns: 1fr;
  }

  .co-cart {
    position: static;
  }
}

@media (max-width: 760px) {
  .co-progress__text small {
    display: none;
  }

  .co-fields--ssh,
  .co-flow {
    grid-template-columns: 1fr;
  }

  .co-origin {
    grid-template-columns: 90px minmax(0, 1fr) 32px;
  }

  .co-origin__num {
    display: none;
  }

  .co-origin__err {
    grid-column: 2 / 3;
  }

  .co-review__row {
    grid-template-columns: 1fr;
  }
}
</style>
