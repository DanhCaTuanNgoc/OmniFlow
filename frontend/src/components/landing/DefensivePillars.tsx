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
      "The stop-loss contract uses block timestamps to skip new triggers during the configured cooldown window.",
    codeSnippet: "if (block.timestamp - lastTrigger < cooldown) return;",
    icon: "fa-solid fa-stopwatch-20",
  },
  {
    number: "03",
    title: "Live Price Re-Validation",
    badge: "Slippage Limit",
    description:
      "For local price triggers, the vault rechecks the pool price before swapping. The swap also specifies a minimum amount out.",
    codeSnippet: "require(amountOut >= minAmountOut, 'SlippageExceeded');",
    icon: "fa-solid fa-chart-line",
  },
  {
    number: "04",
    title: "Owner-Controlled Withdrawal",
    badge: "Non-Custodial Vault",
    description:
      "The owner can withdraw the vault's ETH on-chain using emergencyWithdraw(). An authorized callback can sweep ETH to the configured backup address.",
    codeSnippet: "vault.emergencyWithdraw();",
    icon: "fa-solid fa-life-ring",
  },
];

export default function DefensivePillars() {
  return (
    <section className="motion-section defensive-pillars-section" aria-label="Defensive Security Pillars">
      <div className="motion-section-header scroll-reveal">
        <span className="motion-coord-tag">0x02 // DEFENSIVE_INVARIANTS</span>
        <h2 className="motion-section-title">4 Core Defensive Pillars</h2>
        <p className="motion-section-subhead">
          How OmniFlow checks callbacks, limits repeated triggers, bounds swap slippage,
          and lets vault owners withdraw funds.
        </p>
      </div>

      <div className="pillars-grid">
        {PILLARS.map((p, idx) => (
          <div key={p.number} className={`pillar-card scroll-reveal scroll-stagger-${idx + 1}`}>
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
