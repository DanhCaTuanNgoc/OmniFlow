"use client";

import evidenceManifest from "../../../../FULL_LOOP_EVIDENCE.json";

const { destinationVault, reactiveSmartContract } = evidenceManifest.demo.contracts;

export default function MultiChainTelemetry() {
  return (
    <section className="motion-section telemetry-section" aria-label="Testnet Architecture">
      <div className="motion-section-header scroll-reveal">
        <h2 className="motion-section-title">Testnet Architecture</h2>
        <p className="motion-section-subhead">
          The stop-loss demo starts with a pool event on Base Sepolia. A reactive contract
          on Lasna evaluates the event and requests a callback to ActionVault on Base Sepolia.
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
          </div>

          <div className="network-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Chain ID</span>
              <span className="spec-val">84532</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Execution Target</span>
              <a
                href={destinationVault.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="spec-val text-violet-400 hover:text-violet-300 underline font-mono text-[11px]"
              >
                {destinationVault.contractName}
              </a>
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
                <span className="network-role">Reactive Execution Layer</span>
              </div>
            </div>
          </div>

          <div className="network-specs-grid">
            <div className="spec-item">
              <span className="spec-label">Chain ID</span>
              <span className="spec-val">5318007</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Core Runtime</span>
              <a
                href={reactiveSmartContract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="spec-val text-violet-400 hover:text-violet-300 underline font-mono text-[11px]"
              >
                {reactiveSmartContract.contractName}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
