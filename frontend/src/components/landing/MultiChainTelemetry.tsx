"use client";

import React, { useState, useEffect } from "react";

export default function MultiChainTelemetry() {
  const [pulseTime, setPulseTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setPulseTime(now.toTimeString().split(" ")[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="motion-section telemetry-section" aria-label="Multi-Chain Network Topology">
      <div className="motion-section-header scroll-reveal">
        <span className="motion-coord-tag">0x04 // NETWORK_TELEMETRY</span>
        <div className="motion-badge-pill">
          <span className="motion-badge-dot" />
          <span>Multi-Chain Telemetry</span>
        </div>
        <h2 className="motion-section-title">Decentralized Network Topology</h2>
        <p className="motion-section-subhead">
          OmniFlow bridges Base Sepolia's sub-second EVM with Reactive Omni's state-machine engine.
          No off-chain keeper networks or centralized relayers required.
        </p>
      </div>

      {/* Network Cards Grid */}
      <div className="telemetry-networks-grid">
        {/* Base Sepolia Card */}
        <div className="network-card scroll-reveal scroll-stagger-1">
          <div className="network-card-header">
            <div className="network-title-group">
              <span className="network-icon base">
                <i className="fa-solid fa-layer-group" />
              </span>
              <div>
                <h3 className="network-name">Base Sepolia</h3>
                <span className="network-role">Origin & Destination Layer</span>
              </div>
            </div>
            <span className="network-status-badge">
              <span className="pulse-dot green" />
              RPC Active
            </span>
          </div>

          <div className="network-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Chain ID</span>
              <span className="spec-val">84532</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Block Time</span>
              <span className="spec-val">200 ms (Denim)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Execution Target</span>
              <a
                href="https://sepolia.basescan.org/address/0x005d4cB896c9e0B07Bbf961FDC26b098D84079d7"
                target="_blank"
                rel="noopener noreferrer"
                className="spec-val text-violet-400 hover:text-violet-300 underline font-mono text-[11px]"
              >
                ActionVault.sol (0x005d...79d7)
              </a>
            </div>
            <div className="spec-item">
              <span className="spec-label">RPC Latency</span>
              <span className="spec-val">~112 ms</span>
            </div>
          </div>
        </div>

        {/* Reactive Omni Lasna Card */}
        <div className="network-card scroll-reveal scroll-stagger-2">
          <div className="network-card-header">
            <div className="network-title-group">
              <span className="network-icon reactive">
                <i className="fa-solid fa-atom" />
              </span>
              <div>
                <h3 className="network-name">Reactive Omni Lasna</h3>
                <span className="network-role">Autonomic Event-Driven Brain</span>
              </div>
            </div>
            <span className="network-status-badge">
              <span className="pulse-dot green" />
              Validator Mesh
            </span>
          </div>

          <div className="network-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Chain ID</span>
              <span className="spec-val">5318007</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Consensus</span>
              <span className="spec-val">CometBFT (~1s)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Core Runtime</span>
              <a
                href="https://lasna.reactscan.net/address/0x8c2d098617102a64925cc683d9b444f938a96082"
                target="_blank"
                rel="noopener noreferrer"
                className="spec-val text-violet-400 hover:text-violet-300 underline font-mono text-[11px]"
              >
                StopLoss_Pipeline (0x8c2d...6082)
              </a>
            </div>
            <div className="spec-item">
              <span className="spec-label">RPC Latency</span>
              <span className="spec-val">~128 ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Performance Metrics Bar */}
      <div className="telemetry-bar-card scroll-reveal scroll-stagger-3">
        <div className="telemetry-bar-item">
          <span className="telemetry-glyph">&lt;</span>
          <div className="telemetry-metric">
            <span className="metric-num">200ms</span>
            <span className="metric-desc">Base Micro-Block Latency</span>
          </div>
        </div>

        <div className="telemetry-bar-item">
          <span className="telemetry-glyph">%</span>
          <div className="telemetry-metric">
            <span className="metric-num">100%</span>
            <span className="metric-desc">On-Chain Autonomy</span>
          </div>
        </div>

        <div className="telemetry-bar-item">
          <span className="telemetry-glyph">*</span>
          <div className="telemetry-metric">
            <span className="metric-num">0</span>
            <span className="metric-desc">Off-Chain Keepers Required</span>
          </div>
        </div>

        <div className="telemetry-bar-item">
          <span className="telemetry-glyph">#</span>
          <div className="telemetry-metric">
            <span className="metric-num">{pulseTime || "LIVE"}</span>
            <span className="metric-desc">Telemetry Heartbeat</span>
          </div>
        </div>
      </div>
    </section>
  );
}
