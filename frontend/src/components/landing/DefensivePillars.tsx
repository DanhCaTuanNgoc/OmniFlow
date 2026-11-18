"use client";

import React from "react";

interface Pillar {
  number: string;
  title: string;
  badge: string;
  description: string;
  codeSnippet: string;
  icon: string;
}

const PILLARS: Pillar[] = [
  {
    number: "01",
    title: "Callback Proxy Authorization",
    badge: "Anti-Spoofing Guard",
    description:
      "ActionVault verifies msg.sender matches the official Reactive Callback Proxy on Base Sepolia, and validates that rscCaller is registered in authorizedRSCs[rscCaller] == true.",
    codeSnippet: "require(msg.sender == callbackProxy && authorizedRSCs[rscCaller]);",
    icon: "fa-solid fa-key",
  },
  {
    number: "02",
    title: "Stateless Cooldown Protection",
    badge: "200ms Denim Armor",
    description:
      "RSCs enforce a stateless timestamp check at the very beginning of react(). Drops 100% of redundant micro-block triggers during extreme DEX volatility across 200ms blocks.",
    codeSnippet: "if (block.timestamp - lastTrigger < cooldown) return;",
    icon: "fa-solid fa-stopwatch-20",
  },
  {
    number: "03",
    title: "Live Price Re-Validation",
    badge: "MEV Sandwich Barrier",
    description:
      "Destination execution re-verifies live pool reserves and slippage parameters before completing any swap. Eliminates flash-rebound traps and front-running sandwich attacks.",
    codeSnippet: "require(amountOut >= minAmountOut, 'SlippageExceeded');",
    icon: "fa-solid fa-chart-line",
  },
  {
    number: "04",
    title: "Non-Custodial Panic Sweep",
    badge: "100% User Sovereignty",
    description:
      "Users retain unconditional ownership over all deposited collateral. emergencyWithdraw() and executeSafeSweep() can be called instantly by the owner without keeper consensus.",
    codeSnippet: "vault.emergencyWithdraw(token) // Instant 0-keeper recovery",
    icon: "fa-solid fa-life-ring",
  },
];

export default function DefensivePillars() {
  return (
    <section className="motion-section defensive-pillars-section" aria-label="Defensive Security Pillars">
      <div className="motion-section-header">
        <div className="motion-badge-pill">
          <span className="motion-badge-dot" />
          <span>Security Architecture</span>
        </div>
        <h2 className="motion-section-title">4 Core Defensive Pillars</h2>
        <p className="motion-section-subhead">
          Engineered for mission-critical institutional stability. Invariant guarantees enforced
          at smart contract bytecode level across both chains.
        </p>
      </div>

      <div className="pillars-grid">
        {PILLARS.map((p) => (
          <div key={p.number} className="pillar-card">
            <div className="pillar-header">
              <div className="pillar-icon-ring">
                <div className="pillar-icon-inner">
                  <i className={p.icon} aria-hidden="true" />
                </div>
              </div>
              <span className="pillar-badge">{p.badge}</span>
            </div>

            <div className="pillar-content">
              <span className="pillar-number">{p.number}</span>
              <h3 className="pillar-title">{p.title}</h3>
              <p className="pillar-description">{p.description}</p>
            </div>

            <div className="pillar-code-box">
              <code>{p.codeSnippet}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
