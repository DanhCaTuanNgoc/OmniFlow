"use client";

import React, { useState } from "react";
import Link from "next/link";

interface NodeData {
  id: string;
  type: "trigger" | "condition" | "action";
  title: string;
  chain: string;
  detail: string;
  icon: string;
  statusText: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  badge: string;
  nodes: NodeData[];
}

const RECIPES: Recipe[] = [
  {
    id: "stop-loss",
    name: "DEX Stop-Loss & SafeSweep",
    badge: "Flagship Recipe",
    description:
      "Detects Uniswap V2 Pair sync events on Base Sepolia, calculates real-time price deviation on Reactive Omni Lasna, and fires non-custodial ActionVault execution.",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        title: "Watch DEX Pair Swap",
        chain: "Base Sepolia (84532)",
        detail: "UniswapV2Pair.Sync(reserve0, reserve1)",
        icon: "fa-solid fa-bolt",
        statusText: "Listening 200ms Blocks",
      },
      {
        id: "condition",
        type: "condition",
        title: "Price Threshold Guard",
        chain: "Reactive Lasna (5318007)",
        detail: "price < targetPrice && cooldown >= 120s",
        icon: "fa-solid fa-shield-halved",
        statusText: "Autonomic RSC Evaluation",
      },
      {
        id: "action",
        type: "action",
        title: "ActionVault SafeSweep",
        chain: "Base Sepolia (84532)",
        detail: "executeStopLoss(minOut) -> backupSafeAddress",
        icon: "fa-solid fa-vault",
        statusText: "Non-Custodial Callback",
      },
    ],
  },
  {
    id: "cooldown-guard",
    name: "200ms Denim Storm Guard",
    badge: "Security Pattern",
    description:
      "Protects destination vaults from rapid micro-block callback storms during intense DEX volatility on Base Sepolia's sub-second Denim block times.",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        title: "High-Freq Swap Burst",
        chain: "Base Sepolia (84532)",
        detail: "Multiple swap transactions in block cluster",
        icon: "fa-solid fa-arrows-split-up-and-left",
        statusText: "Bursts Detected",
      },
      {
        id: "condition",
        type: "condition",
        title: "Stateless Cooldown Guard",
        chain: "Reactive Lasna (5318007)",
        detail: "block.timestamp - lastTrigger >= cooldown",
        icon: "fa-solid fa-stopwatch",
        statusText: "Storm Throttling Active",
      },
      {
        id: "action",
        type: "action",
        title: "Throttled Vault Callback",
        chain: "Base Sepolia (84532)",
        detail: "Authorized execution with zero redundant gas",
        icon: "fa-solid fa-circle-check",
        statusText: "Safe Atomic Dispatch",
      },
    ],
  },
  {
    id: "phishing-evac",
    name: "Phishing Evacuation Sweep",
    badge: "Vault Invariant",
    description:
      "Monitors unauthorized ERC-20 transfer attempts and immediately evacuates all user deposits into an immutable cold backup wallet.",
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        title: "Watch Unauthorized Transfer",
        chain: "Base Sepolia (84532)",
        detail: "Transfer(address from, address to, uint256 val)",
        icon: "fa-solid fa-triangle-exclamation",
        statusText: "Anomaly Sensor",
      },
      {
        id: "condition",
        type: "condition",
        title: "Sender Authorization Check",
        chain: "Reactive Lasna (5318007)",
        detail: "isApprovedSpender == false || balanceSpike > limit",
        icon: "fa-solid fa-lock",
        statusText: "Zero-Trust Verification",
      },
      {
        id: "action",
        type: "action",
        title: "Emergency SafeSweep",
        chain: "Base Sepolia (84532)",
        detail: "executeSafeSweep() -> 100% funds evacuated",
        icon: "fa-solid fa-life-ring",
        statusText: "Instant Asset Protection",
      },
    ],
  },
];

export default function StudioCanvasShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const activeRecipe = RECIPES[activeTab];

  return (
    <section className="motion-section studio-showcase-section" aria-label="Visual Studio Showcase">
      <div className="motion-section-header scroll-reveal">
        <span className="motion-coord-tag">0x01 // STUDIO_ORCHESTRATION</span>
        <h2 className="motion-section-title">Visual Pipeline Studio</h2>
        <p className="motion-section-subhead">
          Build and visualize keeperless cross-chain DAG pipelines with zero Solidity coding.
          Event-driven architecture powered by Reactive Omni.
        </p>
      </div>

      {/* Recipe Selector Dock */}
      <div className="recipe-dock-container scroll-reveal scroll-stagger-1">
        <div className="recipe-dock" role="tablist" aria-label="Pipeline Preset Recipes">
          {RECIPES.map((r, i) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={activeTab === i}
              className={`recipe-dock-item ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="recipe-dock-name">{r.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Mockup Canvas Surface */}
      <div className="showcase-canvas-container scroll-reveal scroll-stagger-2">
        <div className="showcase-canvas-header">
          <div className="showcase-window-controls">
            <span className="ctrl-dot red" />
            <span className="ctrl-dot yellow" />
            <span className="ctrl-dot green" />
          </div>
          <span className="showcase-canvas-title">
            DAG Orchestration · {activeRecipe.badge}
          </span>
          <Link href="/workspace/studio" className="showcase-open-btn">
            Open in Studio <i className="fa-solid fa-arrow-up-right-from-square ml-1" />
          </Link>
        </div>

        <p className="showcase-recipe-desc">{activeRecipe.description}</p>

        {/* Node Pipeline Canvas Display */}
        <div className="showcase-dag-grid">
          {activeRecipe.nodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <div className={`showcase-node node-${node.type}`}>
                <div className="showcase-node-header">
                  <div className="showcase-node-icon-box">
                    <i className={node.icon} aria-hidden="true" />
                  </div>
                  <div className="showcase-node-meta">
                    <span className="showcase-node-type">{node.type.toUpperCase()}</span>
                    <h3 className="showcase-node-title">{node.title}</h3>
                  </div>
                </div>

                <div className="showcase-node-body">
                  <div className="showcase-node-chain">
                    <span className="chain-dot" />
                    <span>{node.chain}</span>
                  </div>
                  <div className="showcase-node-code">
                    <code>{node.detail}</code>
                  </div>
                </div>

                <div className="showcase-node-footer">
                  <span className="pulse-indicator" />
                  <span className="showcase-node-status">{node.statusText}</span>
                </div>
              </div>

              {/* Connecting Pulse Connector between nodes */}
              {idx < activeRecipe.nodes.length - 1 && (
                <div className="showcase-connector" aria-hidden="true">
                  <div className="connector-line">
                    <div className="connector-photon" />
                  </div>
                  <i className="fa-solid fa-chevron-right connector-arrow" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
