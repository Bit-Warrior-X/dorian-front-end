<template>
  <div class="l4-panel">
    <div class="l4-list">
      <button
        v-for="item in l4Items"
        :key="item.id"
        type="button"
        class="l4-item"
        :class="{ active: activeL4Item === item.id }"
        @click="activeL4Item = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="l4-settings">
      <div class="l4-settings-header">
        <h4>{{ activeL4Data.label }}</h4>
        <span v-if="!isSynFloodActive" class="value-pill" :class="{ on: activeL4Data.enabled }">
          {{ activeL4Data.enabled ? "Enabled" : "Disabled" }}
        </span>
      </div>
      <div v-if="isSynFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="synForm.enabled"
          @click="synForm.enabled = !synForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !synForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: synForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="syn-threshold">Threshold</label>
                <input
                  id="syn-threshold"
                  v-model="synForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="syn-burst-pkt">Burst Pkt</label>
                <input
                  id="syn-burst-pkt"
                  v-model="synForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="syn-burst-counter">Burst Counter</label>
                <input
                  id="syn-burst-counter"
                  v-model="synForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="syn-fixed-duration">Fixed Duration</label>
                <input
                  id="syn-fixed-duration"
                  v-model="synForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="syn-fixed-threshold">Fixed Threshold</label>
                <input
                  id="syn-fixed-threshold"
                  v-model="synForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="syn-challenge-timeout">Challenge Timeout</label>
                <input
                  id="syn-challenge-timeout"
                  v-model="synForm.challengeTimeout"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="syn-block-duration">Block Duration</label>
                <input
                  id="syn-block-duration"
                  v-model="synForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!synForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmSynSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isAckFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="ackForm.enabled"
          @click="ackForm.enabled = !ackForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !ackForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: ackForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="ack-threshold">Threshold</label>
                <input
                  id="ack-threshold"
                  v-model="ackForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="ack-burst-pkt">Burst Pkt</label>
                <input
                  id="ack-burst-pkt"
                  v-model="ackForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="ack-burst-counter">Burst Counter</label>
                <input
                  id="ack-burst-counter"
                  v-model="ackForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="ack-fixed-duration">Fixed Duration</label>
                <input
                  id="ack-fixed-duration"
                  v-model="ackForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="ack-fixed-threshold">Fixed Threshold</label>
                <input
                  id="ack-fixed-threshold"
                  v-model="ackForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="ack-block-duration">Block Duration</label>
                <input
                  id="ack-block-duration"
                  v-model="ackForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!ackForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmAckSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isRstFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="rstForm.enabled"
          @click="rstForm.enabled = !rstForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !rstForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: rstForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="rst-threshold">Threshold</label>
                <input
                  id="rst-threshold"
                  v-model="rstForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="rst-burst-pkt">Burst Pkt</label>
                <input
                  id="rst-burst-pkt"
                  v-model="rstForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="rst-burst-counter">Burst Counter</label>
                <input
                  id="rst-burst-counter"
                  v-model="rstForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="rst-fixed-duration">Fixed Duration</label>
                <input
                  id="rst-fixed-duration"
                  v-model="rstForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="rst-fixed-threshold">Fixed Threshold</label>
                <input
                  id="rst-fixed-threshold"
                  v-model="rstForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="rst-block-duration">Block Duration</label>
                <input
                  id="rst-block-duration"
                  v-model="rstForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!rstForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmRstSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isIcmpFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="icmpForm.enabled"
          @click="icmpForm.enabled = !icmpForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !icmpForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: icmpForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="icmp-threshold">Threshold</label>
                <input
                  id="icmp-threshold"
                  v-model="icmpForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="icmp-burst-pkt">Burst Pkt</label>
                <input
                  id="icmp-burst-pkt"
                  v-model="icmpForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="icmp-burst-counter">Burst Counter</label>
                <input
                  id="icmp-burst-counter"
                  v-model="icmpForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="icmp-fixed-duration">Fixed Duration</label>
                <input
                  id="icmp-fixed-duration"
                  v-model="icmpForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="icmp-fixed-threshold">Fixed Threshold</label>
                <input
                  id="icmp-fixed-threshold"
                  v-model="icmpForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="icmp-block-duration">Block Duration</label>
                <input
                  id="icmp-block-duration"
                  v-model="icmpForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!icmpForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmIcmpSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isUdpFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="udpForm.enabled"
          @click="udpForm.enabled = !udpForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !udpForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: udpForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="udp-threshold">Threshold</label>
                <input
                  id="udp-threshold"
                  v-model="udpForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="udp-burst-pkt">Burst Pkt</label>
                <input
                  id="udp-burst-pkt"
                  v-model="udpForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="udp-burst-counter">Burst Counter</label>
                <input
                  id="udp-burst-counter"
                  v-model="udpForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="udp-fixed-duration">Fixed Duration</label>
                <input
                  id="udp-fixed-duration"
                  v-model="udpForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="udp-fixed-threshold">Fixed Threshold</label>
                <input
                  id="udp-fixed-threshold"
                  v-model="udpForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="udp-block-duration">Block Duration</label>
                <input
                  id="udp-block-duration"
                  v-model="udpForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!udpForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmUdpSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isGreFloodActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="greForm.enabled"
          @click="greForm.enabled = !greForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !greForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: greForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="gre-threshold">Threshold</label>
                <input
                  id="gre-threshold"
                  v-model="greForm.threshold"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="gre-burst-pkt">Burst Pkt</label>
                <input
                  id="gre-burst-pkt"
                  v-model="greForm.burstPkt"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="gre-burst-counter">Burst Counter</label>
                <input
                  id="gre-burst-counter"
                  v-model="greForm.burstCounter"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="gre-fixed-duration">Fixed Duration</label>
                <input
                  id="gre-fixed-duration"
                  v-model="greForm.fixedDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
              <div class="l4-field">
                <label for="gre-fixed-threshold">Fixed Threshold</label>
                <input
                  id="gre-fixed-threshold"
                  v-model="greForm.fixedThreshold"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="gre-block-duration">Block Duration</label>
                <input
                  id="gre-block-duration"
                  v-model="greForm.blockDuration"
                  type="text"
                  class="l4-input"
                  :disabled="!greForm.enabled"
                />
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmGreSettings">
          Confirm Settings
        </button>
      </div>
      <div v-else-if="isTcpDetailedConfigActive" class="l4-form">
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-section-header">
              <h5>TCP Connection Limit</h5>
              <button
                type="button"
                class="l4-toggle"
                role="switch"
                :aria-checked="tcpDetailedForm.connectionLimitEnabled"
                @click="tcpDetailedForm.connectionLimitEnabled = !tcpDetailedForm.connectionLimitEnabled"
              >
                <span class="toggle-track" :class="{ off: !tcpDetailedForm.connectionLimitEnabled }">
                  <span class="toggle-label on">Enable</span>
                  <span class="toggle-label off">Disable</span>
                  <span class="toggle-knob" :class="{ on: tcpDetailedForm.connectionLimitEnabled }"></span>
                </span>
              </button>
            </div>
            <div class="l4-form-grid">
              <div class="l4-field">
                <label for="tcp-connection-limit">Connection Limit Count</label>
                <input
                  id="tcp-connection-limit"
                  v-model="tcpDetailedForm.connectionLimit"
                  type="number"
                  min="0"
                  class="l4-input"
                  :disabled="!tcpDetailedForm.connectionLimitEnabled"
                />
              </div>
            </div>
          </div>
          <div class="l4-section">
            <h5>TCP Segmentation Check</h5>
            <button
              type="button"
              class="l4-toggle"
              role="switch"
              :aria-checked="tcpDetailedForm.segmentationCheck"
              @click="tcpDetailedForm.segmentationCheck = !tcpDetailedForm.segmentationCheck"
            >
              <span class="toggle-track" :class="{ off: !tcpDetailedForm.segmentationCheck }">
                <span class="toggle-label on">Enable</span>
                <span class="toggle-label off">Disable</span>
                <span class="toggle-knob" :class="{ on: tcpDetailedForm.segmentationCheck }"></span>
              </span>
            </button>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmTcpDetailedSettings">
          Confirm Settings
        </button>
        <div class="l4-description tcp-detailed-description">
          <p>
            TCP Detailed Config focuses on connection integrity rather than volumetric thresholds.
            Use the connection limit to cap concurrent sessions per source and reduce resource
            exhaustion attacks. Enable segmentation checks to detect malformed or abusive TCP segment
            patterns that often appear in evasion attempts.
          </p>
          <p>
            For most environments, start with conservative limits and enable segmentation checks,
            then tune upward after observing normal traffic patterns.
          </p>
        </div>
      </div>
      <div v-else-if="isGeoIpCheckActive" class="l4-form">
        <button
          type="button"
          class="l4-toggle"
          role="switch"
          :aria-checked="geoIpForm.enabled"
          @click="geoIpForm.enabled = !geoIpForm.enabled"
        >
          <span class="toggle-track" :class="{ off: !geoIpForm.enabled }">
            <span class="toggle-label on">Enable</span>
            <span class="toggle-label off">Disable</span>
            <span class="toggle-knob" :class="{ on: geoIpForm.enabled }"></span>
          </span>
        </button>
        <div class="l4-form-sections">
          <div class="l4-section">
            <div class="l4-section-header">
              <h5>Allowed Countries</h5>
              <span class="selection-count">{{ geoIpForm.selectedCountries.length }} selected</span>
            </div>
            <div v-if="geoIpForm.selectedCountries.length" class="selected-countries">
              <span
                v-for="country in geoIpForm.selectedCountries"
                :key="country"
                class="country-chip"
              >
                {{ country }}
              </span>
            </div>
            <div class="continent-tabs">
              <button
                v-for="continent in geoIpForm.continents"
                :key="continent"
                type="button"
                class="continent-btn"
                :class="{ active: geoIpForm.activeContinent === continent }"
                :disabled="!geoIpForm.enabled"
                @click="geoIpForm.activeContinent = continent"
              >
                {{ continent }}
              </button>
            </div>
            <div class="country-grid">
              <label
                v-for="country in filteredGeoCountries"
                :key="country"
                class="country-option"
              >
                <input
                  type="checkbox"
                  :value="country"
                  v-model="geoIpForm.selectedCountries"
                  :disabled="!geoIpForm.enabled"
                />
                <span>{{ country }}</span>
              </label>
            </div>
          </div>
        </div>
        <button type="button" class="confirm-btn" @click="confirmGeoIpSettings">
          Confirm Settings
        </button>
        <div class="l4-description tcp-detailed-description">
          <p>
            Geo IP Check adds a location-aware layer to DDoS defense. When enabled, traffic is
            evaluated by source region and can be filtered based on your approved countries.
          </p>
          <p>
            Select the countries that should be allowed to reach the service. Disable the feature
            to accept traffic globally.
          </p>
        </div>
      </div>
      <div v-else class="l4-settings-grid">
        <div class="l4-setting">
          <span class="l4-setting-label">Sensitivity</span>
          <span class="l4-setting-value">{{ activeL4Data.sensitivity }}</span>
        </div>
        <div class="l4-setting">
          <span class="l4-setting-label">Threshold</span>
          <span class="l4-setting-value">{{ activeL4Data.threshold }}</span>
        </div>
        <div class="l4-setting">
          <span class="l4-setting-label">Action</span>
          <span class="l4-setting-value">{{ activeL4Data.action }}</span>
        </div>
        <div class="l4-setting">
          <span class="l4-setting-label">Notes</span>
          <span class="l4-setting-value">{{ activeL4Data.note }}</span>
        </div>
      </div>
      <div v-if="!isTcpDetailedConfigActive && !isGeoIpCheckActive" class="l4-description">
        <p>
          DDoS detection runs on a 1-second sampling window. When traffic exceeds the configured
          threshold, protection mode activates and evaluates burst and fixed rules. If traffic
          stays below the threshold, protection mode exits and rule checks stop.
        </p>
        <p>
          Blacklisted IPs are automatically removed after the configured expiry (for example,
          <code>black_ip_duration = 3600s</code>).
        </p>
        <div class="l4-description-group">
          <h5>Burst Mode &amp; Fixed Mode</h5>
          <ul>
            <li>
              <strong>Burst Mode:</strong> Captures short spikes (bursts per second). If a source
              exceeds the burst limits, it is added to the blacklist.
              <span class="example-text">Example: 10 bursts/sec and 20 bursts within 1s → blacklist.</span>
            </li>
            <li>
              <strong>Fixed Mode:</strong> Captures sustained traffic over a fixed window. If the
              packet count exceeds the fixed threshold, the source is blacklisted.
              <span class="example-text">Example: 2,000 packets within 15s → blacklist.</span>
            </li>
          </ul>
        </div>
        <div v-if="activeL4Item === 'syn-flood'" class="l4-description-group">
          <h5>SYN Flood Extra Logic</h5>
          <ul>
            <li>Discard the first SYN.</li>
            <li>On the next SYN, send an invalid SYN+ACK.</li>
            <li>If a third SYN arrives, allow it to pass.</li>
          </ul>
        </div>
        <div v-else-if="activeL4Item === 'ack-flood'" class="l4-description-group">
          <h5>ACK Flood Extra Logic</h5>
          <ul>
            <li>
              Burst checks apply only to ACK-only packets (excluding SYN, FIN, RST) with connection
              state new, invalid, or untracked.
            </li>
            <li>Targets ACK traffic that is not part of a completed TCP handshake.</li>
          </ul>
        </div>
        <div v-else-if="activeL4Item === 'rst-flood'" class="l4-description-group">
          <h5>RST Flood Rules</h5>
          <ul>
            <li>
              <strong>Burst Mode:</strong> 10 RST bursts/sec, 20 RST bursts → blacklist the source.
            </li>
            <li>
              <strong>Fixed Mode:</strong> 2,000+ RST packets within 15s → blacklist the source.
            </li>
          </ul>
        </div>
        <div v-else-if="activeL4Item === 'tcp-detailed-config'" class="l4-description-group">
          <h5>TCP Detailed Config</h5>
          <ul>
            <li>
              <strong>Connection limit:</strong> Caps concurrent TCP connections per source to
              prevent exhaustion attacks.
            </li>
            <li>
              <strong>Segmentation check:</strong> Validates TCP segment patterns to detect malformed
              or abusive traffic.
            </li>
          </ul>
        </div>
        <div v-else class="l4-description-group">
          <h5>General Logic</h5>
          <p>Applies consistently to SYN, ACK, RST, ICMP, UDP, and GRE flood defenses.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const l4Items = [
  { id: "syn-flood", label: "TCP SYN Flood" },
  { id: "ack-flood", label: "TCP ACK Flood" },
  { id: "rst-flood", label: "TCP RST Flood" },
  { id: "icmp-flood", label: "ICMP Flood" },
  { id: "udp-flood", label: "UDP Flood" },
  { id: "gre-flood", label: "GRE Flood" },
  { id: "tcp-detailed-config", label: "TCP Detailed Config" },
  { id: "geo-ip-check", label: "Geo IP Check" }
];

const activeL4Item = ref(l4Items[0].id);
const synForm = ref({
  enabled: true,
  threshold: "8k pps",
  burstPkt: "120",
  burstCounter: "5",
  fixedThreshold: "6k pps",
  fixedDuration: "30s",
  challengeTimeout: "10s",
  blockDuration: "3600s"
});
const ackForm = ref({
  enabled: true,
  threshold: "6k pps",
  burstPkt: "100",
  burstCounter: "5",
  fixedThreshold: "4k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const rstForm = ref({
  enabled: true,
  threshold: "5k pps",
  burstPkt: "90",
  burstCounter: "5",
  fixedThreshold: "4k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const icmpForm = ref({
  enabled: true,
  threshold: "3k pps",
  burstPkt: "80",
  burstCounter: "5",
  fixedThreshold: "2k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const udpForm = ref({
  enabled: true,
  threshold: "10k pps",
  burstPkt: "140",
  burstCounter: "5",
  fixedThreshold: "8k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const greForm = ref({
  enabled: false,
  threshold: "4k pps",
  burstPkt: "80",
  burstCounter: "5",
  fixedThreshold: "3k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const tcpDetailedForm = ref({
  connectionLimitEnabled: true,
  connectionLimit: 2000,
  segmentationCheck: true
});
const geoIpForm = ref({
  enabled: true,
  selectedCountries: ["United States", "Canada", "United Kingdom"],
  activeContinent: "North America",
  continents: [
    "Africa",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America"
  ],
  countriesByContinent: {
    Africa: [
      "Algeria",
      "Angola",
      "Benin",
      "Botswana",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cameroon",
      "Central African Republic",
      "Chad",
      "Comoros",
      "Congo (Republic of the)",
      "Congo (Democratic Republic of the)",
      "Cote d'Ivoire",
      "Djibouti",
      "Egypt",
      "Equatorial Guinea",
      "Eritrea",
      "Eswatini",
      "Ethiopia",
      "Gabon",
      "Gambia",
      "Ghana",
      "Guinea",
      "Guinea-Bissau",
      "Kenya",
      "Lesotho",
      "Liberia",
      "Libya",
      "Madagascar",
      "Malawi",
      "Mali",
      "Mauritania",
      "Mauritius",
      "Morocco",
      "Mozambique",
      "Namibia",
      "Niger",
      "Nigeria",
      "Rwanda",
      "Sao Tome and Principe",
      "Senegal",
      "Seychelles",
      "Sierra Leone",
      "Somalia",
      "South Africa",
      "South Sudan",
      "Sudan",
      "Tanzania",
      "Togo",
      "Tunisia",
      "Uganda",
      "Zambia",
      "Zimbabwe"
    ],
    Asia: [
      "Afghanistan",
      "Armenia",
      "Azerbaijan",
      "Bahrain",
      "Bangladesh",
      "Bhutan",
      "Brunei",
      "Cambodia",
      "China",
      "Cyprus",
      "Georgia",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Israel",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Lebanon",
      "Malaysia",
      "Maldives",
      "Mongolia",
      "Myanmar",
      "Nepal",
      "North Korea",
      "Oman",
      "Pakistan",
      "Palestine",
      "Philippines",
      "Qatar",
      "Saudi Arabia",
      "Singapore",
      "South Korea",
      "Sri Lanka",
      "Syria",
      "Taiwan",
      "Tajikistan",
      "Thailand",
      "Timor-Leste",
      "Turkey",
      "Turkmenistan",
      "United Arab Emirates",
      "Uzbekistan",
      "Vietnam",
      "Yemen"
    ],
    Europe: [
      "Albania",
      "Andorra",
      "Austria",
      "Belarus",
      "Belgium",
      "Bosnia and Herzegovina",
      "Bulgaria",
      "Croatia",
      "Czechia",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Iceland",
      "Ireland",
      "Italy",
      "Kosovo",
      "Latvia",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Moldova",
      "Monaco",
      "Montenegro",
      "Netherlands",
      "North Macedonia",
      "Norway",
      "Poland",
      "Portugal",
      "Romania",
      "Russia",
      "San Marino",
      "Serbia",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "Switzerland",
      "Ukraine",
      "United Kingdom",
      "Vatican City"
    ],
    "North America": [
      "Antigua and Barbuda",
      "Bahamas",
      "Barbados",
      "Belize",
      "Canada",
      "Costa Rica",
      "Cuba",
      "Dominica",
      "Dominican Republic",
      "El Salvador",
      "Grenada",
      "Guatemala",
      "Haiti",
      "Honduras",
      "Jamaica",
      "Mexico",
      "Nicaragua",
      "Panama",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Trinidad and Tobago",
      "United States"
    ],
    Oceania: [
      "Australia",
      "Fiji",
      "Kiribati",
      "Marshall Islands",
      "Micronesia",
      "Nauru",
      "New Zealand",
      "Palau",
      "Papua New Guinea",
      "Samoa",
      "Solomon Islands",
      "Tonga",
      "Tuvalu",
      "Vanuatu"
    ],
    "South America": [
      "Argentina",
      "Bolivia",
      "Brazil",
      "Chile",
      "Colombia",
      "Ecuador",
      "Guyana",
      "Paraguay",
      "Peru",
      "Suriname",
      "Uruguay",
      "Venezuela"
    ]
  }
});

const l4Settings = {
  "syn-flood": {
    label: "TCP SYN Flood",
    enabled: true,
    sensitivity: "High",
    threshold: "8k pps",
    action: "Challenge",
    note: "Auto-mitigate SYN spikes."
  },
  "ack-flood": {
    label: "TCP ACK Flood",
    enabled: true,
    sensitivity: "Medium",
    threshold: "6k pps",
    action: "Drop",
    note: "Blocks abnormal ACK bursts."
  },
  "rst-flood": {
    label: "TCP RST Flood",
    enabled: true,
    sensitivity: "Medium",
    threshold: "5k pps",
    action: "Drop",
    note: "Protects against reset storms."
  },
  "icmp-flood": {
    label: "ICMP Flood",
    enabled: true,
    sensitivity: "Low",
    threshold: "3k pps",
    action: "Rate limit",
    note: "Limits ICMP echo traffic."
  },
  "udp-flood": {
    label: "UDP Flood",
    enabled: true,
    sensitivity: "High",
    threshold: "10k pps",
    action: "Drop",
    note: "Blocks volumetric UDP bursts."
  },
  "gre-flood": {
    label: "GRE Flood",
    enabled: false,
    sensitivity: "Medium",
    threshold: "4k pps",
    action: "Drop",
    note: "Enable if GRE is in use."
  },
  "tcp-detailed-config": {
    label: "TCP Detailed Config",
    enabled: true,
    sensitivity: "Medium",
    threshold: "2k pps",
    action: "Segment check + connection limit",
    note: "Configure TCP segment validation and connection cap behavior."
  },
  "geo-ip-check": {
    label: "Geo IP Check",
    enabled: true,
    sensitivity: "Low",
    threshold: "Restricted regions",
    action: "Block",
    note: "Blocks traffic from restricted zones."
  }
};

const activeL4Data = computed(() => l4Settings[activeL4Item.value] || l4Settings["syn-flood"]);
const isSynFloodActive = computed(() => activeL4Item.value === "syn-flood");
const isAckFloodActive = computed(() => activeL4Item.value === "ack-flood");
const isRstFloodActive = computed(() => activeL4Item.value === "rst-flood");
const isIcmpFloodActive = computed(() => activeL4Item.value === "icmp-flood");
const isUdpFloodActive = computed(() => activeL4Item.value === "udp-flood");
const isGreFloodActive = computed(() => activeL4Item.value === "gre-flood");
const isTcpDetailedConfigActive = computed(() => activeL4Item.value === "tcp-detailed-config");
const isGeoIpCheckActive = computed(() => activeL4Item.value === "geo-ip-check");

const filteredGeoCountries = computed(() => {
  const baseList =
    geoIpForm.value.countriesByContinent[geoIpForm.value.activeContinent] || [];
  return baseList;
});

const confirmSynSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmAckSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmRstSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmIcmpSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmUdpSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmGreSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmTcpDetailedSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
const confirmGeoIpSettings = () => {
  // Placeholder: wire up API call or store update when available.
};
</script>

<style scoped>
.l4-panel {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  min-height: 260px;
}

.l4-list {
  border-right: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.9);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 6px;
}

.l4-item {
  border: 1px solid transparent;
  background: transparent;
  color: #334155;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.l4-item:hover {
  background: rgba(226, 232, 240, 0.6);
}

.l4-item.active {
  background: #fff;
  border-color: rgba(99, 102, 241, 0.3);
  color: #1d4ed8;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
}

.l4-settings {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
}

.l4-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.l4-settings-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.l4-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.l4-form-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.l4-section {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.6);
}

.l4-section h5 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.l4-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.l4-section-header h5 {
  margin: 0;
}

.selection-count {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.selected-countries {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.country-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 600;
}

.continent-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.continent-btn {
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #fff;
  color: #475569;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continent-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  color: #1d4ed8;
}

.continent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.country-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.country-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.7);
  font-size: 0.9rem;
  color: #1f2937;
}

.country-option input {
  width: 16px;
  height: 16px;
}

.l4-section-desc {
  margin: -4px 0 12px 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

.l4-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.l4-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.l4-field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.l4-input {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  color: #1f2937;
  background: #fff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.l4-input:focus {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.l4-input:disabled {
  background: rgba(226, 232, 240, 0.5);
  color: #94a3b8;
  cursor: not-allowed;
}

.l4-toggle {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.toggle-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  width: 148px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
  padding: 0 8px;
  overflow: hidden;
}

.toggle-track.off {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toggle-label {
  z-index: 2;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  white-space: nowrap;
  text-transform: uppercase;
}

.toggle-label.off {
  color: rgba(255, 255, 255, 0.7);
}

.toggle-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 68px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease;
  z-index: 1;
}

.toggle-knob.on {
  transform: translateX(72px);
}

.confirm-btn {
  align-self: flex-start;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.confirm-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.3);
}

.l4-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.l4-description {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed rgba(148, 163, 184, 0.5);
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
}

.l4-description p {
  margin: 0 0 10px 0;
}

.l4-description code {
  font-family: "SFMono-Regular", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
  background: rgba(148, 163, 184, 0.18);
  padding: 2px 6px;
  border-radius: 6px;
}

.l4-description-group h5 {
  margin: 6px 0 8px 0;
  font-size: 0.95rem;
  color: #1f2937;
}

.l4-description-group ul {
  margin: 0;
  padding-left: 18px;
}

.l4-description-group li {
  margin-bottom: 6px;
}

.example-text {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 0.88rem;
}

.l4-setting {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.7);
}

.l4-setting-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}

.l4-setting-value {
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 600;
}

.value-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  background: rgba(148, 163, 184, 0.18);
}

.value-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
}
</style>
