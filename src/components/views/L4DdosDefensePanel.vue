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
        <h4>{{ activeL4Label }}</h4>
      </div>
      <div class="l4-settings-body">
        <div v-if="isL4ConfigActive" class="l4-config">
          <div class="l4-config-row l4-config-row--global-tcp">
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>Global Config</h5>
              </div>
              <div class="l4-form">
                <div class="l4-form-sections">
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="global-protection-mode">
                          Protection Mode
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Defines how L4 defense reacts to detected traffic."
                          >
                            i
                          </button>
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
                        <label for="global-sensitivity">
                          Sensitivity
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Controls how aggressively the system detects threats."
                          >
                            i
                          </button>
                        </label>
                        <select
                          id="global-sensitivity"
                          v-model="globalForm.sensitivity"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="global-eth-interface">
                          Eth Interface
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Network interface that L4 protection attaches to."
                          >
                            i
                          </button>
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
                        <label for="global-attach-mode">
                          Attach Mode
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="How the XDP/eBPF hook is attached to the interface."
                          >
                            i
                          </button>
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
                        <label for="global-block-duration">
                          Block Duration
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="How long detected IPs remain blocked."
                          >
                            i
                          </button>
                        </label>
                        <input
                          id="global-block-duration"
                          v-model="globalForm.blockDuration"
                          type="text"
                          class="l4-input"
                          :disabled="!globalForm.enabled"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>TCP Detailed Config</h5>
              </div>
              <div class="l4-form">
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
                        <label for="tcp-connection-limit">
                          Connection Limit Count
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Caps concurrent TCP connections per source to prevent resource exhaustion attacks."
                          >
                            i
                          </button>
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
                    <h5>
                      TCP Segmentation Check
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Validates TCP segment patterns to detect malformed or abusive traffic often used in evasion attempts."
                      >
                        i
                      </button>
                    </h5>
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
              </div>
            </section>
          </div>
          <div class="l4-config-row l4-config-row--tcp-floods">
            <section class="l4-config-section">
              <div class="l4-config-title">
                <h5>TCP SYN Flood</h5>
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
              </div>
              <div class="l4-form">
                <div class="l4-form-sections">
                  <div class="l4-section">
                    <div class="l4-form-grid">
                      <div class="l4-field">
                        <label for="syn-threshold">
                          Threshold
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Packets per second to trigger SYN flood defense."
                          >
                            i
                          </button>
                        </label>
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
                        <label for="syn-burst-pkt">
                          Burst Pkt
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                          >
                            i
                          </button>
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
                        <label for="syn-burst-counter">
                          Burst Counter
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                          >
                            i
                          </button>
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
                        <label for="syn-fixed-duration">
                          Fixed Duration
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                          >
                            i
                          </button>
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
                        <label for="syn-fixed-threshold">
                          Fixed Threshold
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                          >
                            i
                          </button>
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
                        <label for="syn-challenge-timeout">
                          Challenge Timeout
                          <button
                            type="button"
                            class="tooltip-btn"
                            title="Time allowed for SYN challenge response."
                          >
                            i
                          </button>
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
            <h5>TCP ACK Flood</h5>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="ack-threshold">
                      Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Packets per second to trigger ACK flood defense."
                      >
                        i
                      </button>
                    </label>
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
                    <label for="ack-burst-pkt">
                      Burst Pkt
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                      >
                        i
                      </button>
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
                    <label for="ack-burst-counter">
                      Burst Counter
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="ack-fixed-duration">
                      Fixed Duration
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="ack-fixed-threshold">
                      Fixed Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
            <h5>TCP RST Flood</h5>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="rst-threshold">
                      Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Packets per second to trigger RST flood defense."
                      >
                        i
                      </button>
                    </label>
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
                    <label for="rst-burst-pkt">
                      Burst Pkt
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                      >
                        i
                      </button>
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
                    <label for="rst-burst-counter">
                      Burst Counter
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="rst-fixed-duration">
                      Fixed Duration
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="rst-fixed-threshold">
                      Fixed Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
        <div class="l4-config-row">
        <section class="l4-config-section">
          <div class="l4-config-title">
            <h5>ICMP Flood</h5>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="icmp-threshold">
                      Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Packets per second to trigger ICMP flood defense."
                      >
                        i
                      </button>
                    </label>
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
                    <label for="icmp-burst-pkt">
                      Burst Pkt
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                      >
                        i
                      </button>
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
                    <label for="icmp-burst-counter">
                      Burst Counter
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="icmp-fixed-duration">
                      Fixed Duration
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="icmp-fixed-threshold">
                      Fixed Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
            <h5>UDP Flood</h5>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="udp-threshold">
                      Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Packets per second to trigger UDP flood defense."
                      >
                        i
                      </button>
                    </label>
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
                    <label for="udp-burst-pkt">
                      Burst Pkt
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                      >
                        i
                      </button>
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
                    <label for="udp-burst-counter">
                      Burst Counter
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="udp-fixed-duration">
                      Fixed Duration
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="udp-fixed-threshold">
                      Fixed Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
            <h5>GRE Flood</h5>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-form-grid">
                  <div class="l4-field">
                    <label for="gre-threshold">
                      Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Packets per second to trigger GRE flood defense."
                      >
                        i
                      </button>
                    </label>
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
                    <label for="gre-burst-pkt">
                      Burst Pkt
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Pkt: Maximum packets allowed in a single burst window before a burst is counted."
                      >
                        i
                      </button>
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
                    <label for="gre-burst-counter">
                      Burst Counter
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Burst Counter: Maximum burst events per second before the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="gre-fixed-duration">
                      Fixed Duration
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
                    <label for="gre-fixed-threshold">
                      Fixed Threshold
                      <button
                        type="button"
                        class="tooltip-btn"
                        title="Fixed Mode: Captures sustained traffic over a fixed window. If packet count exceeds the fixed threshold, the source is blacklisted."
                      >
                        i
                      </button>
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
          </div>
          <div class="l4-form">
            <div class="l4-form-sections">
              <div class="l4-section">
                <div class="l4-section-header">
                  <h5>
                    Allowed Countries
                    <button
                      type="button"
                      class="tooltip-btn"
                      title="Geo IP Check evaluates traffic by source region. Select countries that are allowed to reach this service."
                    >
                      i
                    </button>
                  </h5>
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
        <button type="button" class="confirm-btn" @click="confirmGlobalSettings">
          Confirm Settings
        </button>
        </div>
        <L4BlacklistPanel v-if="isL4BlacklistActive" :server-id="serverId" />
        <L4WhitelistPanel v-if="isL4WhitelistActive" :server-id="serverId" />
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
import L4BlacklistPanel from "./L4BlacklistPanel.vue";
import L4WhitelistPanel from "./L4WhitelistPanel.vue";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();
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

const l4Items = [
  { id: "l4-config", label: "L4 Config" },
  { id: "l4-blacklist", label: "L4 Blacklist" },
  { id: "l4-whitelist", label: "L4 Whitelist" }
];

const activeL4Item = ref(l4Items[0].id);
const activeL4Label = computed(() => {
  const match = l4Items.find((item) => item.id === activeL4Item.value);
  return match?.label || "L4 Config";
});
const globalForm = ref({
  enabled: true,
  protectionMode: "Always On",
  sensitivity: "Medium",
  ethInterface: "eth0",
  attachMode: "skb",
  blockDuration: "3600s"
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

const isL4ConfigActive = computed(() => activeL4Item.value === "l4-config");
const isL4BlacklistActive = computed(() => activeL4Item.value === "l4-blacklist");
const isL4WhitelistActive = computed(() => activeL4Item.value === "l4-whitelist");

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
    notifications.enqueue("Failed to load L4 interface options.", "error");
  } finally {
    l4OptionsLoading.value = false;
  }
};

const applyConfig = (config) => {
  if (!config) return;
  globalForm.value.ethInterface = config.dev || "eth0";
  globalForm.value.attachMode = config.attachMode || "skb";
  globalForm.value.sensitivity = config.sensitivity || "Medium";
  globalForm.value.protectionMode = config.protectionMode || "Always On";
  globalForm.value.blockDuration = String(config.blackIpDuration ?? "3600");

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

  syncL4Options();
};

const saveConfig = async () => {
  if (!props.serverId) return;
  try {
    await updateL4Config(props.serverId, buildPayload());
    notifications.enqueue("L4 settings updated.", "success");
  } catch {
    notifications.enqueue("Failed to update L4 settings.", "error");
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

const buildPayload = () => ({
  dev: globalForm.value.ethInterface,
  attachMode: globalForm.value.attachMode,
  sensitivity: globalForm.value.sensitivity,
  protectionMode: globalForm.value.protectionMode,
  blackIpDuration: parseNumber(globalForm.value.blockDuration, 3600),
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
  tcpConnectionLimitCheck: Boolean(tcpDetailedForm.value.connectionLimitEnabled),
  tcpConnectionLimitCnt: parseNumber(tcpDetailedForm.value.connectionLimit, 0)
});

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
  height: calc(100vh - 320px);
  min-height: 0;
  overflow: hidden;
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
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.7);
}

.l4-config-section:last-child {
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
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
  font-size: 0.98rem;
  font-weight: 600;
  color: #1f2937;
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
  padding: 0;
  border-radius: 0;
  border: none;
  background: transparent;
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

.l4-field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tooltip-btn {
  margin-left: 6px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #fff;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: help;
}

.tooltip-btn:focus {
  outline: 2px solid rgba(59, 130, 246, 0.35);
  outline-offset: 2px;
}

.l4-input {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.85rem;
  color: #1f2937;
  background: #fff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 220px;
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
  width: 108px;
  height: 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
  padding: 0 6px;
  overflow: hidden;
}

.toggle-track.off {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toggle-label {
  z-index: 2;
  font-size: 0.64rem;
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
  top: 3px;
  left: 3px;
  width: 50px;
  height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease;
  z-index: 1;
}

.toggle-knob.on {
  transform: translateX(52px);
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
