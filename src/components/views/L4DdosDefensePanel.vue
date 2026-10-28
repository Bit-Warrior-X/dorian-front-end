<template>
  <div class="l4-panel edge-subpanel">
    <div class="l4-settings">
      <header class="cfg-head">
        <div class="cfg-head__copy">
          <span class="cfg-head__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M13 7.5l-3 5h4l-3 5" /></svg>
          </span>
          <div>
            <p class="cfg-head__kicker">L4 defense</p>
            <h4 class="info-hint-heading">
              <span>XDP config</span>
              <InfoHint
                text="Sparta detects Attack with adaptive shadow statistics (EWMA / CUSUM), not fixed host-wide flood thresholds.
Detection Level (1–10) sets how quickly those signals raise Attack. Alert Hold delays episode START so short spikes do not flap.
While under Attack, per-class burst and fixed limits mitigate floods, and blocked sources use Block Initial TTL that can double up to Block Max TTL.
NULL and XMAS scans are dropped immediately; other unusual TCP flags use the SOCKET limits."
                aria-label="XDP config help"
              />
            </h4>
            <p class="cfg-head__desc">Tune how Sparta attaches to the NIC and reacts under Attack. Changes apply when you confirm.</p>
          </div>
        </div>
      </header>
      <div class="l4-settings-body">
        <div class="l4-config">
          <div class="l4-config-row l4-config-row--global-tcp">
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>Global config</h5>
              </div>
              <div class="l4-form">
                <div class="l4-form-sections">
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="global-protection-mode" class="info-hint-heading">
                          Protection Mode
                          <InfoHint
                            text="Always On applies mitigation when Sparta is in Attack. Monitor watches and can raise alerts with lighter enforcement. Use Always On on production edges."
                            aria-label="Protection Mode help"
                          />
                        </label>
                        <select
                          id="global-protection-mode"
                          v-model="globalForm.protectionMode"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        >
                          <option value="Always On">Always On</option>
                          <option value="Monitor">Monitor</option>
                        </select>
                      </div>
                      <div class="l4-field">
                        <label for="global-detection-level" class="info-hint-heading">
                          Detection Level
                          <InfoHint
                            text="Main detection knob (1–10). Lower values tolerate more traffic variance before Attack; higher values enter Attack sooner.
1 Minimal · 5 Normal (default) · 10 Max."
                            aria-label="Detection Level help"
                          />
                        </label>
                        <select
                          id="global-detection-level"
                          v-model.number="globalForm.detectionLevel"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        >
                          <option
                            v-for="opt in detectionLevelOptions"
                            :key="opt.value"
                            :value="opt.value"
                          >
                            {{ opt.value }} — {{ opt.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="global-eth-interface" class="info-hint-heading">
                          Eth Interface
                          <InfoHint
                            text="NIC or bond the XDP program attaches to (for example eth0 or bond0).
Changing the interface usually restarts the edge firewall."
                            aria-label="Eth Interface help"
                          />
                        </label>
                        <select
                          id="global-eth-interface"
                          v-model="globalForm.ethInterface"
                          class="l4-input"
                          :disabled="!globalForm.enabled || l4OptionsLoading || l4Options.interfaces.length === 0"
                        >
                          <option v-if="l4Options.interfaces.length === 0" value="" disabled>
                            No interfaces available
                          </option>
                          <option
                            v-for="iface in l4Options.interfaces"
                            :key="iface"
                            :value="iface"
                          >
                            {{ iface }}
                          </option>
                        </select>
                      </div>
                      <div class="l4-field">
                        <label for="global-attach-mode" class="info-hint-heading">
                          Attach Mode
                          <InfoHint
                            text="How XDP/eBPF hooks the NIC: native (driver path), skb/generic (broader compatibility), or other modes the NIC reports.
Pick a mode listed for the selected interface."
                            aria-label="Attach Mode help"
                          />
                        </label>
                        <select
                          id="global-attach-mode"
                          v-model="globalForm.attachMode"
                          class="l4-input"
                          :disabled="!globalForm.enabled || l4OptionsLoading || availableAttachModes.length === 0"
                        >
                          <option v-if="availableAttachModes.length === 0" value="" disabled>
                            No attach modes available
                          </option>
                          <option
                            v-for="mode in availableAttachModes"
                            :key="mode"
                            :value="mode"
                          >
                            {{ mode }}
                          </option>
                        </select>
                      </div>
                      <div class="l4-field">
                        <label for="global-block-initial" class="info-hint-heading">
                          Block Initial TTL (s)
                          <InfoHint
                            text="First block length in seconds after a source is blacklisted (suggested 60–600).
Repeat offenses can double this duration up to Block Max TTL."
                            aria-label="Block Initial TTL help"
                          />
                        </label>
                        <input
                          id="global-block-initial"
                          v-model="globalForm.blockInitialSeconds"
                          type="number"
                          min="60"
                          max="600"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        />
                      </div>
                      <div class="l4-field">
                        <label for="global-block-max" class="info-hint-heading">
                          Block Max TTL (s)
                          <InfoHint
                            text="Maximum escalating block length in seconds (suggested ≤ 7200).
Must be greater than or equal to Block Initial TTL."
                            aria-label="Block Max TTL help"
                          />
                        </label>
                        <input
                          id="global-block-max"
                          v-model="globalForm.blockMaxSeconds"
                          type="number"
                          min="60"
                          max="7200"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        />
                      </div>
                      <div class="l4-field">
                        <label for="global-alert-hold" class="info-hint-heading">
                          Alert Hold (s)
                          <InfoHint
                            text="Seconds the Attack condition must stay true before panel/episode START is raised.
Dampens short spikes. Recommended range 3–10."
                            aria-label="Alert Hold help"
                          />
                        </label>
                        <input
                          id="global-alert-hold"
                          v-model="globalForm.alertHoldWindows"
                          type="number"
                          min="1"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field l4-inline-toggle">
                        <h5 class="info-hint-heading">
                          <span>HTTP/3</span>
                          <InfoHint
                            text="Service profile: treat HTTP/3 (QUIC) as expected legitimate traffic so adaptive baselines are less likely to treat it as Attack noise."
                            aria-label="HTTP/3 help"
                          />
                        </h5>
                        <div class="l4-yn" role="group" aria-label="HTTP/3">
                          <button type="button" class="l4-yn__opt" :class="{ active: globalForm.serviceHttp3 }" :aria-pressed="globalForm.serviceHttp3" :disabled="!globalForm.enabled" @click="globalForm.serviceHttp3 = true">Yes</button>
                          <button type="button" class="l4-yn__opt l4-yn__opt--no" :class="{ active: !globalForm.serviceHttp3 }" :aria-pressed="!globalForm.serviceHttp3" :disabled="!globalForm.enabled" @click="globalForm.serviceHttp3 = false">No</button>
                        </div>
                      </div>
                      <div class="l4-field l4-inline-toggle">
                        <h5 class="info-hint-heading">
                          <span>DNS</span>
                          <InfoHint
                            text="Service profile: treat DNS traffic patterns as expected on this edge."
                            aria-label="DNS help"
                          />
                        </h5>
                        <div class="l4-yn" role="group" aria-label="DNS">
                          <button type="button" class="l4-yn__opt" :class="{ active: globalForm.serviceDns }" :aria-pressed="globalForm.serviceDns" :disabled="!globalForm.enabled" @click="globalForm.serviceDns = true">Yes</button>
                          <button type="button" class="l4-yn__opt l4-yn__opt--no" :class="{ active: !globalForm.serviceDns }" :aria-pressed="!globalForm.serviceDns" :disabled="!globalForm.enabled" @click="globalForm.serviceDns = false">No</button>
                        </div>
                      </div>
                      <div class="l4-field l4-inline-toggle">
                        <h5 class="info-hint-heading">
                          <span>GRE Tunnels</span>
                          <InfoHint
                            text="Service profile: treat GRE tunnel traffic as expected on this edge."
                            aria-label="GRE Tunnels help"
                          />
                        </h5>
                        <div class="l4-yn" role="group" aria-label="GRE tunnels">
                          <button type="button" class="l4-yn__opt" :class="{ active: globalForm.serviceGreTunnels }" :aria-pressed="globalForm.serviceGreTunnels" :disabled="!globalForm.enabled" @click="globalForm.serviceGreTunnels = true">Yes</button>
                          <button type="button" class="l4-yn__opt l4-yn__opt--no" :class="{ active: !globalForm.serviceGreTunnels }" :aria-pressed="!globalForm.serviceGreTunnels" :disabled="!globalForm.enabled" @click="globalForm.serviceGreTunnels = false">No</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>TCP detailed config</h5>
              </div>
              <div class="l4-form">
                <div class="l4-form-sections">
                  <div class="l4-section">
                    <div class="l4-section-header">
                      <h5>TCP Connection Limit</h5>
                      <div class="l4-yn" role="group" aria-label="Enable">
                          <button
                            type="button"
                            class="l4-yn__opt"
                            :class="{ active: tcpDetailedForm.connectionLimitEnabled }"
                            :aria-pressed="tcpDetailedForm.connectionLimitEnabled"
                            @click="tcpDetailedForm.connectionLimitEnabled = true"
                          >Yes</button>
                          <button
                            type="button"
                            class="l4-yn__opt l4-yn__opt--no"
                            :class="{ active: !tcpDetailedForm.connectionLimitEnabled }"
                            :aria-pressed="!tcpDetailedForm.connectionLimitEnabled"
                            @click="tcpDetailedForm.connectionLimitEnabled = false"
                          >No</button>
                        </div>
                    </div>
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="tcp-connection-limit" class="info-hint-heading">
                          Connection Limit Count
                          <InfoHint
                            text="Maximum concurrent TCP connections allowed from a single source IP when the connection-limit check is enabled.
Helps stop slow connection exhaustion."
                            aria-label="Connection Limit Count help"
                          />
                        </label>
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
                  <div class="l4-section l4-inline-toggle">
                    <h5 class="info-hint-heading">
                          <span>TCP Segmentation Check</span>
                          <InfoHint
                            text="Validates TCP segment patterns to catch malformed or abusive segmentation often used to evade filters."
                            aria-label="TCP Segmentation Check help"
                          />
                        </h5>
                    <div class="l4-yn" role="group" aria-label="Enable">
                        <button
                          type="button"
                          class="l4-yn__opt"
                          :class="{ active: tcpDetailedForm.segmentationCheck }"
                          :aria-pressed="tcpDetailedForm.segmentationCheck"
                          @click="tcpDetailedForm.segmentationCheck = true"
                        >Yes</button>
                        <button
                          type="button"
                          class="l4-yn__opt l4-yn__opt--no"
                          :class="{ active: !tcpDetailedForm.segmentationCheck }"
                          :aria-pressed="!tcpDetailedForm.segmentationCheck"
                          @click="tcpDetailedForm.segmentationCheck = false"
                        >No</button>
                      </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div class="l4-config-row l4-config-row--tcp-floods">
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>SYN — Limits while under Attack</h5>
                <div class="l4-yn" role="group" aria-label="Enable">
                    <button
                      type="button"
                      class="l4-yn__opt"
                      :class="{ active: synForm.enabled }"
                      :aria-pressed="synForm.enabled"
                      @click="synForm.enabled = true"
                    >Yes</button>
                    <button
                      type="button"
                      class="l4-yn__opt l4-yn__opt--no"
                      :class="{ active: !synForm.enabled }"
                      :aria-pressed="!synForm.enabled"
                      @click="synForm.enabled = false"
                    >No</button>
                  </div>
              </div>
              <div class="l4-form">
                <div class="l4-form-sections">
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="syn-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for SYN."
                            aria-label="SYN Burst Pkt help"
                          />
                        </label>
                        <input
                          id="syn-burst-pkt"
                          v-model="synForm.burstPkt"
                          type="text"
                          class="l4-input"
                          :disabled="!synForm.enabled"
                        />
                      </div>
                      <div class="l4-field">
                        <label for="syn-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source IP is blacklisted for SYN abuse."
                            aria-label="SYN Burst Counter help"
                          />
                        </label>
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
                        <label for="syn-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for SYN."
                            aria-label="SYN Fixed Duration help"
                          />
                        </label>
                        <input
                          id="syn-fixed-duration"
                          v-model="synForm.fixedDuration"
                          type="text"
                          class="l4-input"
                          :disabled="!synForm.enabled"
                        />
                      </div>
                      <div class="l4-field">
                        <label for="syn-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for SYN. Excess blacklists the source."
                            aria-label="SYN Fixed Threshold help"
                          />
                        </label>
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
                        <label for="syn-challenge-timeout" class="info-hint-heading">
                          Challenge Timeout
                          <InfoHint
                            text="Seconds allowed for a SYN cookie / challenge handshake to complete.
Incomplete handshakes are dropped after this timeout."
                            aria-label="Challenge Timeout help"
                          />
                        </label>
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
                </div>
              </div>
            </section>
            <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>ACK — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: ackForm.enabled }"
                  :aria-pressed="ackForm.enabled"
                  @click="ackForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !ackForm.enabled }"
                  :aria-pressed="!ackForm.enabled"
                  @click="ackForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="ack-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for ACK."
                            aria-label="ACK Burst Pkt help"
                          />
                        </label>
                    <input
                      id="ack-burst-pkt"
                      v-model="ackForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!ackForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="ack-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for ACK abuse."
                            aria-label="ACK Burst Counter help"
                          />
                        </label>
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
                    <label for="ack-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for ACK."
                            aria-label="ACK Fixed Duration help"
                          />
                        </label>
                    <input
                      id="ack-fixed-duration"
                      v-model="ackForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!ackForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="ack-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for ACK. Excess blacklists the source."
                            aria-label="ACK Fixed Threshold help"
                          />
                        </label>
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
            </div>
          </div>
        </section>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>RST — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: rstForm.enabled }"
                  :aria-pressed="rstForm.enabled"
                  @click="rstForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !rstForm.enabled }"
                  :aria-pressed="!rstForm.enabled"
                  @click="rstForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="rst-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for RST."
                            aria-label="RST Burst Pkt help"
                          />
                        </label>
                    <input
                      id="rst-burst-pkt"
                      v-model="rstForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!rstForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="rst-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for RST abuse."
                            aria-label="RST Burst Counter help"
                          />
                        </label>
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
                    <label for="rst-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for RST."
                            aria-label="RST Fixed Duration help"
                          />
                        </label>
                    <input
                      id="rst-fixed-duration"
                      v-model="rstForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!rstForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="rst-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for RST. Excess blacklists the source."
                            aria-label="RST Fixed Threshold help"
                          />
                        </label>
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
            </div>
          </div>
        </section>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>STOMP — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: stompForm.enabled }"
                  :aria-pressed="stompForm.enabled"
                  @click="stompForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !stompForm.enabled }"
                  :aria-pressed="!stompForm.enabled"
                  @click="stompForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="stomp-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for STOMP (PSH+ACK)."
                            aria-label="STOMP Burst Pkt help"
                          />
                        </label>
                    <input
                      id="stomp-burst-pkt"
                      v-model="stompForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!stompForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="stomp-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for STOMP abuse."
                            aria-label="STOMP Burst Counter help"
                          />
                        </label>
                    <input
                      id="stomp-burst-counter"
                      v-model="stompForm.burstCounter"
                      type="text"
                      class="l4-input"
                      :disabled="!stompForm.enabled"
                    />
                  </div>
                </div>
              </div>
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="stomp-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for STOMP."
                            aria-label="STOMP Fixed Duration help"
                          />
                        </label>
                    <input
                      id="stomp-fixed-duration"
                      v-model="stompForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!stompForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="stomp-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for STOMP. Excess blacklists the source."
                            aria-label="STOMP Fixed Threshold help"
                          />
                        </label>
                    <input
                      id="stomp-fixed-threshold"
                      v-model="stompForm.fixedThreshold"
                      type="text"
                      class="l4-input"
                      :disabled="!stompForm.enabled"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5 class="info-hint-heading">
              <span>SOCKET</span>
              <InfoHint
                text="NULL and XMAS scans are dropped immediately.
FIN without acknowledgement on a non-established flow blocks above the FIN threshold.
Every other unusual flag combination blocks above the fixed threshold in the same window."
                aria-label="SOCKET help"
              />
            </h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: socketForm.enabled }"
                  :aria-pressed="socketForm.enabled"
                  @click="socketForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !socketForm.enabled }"
                  :aria-pressed="!socketForm.enabled"
                  @click="socketForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="socket-fin-threshold" class="info-hint-heading">
                          FIN threshold
                          <InfoHint
                            text="FIN without acknowledgement on a flow that is not established. Sources above this count in the window are blocked.
NULL and XMAS scans are always dropped immediately and do not use this threshold."
                            aria-label="FIN Threshold help"
                          />
                        </label>
                    <input
                      id="socket-fin-threshold"
                      v-model="socketForm.finThreshold"
                      type="text"
                      class="l4-input"
                      :disabled="!socketForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="socket-fixed-threshold" class="info-hint-heading">
                          Fixed threshold
                          <InfoHint
                            text="Every unusual TCP flag combination other than FIN-without-ACK (and excluding NULL/XMAS, which are dropped immediately) blocks when the count in the fixed window exceeds this threshold."
                            aria-label="Socket Fixed Threshold help"
                          />
                        </label>
                    <input
                      id="socket-fixed-threshold"
                      v-model="socketForm.fixedThreshold"
                      type="text"
                      class="l4-input"
                      :disabled="!socketForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="socket-fixed-duration" class="info-hint-heading">
                          Fixed duration
                          <InfoHint
                            text="Window length in seconds used for both the FIN threshold and the fixed threshold for other unusual flag combinations."
                            aria-label="Socket Fixed Duration help"
                          />
                        </label>
                    <input
                      id="socket-fixed-duration"
                      v-model="socketForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!socketForm.enabled"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div class="l4-config-row">
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>ICMP — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: icmpForm.enabled }"
                  :aria-pressed="icmpForm.enabled"
                  @click="icmpForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !icmpForm.enabled }"
                  :aria-pressed="!icmpForm.enabled"
                  @click="icmpForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="icmp-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for ICMP."
                            aria-label="ICMP Burst Pkt help"
                          />
                        </label>
                    <input
                      id="icmp-burst-pkt"
                      v-model="icmpForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!icmpForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="icmp-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for ICMP abuse."
                            aria-label="ICMP Burst Counter help"
                          />
                        </label>
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
                    <label for="icmp-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for ICMP."
                            aria-label="ICMP Fixed Duration help"
                          />
                        </label>
                    <input
                      id="icmp-fixed-duration"
                      v-model="icmpForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!icmpForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="icmp-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for ICMP. Excess blacklists the source."
                            aria-label="ICMP Fixed Threshold help"
                          />
                        </label>
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
            </div>
          </div>
        </section>
        </div>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>UDP — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: udpForm.enabled }"
                  :aria-pressed="udpForm.enabled"
                  @click="udpForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !udpForm.enabled }"
                  :aria-pressed="!udpForm.enabled"
                  @click="udpForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="udp-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for UDP."
                            aria-label="UDP Burst Pkt help"
                          />
                        </label>
                    <input
                      id="udp-burst-pkt"
                      v-model="udpForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!udpForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="udp-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for UDP abuse."
                            aria-label="UDP Burst Counter help"
                          />
                        </label>
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
                    <label for="udp-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for UDP."
                            aria-label="UDP Fixed Duration help"
                          />
                        </label>
                    <input
                      id="udp-fixed-duration"
                      v-model="udpForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!udpForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="udp-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for UDP. Excess blacklists the source."
                            aria-label="UDP Fixed Threshold help"
                          />
                        </label>
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
            </div>
          </div>
        </section>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>GRE — Limits while under Attack</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: greForm.enabled }"
                  :aria-pressed="greForm.enabled"
                  @click="greForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !greForm.enabled }"
                  :aria-pressed="!greForm.enabled"
                  @click="greForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="gre-burst-pkt" class="info-hint-heading">
                          Burst Pkt
                          <InfoHint
                            text="While under Attack: packets allowed in one short burst window before a burst event is counted for GRE."
                            aria-label="GRE Burst Pkt help"
                          />
                        </label>
                    <input
                      id="gre-burst-pkt"
                      v-model="greForm.burstPkt"
                      type="text"
                      class="l4-input"
                      :disabled="!greForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="gre-burst-counter" class="info-hint-heading">
                          Burst Counter
                          <InfoHint
                            text="While under Attack: burst events per second allowed before the source is blacklisted for GRE abuse."
                            aria-label="GRE Burst Counter help"
                          />
                        </label>
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
                    <label for="gre-fixed-duration" class="info-hint-heading">
                          Fixed Duration
                          <InfoHint
                            text="While under Attack: length of the sustained-rate window in seconds for GRE."
                            aria-label="GRE Fixed Duration help"
                          />
                        </label>
                    <input
                      id="gre-fixed-duration"
                      v-model="greForm.fixedDuration"
                      type="text"
                      class="l4-input"
                      :disabled="!greForm.enabled"
                    />
                  </div>
                  <div class="l4-field">
                    <label for="gre-fixed-threshold" class="info-hint-heading">
                          Fixed Threshold
                          <InfoHint
                            text="While under Attack: packet count allowed inside the fixed window for GRE. Excess blacklists the source."
                            aria-label="GRE Fixed Threshold help"
                          />
                        </label>
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
            </div>
          </div>
        </section>
        </div>
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>Geo IP Check</h5>
            <div class="l4-yn" role="group" aria-label="Enable">
                <button
                  type="button"
                  class="l4-yn__opt"
                  :class="{ active: geoIpForm.enabled }"
                  :aria-pressed="geoIpForm.enabled"
                  @click="geoIpForm.enabled = true"
                >Yes</button>
                <button
                  type="button"
                  class="l4-yn__opt l4-yn__opt--no"
                  :class="{ active: !geoIpForm.enabled }"
                  :aria-pressed="!geoIpForm.enabled"
                  @click="geoIpForm.enabled = false"
                >No</button>
              </div>
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid l4-geo-mode-row">
                  <div class="l4-field l4-field--wide">
                    <label for="geo-country-list-mode" class="info-hint-heading">
                          Allowed / blocked countries
                          <InfoHint
                            text="Allowlist: only listed countries may pass when geo check is on.
Blocklist: listed countries are denied; others follow the opposite rule."
                            aria-label="Geo Country Mode help"
                          />
                        </label>
                    <select
                      id="geo-country-list-mode"
                      v-model="geoIpForm.countryListMode"
                      class="l4-input"
                      :disabled="!geoIpForm.enabled"
                    >
                      <option value="allow">Allowed countries</option>
                      <option value="block">Blocked countries</option>
                    </select>
                  </div>
                </div>
                <div class="l4-section-header">
                  <h5>Select countries</h5>
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
          </div>
        </section>
        <footer class="l4-applybar">
          <span class="l4-applybar__copy">
            <i aria-hidden="true" />
            Settings are pushed to Sparta on this edge when applied.
          </span>
          <button type="button" class="primary-btn confirm-btn" @click="confirmGlobalSettings">
            Apply settings
          </button>
        </footer>
        </div>
      </div>
    </div>
    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      title="Apply L4 settings"
      message="Apply L4 defense settings to this server?"
      confirm-text="Apply"
      cancel-text="Cancel"
      @confirm="handleConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { fetchL4Config, fetchL4Options, updateL4Config } from "@/api/l4";
import ConfirmDialog from "../ConfirmDialog.vue";
import InfoHint from "../InfoHint.vue";
import { notifyError, notifySuccess } from "@/utils/notify";

const L4_DDOS_TITLE = "XDP Config";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const isConfirmDialogOpen = ref(false);
let pendingConfirmAction = null;
const l4Options = ref({
  interfaces: [],
  attachModes: [],
  attachModesByInterface: {}
});
const l4OptionsLoading = ref(false);

const availableAttachModes = computed(() => {
  const iface = globalForm.value.ethInterface;
  if (iface && l4Options.value.attachModesByInterface[iface]) {
    return l4Options.value.attachModesByInterface[iface];
  }
  return l4Options.value.attachModes;
});

const detectionLevelOptions = [
  { value: 1, label: "Minimal" },
  { value: 2, label: "Very low" },
  { value: 3, label: "Low" },
  { value: 4, label: "Moderate low" },
  { value: 5, label: "Normal" },
  { value: 6, label: "Moderate high" },
  { value: 7, label: "Elevated" },
  { value: 8, label: "High" },
  { value: 9, label: "Very high" },
  { value: 10, label: "Max" }
];

const sensitivityFromDetectionLevel = (level) => {
  const n = Number(level) || 5;
  if (n <= 3) return "Low";
  if (n <= 6) return "Medium";
  return "High";
};

const detectionLevelFromSensitivity = (value) => {
  switch (String(value || "").toLowerCase()) {
    case "low":
      return 3;
    case "high":
      return 8;
    default:
      return 5;
  }
};

const globalForm = ref({
  enabled: true,
  protectionMode: "Always On",
  detectionLevel: 5,
  alertHoldWindows: 5,
  blockInitialSeconds: 60,
  blockMaxSeconds: 3600,
  serviceHttp3: false,
  serviceDns: false,
  serviceGreTunnels: false,
  ethInterface: "eth0",
  attachMode: "skb"
});
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
const stompForm = ref({
  enabled: true,
  threshold: "5k pps",
  burstPkt: "90",
  burstCounter: "5",
  fixedThreshold: "4k pps",
  fixedDuration: "15s",
  blockDuration: "3600s"
});
const socketForm = ref({
  enabled: true,
  finThreshold: "100",
  fixedThreshold: "500",
  fixedDuration: "15"
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
  countryListMode: "allow",
  selectedCountries: ["United States", "Canada", "United Kingdom"],
  activeContinent: "North America",
  geoDbIpv4Path: "geodb/ipv4.csv",
  geoDbLocationPath: "geodb/location.csv",
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

const filteredGeoCountries = computed(() => {
  const baseList =
    geoIpForm.value.countriesByContinent[geoIpForm.value.activeContinent] || [];
  return baseList;
});

const confirmGlobalSettings = () => {
  openConfirmDialog();
};

const loadConfig = async () => {
  if (!props.serverId) return;
  try {
    const data = await fetchL4Config(props.serverId);
    applyConfig(data);
  } catch {
    // ignore for now
  }
};

const normalizeOptions = (options) => {
  if (!options || typeof options !== "object") {
    return { interfaces: [], attachModes: [], attachModesByInterface: {} };
  }
  const interfaces = Array.isArray(options.interfaces) ? options.interfaces : [];
  const attachModes = Array.isArray(options.attachModes) ? options.attachModes : [];
  const attachModesByInterface =
    options.attachModesByInterface && typeof options.attachModesByInterface === "object"
      ? options.attachModesByInterface
      : {};
  const normalizedByInterface = {};
  Object.entries(attachModesByInterface).forEach(([key, value]) => {
    if (typeof key !== "string" || !Array.isArray(value)) return;
    normalizedByInterface[key] = value.filter(
      (item) => typeof item === "string" && item.trim() !== ""
    );
  });
  return {
    interfaces: interfaces.filter((item) => typeof item === "string" && item.trim() !== ""),
    attachModes: attachModes.filter((item) => typeof item === "string" && item.trim() !== ""),
    attachModesByInterface: normalizedByInterface
  };
};

const syncL4Options = () => {
  if (l4Options.value.interfaces.length > 0) {
    const current = globalForm.value.ethInterface;
    const match = l4Options.value.interfaces.includes(current)
      ? current
      : l4Options.value.interfaces[0];
    globalForm.value.ethInterface = match;
  }
  const modes = availableAttachModes.value;
  if (modes.length > 0) {
    const current = globalForm.value.attachMode;
    const match = modes.includes(current) ? current : modes[0];
    globalForm.value.attachMode = match;
  }
};

const loadOptions = async () => {
  if (!props.serverId) return;
  l4OptionsLoading.value = true;
  try {
    const data = await fetchL4Options(props.serverId);
    l4Options.value = normalizeOptions(data);
    syncL4Options();
  } catch {
    l4Options.value = { interfaces: [], attachModes: [], attachModesByInterface: {} };
    notifyError(L4_DDOS_TITLE, "The L4 interface options could not be loaded.");
  } finally {
    l4OptionsLoading.value = false;
  }
};

const applyConfig = (config) => {
  if (!config) return;
  globalForm.value.ethInterface = config.dev || "eth0";
  globalForm.value.attachMode = config.attachMode || "skb";
  globalForm.value.protectionMode = config.protectionMode || "Always On";
  const detectionLevel =
    Number(config.detectionLevel) > 0
      ? Number(config.detectionLevel)
      : detectionLevelFromSensitivity(config.sensitivity);
  globalForm.value.detectionLevel = Math.min(10, Math.max(1, detectionLevel));
  globalForm.value.alertHoldWindows = Number(config.alertHoldWindows) > 0
    ? Number(config.alertHoldWindows)
    : 5;
  globalForm.value.blockInitialSeconds = Number(config.blockInitialSeconds) > 0
    ? Number(config.blockInitialSeconds)
    : 60;
  globalForm.value.blockMaxSeconds = Number(config.blockMaxSeconds) > 0
    ? Number(config.blockMaxSeconds)
    : Number(config.blackIpDuration) > 0
      ? Number(config.blackIpDuration)
      : 3600;
  globalForm.value.serviceHttp3 = Boolean(config.serviceHttp3);
  globalForm.value.serviceDns = Boolean(config.serviceDns);
  globalForm.value.serviceGreTunnels = Boolean(config.serviceGreTunnels);

  synForm.value.enabled = Boolean(config.synValid);
  synForm.value.threshold = String(config.synThreshold ?? "");
  synForm.value.burstPkt = String(config.synBurstPkt ?? "");
  synForm.value.burstCounter = String(config.synBurstCountPerSec ?? "");
  synForm.value.fixedThreshold = String(config.synFixedThreshold ?? "");
  synForm.value.fixedDuration = String(config.synFixedCheckDuration ?? "");
  synForm.value.challengeTimeout = String(config.challengeTimeout ?? "");
  synForm.value.blockDuration = String(config.synProtectionDuration ?? "");

  ackForm.value.enabled = Boolean(config.ackValid);
  ackForm.value.threshold = String(config.ackThreshold ?? "");
  ackForm.value.burstPkt = String(config.ackBurstPkt ?? "");
  ackForm.value.burstCounter = String(config.ackBurstCountPerSec ?? "");
  ackForm.value.fixedThreshold = String(config.ackFixedThreshold ?? "");
  ackForm.value.fixedDuration = String(config.ackFixedCheckDuration ?? "");
  ackForm.value.blockDuration = String(config.ackProtectionDuration ?? "");

  rstForm.value.enabled = Boolean(config.rstValid);
  rstForm.value.threshold = String(config.rstThreshold ?? "");
  rstForm.value.burstPkt = String(config.rstBurstPkt ?? "");
  rstForm.value.burstCounter = String(config.rstBurstCountPerSec ?? "");
  rstForm.value.fixedThreshold = String(config.rstFixedThreshold ?? "");
  rstForm.value.fixedDuration = String(config.rstFixedCheckDuration ?? "");
  rstForm.value.blockDuration = String(config.rstProtectionDuration ?? "");

  stompForm.value.enabled = Boolean(config.stompValid);
  stompForm.value.threshold = String(config.stompThreshold ?? "");
  stompForm.value.burstPkt = String(config.stompBurstPkt ?? "");
  stompForm.value.burstCounter = String(config.stompBurstCountPerSec ?? "");
  stompForm.value.fixedThreshold = String(config.stompFixedThreshold ?? "");
  stompForm.value.fixedDuration = String(config.stompFixedCheckDuration ?? "");
  stompForm.value.blockDuration = String(
    Number(config.stompProtectionDuration) > 0
      ? config.stompProtectionDuration
      : (config.rstProtectionDuration || 120)
  );

  socketForm.value.enabled = Boolean(config.socketValid);
  socketForm.value.finThreshold = String(config.socketFinThreshold ?? "");
  socketForm.value.fixedThreshold = String(config.socketFixedThreshold ?? "");
  socketForm.value.fixedDuration = String(config.socketFixedCheckDuration ?? "");

  icmpForm.value.enabled = Boolean(config.icmpValid);
  icmpForm.value.threshold = String(config.icmpThreshold ?? "");
  icmpForm.value.burstPkt = String(config.icmpBurstPkt ?? "");
  icmpForm.value.burstCounter = String(config.icmpBurstCountPerSec ?? "");
  icmpForm.value.fixedThreshold = String(config.icmpFixedThreshold ?? "");
  icmpForm.value.fixedDuration = String(config.icmpFixedCheckDuration ?? "");
  icmpForm.value.blockDuration = String(config.icmpProtectionDuration ?? "");

  udpForm.value.enabled = Boolean(config.udpValid);
  udpForm.value.threshold = String(config.udpThreshold ?? "");
  udpForm.value.burstPkt = String(config.udpBurstPkt ?? "");
  udpForm.value.burstCounter = String(config.udpBurstCountPerSec ?? "");
  udpForm.value.fixedThreshold = String(config.udpFixedThreshold ?? "");
  udpForm.value.fixedDuration = String(config.udpFixedCheckDuration ?? "");
  udpForm.value.blockDuration = String(config.udpProtectionDuration ?? "");

  greForm.value.enabled = Boolean(config.greValid);
  greForm.value.threshold = String(config.greThreshold ?? "");
  greForm.value.burstPkt = String(config.greBurstPkt ?? "");
  greForm.value.burstCounter = String(config.greBurstCountPerSec ?? "");
  greForm.value.fixedThreshold = String(config.greFixedThreshold ?? "");
  greForm.value.fixedDuration = String(config.greFixedCheckDuration ?? "");
  greForm.value.blockDuration = String(config.greProtectionDuration ?? "");

  tcpDetailedForm.value.connectionLimitEnabled = Boolean(config.tcpConnectionLimitCheck);
  tcpDetailedForm.value.connectionLimit = config.tcpConnectionLimitCnt ?? 0;
  tcpDetailedForm.value.segmentationCheck = Boolean(config.tcpSegCheck);

  geoIpForm.value.enabled = Boolean(config.geoCheck);
  geoIpForm.value.geoDbIpv4Path = config.geoDbIpv4Path || "geodb/ipv4.csv";
  geoIpForm.value.geoDbLocationPath = config.geoDbLocationPath || "geodb/location.csv";
  geoIpForm.value.selectedCountries = Array.isArray(config.geoAllowCountries)
    ? config.geoAllowCountries
    : [];
  geoIpForm.value.countryListMode =
    config.geoCountriesBlockMode === true ? "block" : "allow";

  syncL4Options();
};

const saveConfig = async () => {
  if (!props.serverId) return;

  if (geoIpForm.value.enabled && (!geoIpForm.value.selectedCountries || geoIpForm.value.selectedCountries.length === 0)) {
    const modeLabel =
      geoIpForm.value.countryListMode === "block" ? "blocked" : "allowed";
    notifyError(
      L4_DDOS_TITLE,
      `Please select at least one ${modeLabel} country for geo location protection.`
    );
    return;
  }
  
  try {
    await updateL4Config(props.serverId, buildPayload());
    notifySuccess(L4_DDOS_TITLE, "The L4 settings are successfully updated.");
  } catch {
    notifyError(L4_DDOS_TITLE, "The L4 settings could not be updated.");
  }
};

const openConfirmDialog = () => {
  pendingConfirmAction = saveConfig;
  isConfirmDialogOpen.value = true;
};

const handleConfirmDialog = async () => {
  if (pendingConfirmAction) {
    await pendingConfirmAction();
  }
  pendingConfirmAction = null;
};

const buildPayload = () => {
  let detectionLevel = Number(globalForm.value.detectionLevel) || 5;
  detectionLevel = Math.min(10, Math.max(1, detectionLevel));
  let blockInitial = parseNumber(globalForm.value.blockInitialSeconds, 60);
  let blockMax = parseNumber(globalForm.value.blockMaxSeconds, 3600);
  if (blockMax < blockInitial) blockMax = blockInitial;
  const alertHold = Math.max(1, parseNumber(globalForm.value.alertHoldWindows, 5));

  return {
    dev: globalForm.value.ethInterface,
    attachMode: globalForm.value.attachMode,
    sensitivity: sensitivityFromDetectionLevel(detectionLevel),
    protectionMode: globalForm.value.protectionMode,
    blackIpDuration: blockMax,
    preferAdaptive: true,
    enforceDropInvalid: true,
    detectionLevel,
    alertHoldWindows: alertHold,
    blockInitialSeconds: blockInitial,
    blockMaxSeconds: blockMax,
    serviceHttp3: Boolean(globalForm.value.serviceHttp3),
    serviceDns: Boolean(globalForm.value.serviceDns),
    serviceGreTunnels: Boolean(globalForm.value.serviceGreTunnels),
    synValid: Boolean(synForm.value.enabled),
    synThreshold: parseNumber(synForm.value.threshold, 0),
    synBurstPkt: parseNumber(synForm.value.burstPkt, 0),
    synBurstCountPerSec: parseNumber(synForm.value.burstCounter, 0),
    synFixedThreshold: parseNumber(synForm.value.fixedThreshold, 0),
    synFixedCheckDuration: parseNumber(synForm.value.fixedDuration, 0),
    challengeTimeout: parseNumber(synForm.value.challengeTimeout, 0),
    synProtectionDuration: parseNumber(synForm.value.blockDuration, 0),
    ackValid: Boolean(ackForm.value.enabled),
    ackThreshold: parseNumber(ackForm.value.threshold, 0),
    ackBurstPkt: parseNumber(ackForm.value.burstPkt, 0),
    ackBurstCountPerSec: parseNumber(ackForm.value.burstCounter, 0),
    ackFixedThreshold: parseNumber(ackForm.value.fixedThreshold, 0),
    ackFixedCheckDuration: parseNumber(ackForm.value.fixedDuration, 0),
    ackProtectionDuration: parseNumber(ackForm.value.blockDuration, 0),
    rstValid: Boolean(rstForm.value.enabled),
    rstThreshold: parseNumber(rstForm.value.threshold, 0),
    rstBurstPkt: parseNumber(rstForm.value.burstPkt, 0),
    rstBurstCountPerSec: parseNumber(rstForm.value.burstCounter, 0),
    rstFixedThreshold: parseNumber(rstForm.value.fixedThreshold, 0),
    rstFixedCheckDuration: parseNumber(rstForm.value.fixedDuration, 0),
    rstProtectionDuration: parseNumber(rstForm.value.blockDuration, 0),
    stompValid: Boolean(stompForm.value.enabled),
    stompThreshold: parseNumber(stompForm.value.threshold, 0),
    stompBurstPkt: parseNumber(stompForm.value.burstPkt, 0),
    stompBurstCountPerSec: parseNumber(stompForm.value.burstCounter, 0),
    stompFixedThreshold: parseNumber(stompForm.value.fixedThreshold, 0),
    stompFixedCheckDuration: parseNumber(stompForm.value.fixedDuration, 0),
    stompProtectionDuration:
      parseNumber(stompForm.value.blockDuration, 0) || parseNumber(rstForm.value.blockDuration, 120),
    socketValid: Boolean(socketForm.value.enabled),
    socketFinThreshold: parseNumber(socketForm.value.finThreshold, 0),
    socketFixedThreshold: parseNumber(socketForm.value.fixedThreshold, 0),
    socketFixedCheckDuration: parseNumber(socketForm.value.fixedDuration, 0),
    icmpValid: Boolean(icmpForm.value.enabled),
    icmpThreshold: parseNumber(icmpForm.value.threshold, 0),
    icmpBurstPkt: parseNumber(icmpForm.value.burstPkt, 0),
    icmpBurstCountPerSec: parseNumber(icmpForm.value.burstCounter, 0),
    icmpFixedThreshold: parseNumber(icmpForm.value.fixedThreshold, 0),
    icmpFixedCheckDuration: parseNumber(icmpForm.value.fixedDuration, 0),
    icmpProtectionDuration: parseNumber(icmpForm.value.blockDuration, 0),
    udpValid: Boolean(udpForm.value.enabled),
    udpThreshold: parseNumber(udpForm.value.threshold, 0),
    udpBurstPkt: parseNumber(udpForm.value.burstPkt, 0),
    udpBurstCountPerSec: parseNumber(udpForm.value.burstCounter, 0),
    udpFixedThreshold: parseNumber(udpForm.value.fixedThreshold, 0),
    udpFixedCheckDuration: parseNumber(udpForm.value.fixedDuration, 0),
    udpProtectionDuration: parseNumber(udpForm.value.blockDuration, 0),
    greValid: Boolean(greForm.value.enabled),
    greThreshold: parseNumber(greForm.value.threshold, 0),
    greBurstPkt: parseNumber(greForm.value.burstPkt, 0),
    greBurstCountPerSec: parseNumber(greForm.value.burstCounter, 0),
    greFixedThreshold: parseNumber(greForm.value.fixedThreshold, 0),
    greFixedCheckDuration: parseNumber(greForm.value.fixedDuration, 0),
    greProtectionDuration: parseNumber(greForm.value.blockDuration, 0),
    tcpSegCheck: Boolean(tcpDetailedForm.value.segmentationCheck),
    geoCheck: Boolean(geoIpForm.value.enabled),
    geoDbIpv4Path: geoIpForm.value.geoDbIpv4Path,
    geoDbLocationPath: geoIpForm.value.geoDbLocationPath,
    geoAllowCountries: [...geoIpForm.value.selectedCountries],
    geoCountriesBlockMode: geoIpForm.value.countryListMode === "block",
    tcpConnectionLimitCheck: Boolean(tcpDetailedForm.value.connectionLimitEnabled),
    tcpConnectionLimitCnt: parseNumber(tcpDetailedForm.value.connectionLimit, 0)
  };
};

const parseNumber = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return fallback;
  let multiplier = 1;
  if (raw.includes("k")) multiplier = 1000;
  if (raw.includes("m")) multiplier = 1000000;
  const match = raw.match(/[\d.]+/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  if (Number.isNaN(parsed)) return fallback;
  return Math.round(parsed * multiplier);
};

onMounted(() => {
  void loadOptions();
  void loadConfig();
});

watch(
  () => props.serverId,
  () => {
    void loadOptions();
    void loadConfig();
  }
);

watch(
  () => globalForm.value.ethInterface,
  () => {
    syncL4Options();
  }
);
</script>

<style scoped>
.edge-subpanel {
  --cfg-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.edge-subpanel__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 2px;
}

.edge-subpanel__kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.edge-subpanel__intro h4 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
}

.edge-subpanel__intro p:not(.edge-subpanel__kicker) {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
  line-height: 1.45;
  max-width: 44rem;
}

.edge-subpanel__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.l4-panel.edge-subpanel {
  gap: 0;
}

.l4-yn {
  display: inline-flex;
  align-items: stretch;
  padding: 2px;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 85%, transparent);
  gap: 2px;
  flex-shrink: 0;
}

.l4-yn__opt {
  min-width: 40px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.l4-yn__opt:hover:not(.active) {
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-accent) 8%, transparent);
}

.l4-yn__opt.active {
  background: rgba(46, 158, 108, 0.16);
  color: var(--dorian-viper-400, #3fbd85);
  box-shadow: inset 0 0 0 1px rgba(46, 158, 108, 0.35);
}

.l4-yn__opt--no.active {
  background: rgba(225, 82, 65, 0.14);
  color: #e15241;
  box-shadow: inset 0 0 0 1px rgba(225, 82, 65, 0.34);
}

.l4-yn__opt:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 1px;
}

.l4-settings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.l4-settings-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
}

.l4-config {
  gap: 14px !important;
}

.l4-config-row {
  gap: 12px !important;
}

.l4-config-section {
  padding: 14px !important;
  border-radius: 8px !important;
  border-color: var(--app-border) !important;
  background: var(--app-surface-elevated, var(--app-surface)) !important;
}

.l4-config-title h5 {
  font-size: 13px !important;
  font-weight: 650 !important;
  letter-spacing: -0.01em;
}

.l4-input,
.l4-field input,
.l4-field select {
  border-radius: 6px !important;
}

.l4-field label {
  font-size: 10.5px !important;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 650 !important;
}

.l4-panel {
  display: flex;
  flex-direction: column;
  min-height: 260px;
}

.l4-settings {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--app-surface);
  height: calc(100vh - 320px);
  min-height: 0;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.l4-settings-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.l4-config {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.l4-config-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.l4-config-row--global-tcp {
  grid-template-columns: 2fr 1fr;
}

@media (max-width: 900px) {
  .l4-config-row--global-tcp {
    grid-template-columns: 1fr;
  }
}

.l4-config-section {
  padding: 16px 16px 18px;
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  background: var(--app-surface-elevated);
}

.l4-config-section:last-child {
  border-bottom: 1px solid var(--app-border-strong);
  padding-bottom: 18px;
}

.l4-config-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.l4-config-title h5 {
  margin: 0;
  font-size: var(--type-base);
  font-weight: 600;
  color: var(--app-heading);
}

.l4-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.l4-settings-header h4 {
  margin: 0;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
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
  padding: 0;
  border-radius: 0;
  border: none;
  background: transparent;
}

.l4-section h5 {
  margin: 0 0 10px 0;
  font-size: var(--type-base);
  font-weight: 600;
  color: var(--app-heading);
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

.l4-inline-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.l4-inline-toggle h5 {
  margin: 0;
}

.selection-count {
  font-size: var(--type-caption);
  color: var(--app-text-muted);
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
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(46, 158, 108, 0.12);
  color: var(--dorian-viper-400, var(--app-accent));
  font-size: 11.5px;
  font-weight: 650;
  border: 1px solid rgba(46, 158, 108, 0.24);
}

.continent-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.continent-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s ease;
}

.continent-btn.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
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
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  font-size: var(--type-base);
  color: var(--app-heading);
}

.country-option input {
  width: 16px;
  height: 16px;
}

.l4-section-desc {
  margin: -4px 0 12px 0;
  color: var(--app-text-muted);
  font-size: var(--type-base);
  line-height: 1.5;
}

.l4-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
  gap: 12px 16px;
  align-items: end;
}

.l4-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 220px;
}

.l4-field--wide {
  max-width: min(100%, 320px);
}

.l4-geo-mode-row {
  margin-bottom: 4px;
}

.l4-field label {
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}


.l4-input {
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: var(--type-caption);
  color: var(--app-heading);
  background: var(--app-surface-solid);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 220px;
}

.l4-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.l4-input:disabled {
  background: var(--app-surface-hover);
  color: var(--app-text-muted);
  cursor: not-allowed;
}

.confirm-btn {
  align-self: flex-start;
  cursor: pointer;
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
  color: var(--app-text-secondary);
  font-size: var(--type-base);
  line-height: 1.6;
}

.l4-description p {
  margin: 0 0 10px 0;
}

.l4-description code {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-caption);
  background: var(--app-surface-hover);
  padding: 2px 6px;
  border-radius: 6px;
}

.l4-description-group h5 {
  margin: 6px 0 8px 0;
  font-size: var(--type-base);
  color: var(--app-heading);
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
  color: var(--app-text-muted);
  font-size: var(--type-base);
}

.l4-setting {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
}

.l4-setting-label {
  font-size: var(--type-caption);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.l4-setting-value {
  font-size: var(--type-base);
  color: var(--app-heading);
  font-weight: 600;
}

.value-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-secondary);
  background: var(--app-surface-hover);
}

.value-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
}

/* Refresh */
.cfg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cfg-head__copy { display: flex; gap: 12px; min-width: 0; }

.cfg-head__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--dorian-l4, #6b9fd4);
  background: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-l4, #6b9fd4) 30%, transparent);
}

.cfg-head__icon svg { width: 18px; height: 18px; }

.cfg-head__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-head h4 { margin: 0; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; color: var(--app-heading); }
.cfg-head__desc { margin: 3px 0 0; max-width: 44rem; font-size: 12.5px; line-height: 1.45; color: var(--app-text-muted); }

.l4-panel .l4-settings {
  height: auto;
  overflow: visible;
  padding: 0;
  gap: 16px;
  background: transparent !important;
}

.l4-panel .l4-settings-body {
  overflow: visible;
  padding-right: 0;
  background: transparent !important;
}

.l4-panel .l4-config,
.l4-panel .l4-section {
  background: transparent !important;
  border: 0 !important;
}

.l4-panel .l4-config-row { gap: 12px !important; }

.l4-panel .l4-config-section {
  padding: 14px 16px 16px !important;
  border: 0.5px solid var(--app-border) !important;
  border-radius: 12px !important;
  background: var(--app-surface-muted) !important;
  transition: border-color 0.15s ease;
}

.l4-panel .l4-config-section:hover { border-color: var(--app-border-strong) !important; }

.l4-panel .l4-config-title {
  margin: -2px 0 14px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid var(--app-border);
}

.l4-panel .l4-config-title h5,
.l4-panel .l4-section h5 {
  font-size: 13px !important;
  font-weight: 650 !important;
  color: var(--app-heading) !important;
}

.l4-panel .l4-form,
.l4-panel .l4-form-sections { gap: 14px; }

.l4-panel .l4-form-grid {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px 14px;
}

.l4-panel .l4-field,
.l4-panel .l4-field--wide { max-width: none; min-width: 0; }

.l4-panel .l4-field label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px !important;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.l4-panel .l4-input {
  max-width: none;
  padding: 8px 10px;
  border-radius: 7px !important;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
  font-size: 12.5px;
}

.l4-panel .l4-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.l4-panel .l4-input:disabled { opacity: 0.55; background: var(--app-input-bg); }

.l4-panel .l4-yn {
  padding: 2px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
}

.l4-panel .l4-yn__opt {
  min-width: 38px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10.5px;
}

.l4-panel .l4-inline-toggle {
  padding: 10px 12px !important;
  border-radius: 9px;
  border: 0.5px solid var(--app-border) !important;
  background: var(--app-surface) !important;
}

.l4-panel .continent-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text-muted);
  font-weight: 600;
}

.l4-panel .continent-btn:hover:not(:disabled) { color: var(--app-heading); background: var(--app-surface); }

.l4-panel .continent-btn.active {
  color: var(--dorian-viper-400, #3fbd85);
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, transparent);
}

.l4-panel .country-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 6px; }

.l4-panel .country-option {
  padding: 7px 10px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  font-size: 12.5px;
  color: var(--app-text);
  cursor: pointer;
  transition: border-color 0.12s ease, background 0.12s ease;
}

.l4-panel .country-option:hover { border-color: var(--app-border-strong); }

.l4-panel .country-option:has(input:checked) {
  color: var(--app-heading);
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 9%, var(--app-surface));
}

.l4-panel .country-option input { accent-color: var(--dorian-viper-500, #2e9e6c); width: 14px; height: 14px; }

.l4-panel .country-chip { border-radius: 999px; padding: 3px 10px; }

.l4-applybar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  backdrop-filter: blur(6px);
}

.l4-applybar__copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.l4-applybar__copy i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dorian-l4, #6b9fd4);
}

.l4-applybar .confirm-btn { align-self: auto; }
</style>
