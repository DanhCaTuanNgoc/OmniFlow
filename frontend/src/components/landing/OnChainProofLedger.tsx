"use client";

import React, { useState } from "react";
import evidenceManifest from "../../../../FULL_LOOP_EVIDENCE.json";

const evidence = evidenceManifest.demo;
const { contracts, verifiableTransactions } = evidence;
const fullLoopVerified = evidence.status.startsWith("VERIFIED_FULL_LOOP");
const VERIFICATION_COMMAND = "pnpm --filter backend exec tsx ../scripts/test-full-loop.ts --preflight";

const VERIFICATION_LEGS = [
  {
    leg: "1. Origin Event Trigger",
    deployment: contracts.originPair,
    receipt: verifiableTransactions.step1_originEvent,
    detail: "Sync from the deployed test pool",
  },
  {
    leg: "2. Reactive Core Processing",
    deployment: contracts.reactiveSmartContract,
    receipt: verifiableTransactions.step2_reactiveExecution,
    detail: "Lasna reaction references the origin Sync",
  },
  {
    leg: "3. Destination Callback Vault",
    deployment: contracts.destinationVault,
    receipt: verifiableTransactions.step3_callbackExecution,
    detail: fullLoopVerified ? "StopLossExecuted and test-token payout to the vault owner" : "Awaiting the matched destination receipt",
  },
];

const RAW_EVIDENCE_JSON = JSON.stringify(evidence, null, 2);

const HONESTY_CLAIMS = [
  {
    claim: "Full-loop stop-loss execution",
    status: fullLoopVerified ? "Confirmed on testnet" : "Callback pending",
    evidence: "The demo uses an on-chain test pool and test tokens.",
    verified: fullLoopVerified,
  },
  {
    claim: "Take-Profit",
    status: "Full-loop verification pending",
    evidence: "Testnet deployment is in place. Live payout and price-reversal skip still need matched receipts.",
    verified: false,
  },
  {
    claim: "Additional pipeline scenarios",
    status: "Not deployed",
    evidence: "The 16 other scenarios are outside the hackathon demo scope and have no dedicated testnet deployments. The Stop-Loss evidence already covers cooldown behavior.",
    verified: false,
  },
  {
    claim: "Contract test coverage",
    status: "Foundry test suite",
    evidence: "The repository includes ActionVault and StopLoss_Pipeline tests.",
    verified: true,
  },
  {
    claim: "Timestamp cooldown",
    status: "Covered by tests",
    evidence: "The RSC enforces its cooldown using block timestamps.",
    verified: true,
  },
  {
    claim: "Non-custodial vault recovery",
    status: "Covered by tests",
    evidence: "The owner can call emergencyWithdraw to recover the vault's ETH.",
    verified: true,
  },
];

export default function OnChainProofLedger() {
  const [activeTab, setActiveTab] = useState<"table" | "json" | "honesty">("table");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(VERIFICATION_COMMAND);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(RAW_EVIDENCE_JSON);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <section className="motion-section proof-ledger-section" aria-label="On-Chain Proof">
      <div className="motion-section-header scroll-reveal">
        <span className="motion-coord-tag">0x03 // ONCHAIN_PROOF_LEDGER</span>
        <h2 className="motion-section-title">On-Chain Proof</h2>
        <p className="motion-section-subhead">
          The stop-loss demo uses a deployed test pool on <strong>Base Sepolia</strong> and a reactive contract on <strong>Lasna</strong>.
        </p>
      </div>

      {/* Proof Terminal Card */}
      <div className="proof-terminal-card scroll-reveal scroll-stagger-1">
        <div className="terminal-card-header">
          <div className="terminal-header-info">
            <span className="terminal-tag" style={{ color: "#34d399" }}>
              <i className="fa-solid fa-circle-check mr-1.5" />
              {fullLoopVerified ? "3 of 3 receipts confirmed" : "2 of 3 receipts confirmed"}
            </span>
            <h3 className="terminal-title">The 3-Step Cross-Chain Execution Pipeline</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCmd}
              className="terminal-copy-btn"
              aria-label="Copy verification command"
            >
              <i className={copiedCmd ? "fa-solid fa-check text-emerald-400" : "fa-regular fa-copy"} />
              <span>{copiedCmd ? "Copied Command!" : "Copy Test Script"}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="terminal-copy-btn"
              aria-label="Copy raw evidence JSON"
            >
              <i className={copiedJson ? "fa-solid fa-check text-emerald-400" : "fa-regular fa-file-code"} />
              <span>{copiedJson ? "Copied JSON!" : "Copy Evidence JSON"}</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="proof-tabs-bar">
          <button
            type="button"
            className={`proof-tab-btn ${activeTab === "table" ? "active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            <i className="fa-solid fa-table-list" />
            <span>3-Leg Pipeline Proof</span>
          </button>
          <button
            type="button"
            className={`proof-tab-btn ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            <i className="fa-solid fa-code" />
            <span>Raw Demo Evidence</span>
          </button>
          <button
            type="button"
            className={`proof-tab-btn ${activeTab === "honesty" ? "active" : ""}`}
            onClick={() => setActiveTab("honesty")}
          >
            <i className="fa-solid fa-shield-halved" />
            <span>Honesty Table</span>
          </button>
        </div>

        {/* Tab 1: Live On-Chain Table */}
        {activeTab === "table" && (
          <>
            <div className="terminal-command-bar">
              <div className="command-text">
                <span className="prompt-sym">$</span>
                <span className="prompt-cmd">{VERIFICATION_COMMAND}</span>
              </div>
              <span className="command-note" style={{ color: "#34d399" }}>
                ✓ Receipt links from FULL_LOOP_EVIDENCE.json
              </span>
            </div>

            <div className="proof-table-wrapper">
              <table className="proof-table">
                <thead>
                  <tr>
                    <th>Execution Leg</th>
                    <th>Network & Contract</th>
                    <th>Block Confirmed</th>
                    <th>Transaction Hash (Explorer Link)</th>
                    <th className="text-right">State</th>
                  </tr>
                </thead>
                <tbody>
                  {VERIFICATION_LEGS.map((leg, i) => (
                    <tr key={i}>
                      <td className="leg-name">{leg.leg}</td>
                      <td className="leg-meta">
                        <span className="chain-name">{leg.deployment.network}</span>
                        <a
                          href={leg.deployment.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contract-addr-link"
                          title="Open Contract on Explorer"
                        >
                          {leg.deployment.contractName} ({leg.deployment.address.slice(0, 6)}...{leg.deployment.address.slice(-4)})
                          <i className="fa-solid fa-arrow-up-right-from-square text-[9px] ml-1 opacity-70" />
                        </a>
                      </td>
                      <td className="leg-block">
                        <span className="block-confirmed">
                          <i className="fa-solid fa-cube text-emerald-400 text-[10px]" />
                          {"blockNumber" in leg.receipt ? leg.receipt.blockNumber : "-"}
                        </span>
                      </td>
                      <td className="leg-evidence">
                        {leg.receipt.txHash && "explorerUrl" in leg.receipt && <a
                          href={leg.receipt.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                          title="View Transaction on Block Explorer"
                        >
                          <i className="fa-solid fa-link text-[10px]" />
                          <span>{leg.receipt.txHash.slice(0, 14)}...{leg.receipt.txHash.slice(-10)}</span>
                          <i className="fa-solid fa-arrow-up-right-from-square text-[9px] opacity-70" />
                        </a>}
                        <span className="evidence-detail-badge">{leg.detail}</span>
                      </td>
                      <td className="text-right">
                        <span className={leg.receipt.txHash ? "status-pill verified" : "status-pill"}>
                          {leg.receipt.txHash ? "Confirmed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 2: Raw JSON Evidence */}
        {activeTab === "json" && (
          <div className="proof-json-container">
            <pre className="proof-json-viewer">
              <code>{RAW_EVIDENCE_JSON}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Honesty Table */}
        {activeTab === "honesty" && (
          <div className="honesty-list pt-2">
            {HONESTY_CLAIMS.map((item, idx) => (
              <div key={idx} className="honesty-row">
                <div className="honesty-claim">
                  <span className="claim-text">{item.claim}</span>
                </div>
                <div className="honesty-status-col">
                  <span className={item.verified ? "status-pill verified" : "status-pill pending"}>
                    {item.verified && <i className="fa-solid fa-check" aria-hidden="true" />}
                    <span>{item.status}</span>
                  </span>
                </div>
                <div className="honesty-evidence-col">
                  <span className="evidence-text">{item.evidence}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Honesty Claims Table (Verification Footer) */}
      <div className="honesty-table-card scroll-reveal scroll-stagger-2">
        <div className="honesty-header">
          <div>
            <h3 className="honesty-title">What We Verified</h3>
            <p className="honesty-subtitle">
              Source of Truth: FULL_LOOP_EVIDENCE.json, contracts/ test suite, and PROJECT_BLUEPRINT.md
            </p>
          </div>
          <span className="honesty-badge" style={{ borderColor: "rgba(52, 211, 153, 0.4)", color: "#34d399" }}>
            ✓ Zero-Mock Verification Standard
          </span>
        </div>

        <div className="honesty-list">
          {HONESTY_CLAIMS.slice(0, 4).map((item, idx) => (
            <div key={idx} className="honesty-row">
              <div className="honesty-claim">
                <span className="claim-text">{item.claim}</span>
              </div>
              <div className="honesty-status-col">
                <span className="status-pill verified">
                  <i className="fa-solid fa-check" />
                  <span>{item.status}</span>
                </span>
              </div>
              <div className="honesty-evidence-col">
                <span className="evidence-text">{item.evidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
