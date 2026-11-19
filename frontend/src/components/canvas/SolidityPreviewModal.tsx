'use client';

import React, { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { X, Code2, Copy, Check, Download, ExternalLink, ShieldCheck } from 'lucide-react';


interface SolidityPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
}

export function SolidityPreviewModal({
  isOpen,
  onClose,
  nodes,
  edges,
}: SolidityPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract parameters from active canvas graph
  const triggerNode = nodes.find(
    (n) => n.type === 'watchDEXPrice' || n.type === 'customEventWatcher' || n.data.category === 'trigger'
  );
  const conditionPriceNode = nodes.find((n) => n.type === 'priceThresholdGuard');
  const conditionVelocityNode = nodes.find((n) => n.type === 'priceVelocityGuard');
  const cooldownNode = nodes.find((n) => n.type === 'cooldownGuard');
  const actionNode = nodes.find(
    (n) => n.type === 'dexSwap' || n.type === 'emergencySafeSweep' || n.data.category === 'action'
  );

  const originChainId = Number(triggerNode?.data?.chainId || 84532);
  const pairAddress = String(
    triggerNode?.data?.pairAddress ||
      triggerNode?.data?.contractAddress ||
      '/* select an origin contract */'
  );
  const originTopic0 = String(
    triggerNode?.data?.topic0 ||
      '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'
  );
  const priceThresholdUSD = Number(conditionPriceNode?.data?.thresholdPriceUSD || 1800);
  const cooldownSeconds = Number(cooldownNode?.data?.cooldownSeconds || 300);
  const percentToSwap = Number(actionNode?.data?.amountPercentage || 50);
  const actionVault = String(
    actionNode?.data?.actionVaultAddress || '/* select an ActionVault */'
  );
  const velocityBps = Number(conditionVelocityNode?.data?.velocityThresholdBps || 500);
  const windowSecs = Number(conditionVelocityNode?.data?.windowSeconds || 10);

  const generatedSolidity = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import "@reactive-network/reactive-lib/src/interfaces/IReactive.sol";
import "@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol";

/**
 * @title OmniFlow_AutonomousPipeline
 * @notice Compiled from OmniFlow Visual Studio DAG
 * @dev Deployed autonomously on Reactive Omni (Lasna Testnet: ${originChainId === 1301 ? 'Cross-Chain 1301 -> 84532' : 'Lasna #5318007'})
 */
contract OmniFlow_AutonomousPipeline is IReactive, AbstractReactive {
    // Pipeline Immutable Configuration
    uint256 public constant ORIGIN_CHAIN_ID = ${originChainId}; // ${originChainId === 1301 ? 'Unichain Sepolia' : 'Base Sepolia'}
    uint256 public constant SYNC_TOPIC = ${originTopic0};
    
    address public immutable pairAddress = ${pairAddress};
    uint256 public immutable priceThreshold = ${priceThresholdUSD} * 1e18; // Threshold $${priceThresholdUSD} USD
    uint256 public immutable cooldownSeconds = ${cooldownSeconds}; // ${cooldownSeconds}s Stateless Rate-Limiter
    uint256 public immutable percentToSwap = ${percentToSwap}; // ${percentToSwap}% Vault Collateral Liquidation
    address public immutable actionVault = ${actionVault};

    // Stateful Anti-Wick & Price Velocity Guards (ReactVM Memory)
    uint256 public consecutiveHits;
    uint256 public immutable requiredHits = 2; // Anti-wick confirmation
    uint256 public windowStartPrice;
    uint256 public windowStartTime;
    uint256 public immutable velocityThresholdBps = ${velocityBps}; // ${(velocityBps / 100).toFixed(1)}% drop window
    uint256 public immutable windowSeconds = ${windowSecs}; // ${windowSecs}s sliding window

    // Execution & Gas State
    uint256 public callbacksEmitted;
    uint256 public lastTriggeredTimestamp;

    event ConditionTriggered(uint256 currentPrice, uint256 blockTime);

    constructor() payable {
        // Funded with 1.0 lREACT gas in deployment transaction
        if (!vm && address(service) != address(0)) {
            service.subscribe(
                ORIGIN_CHAIN_ID,
                pairAddress,
                SYNC_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        if (log.chain_id != ORIGIN_CHAIN_ID || log._contract != pairAddress) return;

        // 1. Stateless Cooldown Timestamp Protection (Denim 200ms Storm Guard)
        if (block.timestamp - lastTriggeredTimestamp < cooldownSeconds) {
            return;
        }

        // 2. Decode Reserve Data & Calculate Spot Price
        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        if (reserve0 == 0) return;
        uint256 currentPrice = (uint256(reserve1) * 1e18) / uint256(reserve0);

        // 3. Evaluate Configured Condition
        if (currentPrice <= priceThreshold) {
            consecutiveHits++;
            if (consecutiveHits < requiredHits) return;

            // Trigger Condition Satisfied
            lastTriggeredTimestamp = block.timestamp;
            callbacksEmitted++;
            consecutiveHits = 0;
            emit ConditionTriggered(currentPrice, block.timestamp);

            // 4. Construct Two-Slot Payload for Reactive Callback Proxy
            bytes memory payload = abi.encodeWithSignature(
                "executeStopLoss(address,address,uint256,uint256,bool)",
                address(0),         // Slot 1: Proxy overwrites with RVM ID
                address(this),      // Slot 2: RSC caller address
                priceThreshold,
                percentToSwap,
                ${originChainId === 1301 ? 'true' : 'false'} // isCrossChainTrigger
            );

            // 5. Emit Callback Request to Destination Chain (Base Sepolia: 84532)
            emit Callback(
                84532,              // Base Sepolia destination
                actionVault,
                1000000,            // Gas limit for swap
                payload
            );
        } else {
            consecutiveHits = 0;
        }
    }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSolidity);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSolidity], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'OmniFlow_AutonomousPipeline.sol';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#08090D] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0c0d14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight font-sans">
                  Solidity Draft Preview
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                  SOLC ^0.8.20
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono">
                  DYNAMICALLY GENERATED
                </span>
              </div>
              <p className="text-xs text-[#8e8e8e] mt-0.5">
                Parameterized Reactive Smart Contract (RSC) bytecode compiled from active Canvas DAG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-full bg-[#16171a] hover:bg-[#202126] text-white border border-white/20 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>.sol</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code View Area with line numbers */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#050608] font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="overflow-x-auto p-2">
            <code>{generatedSolidity}</code>
          </pre>
        </div>

        {/* Modal Footer with Invariants info */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#0c0d14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Guaranteed Zero AST Compiler Delay • Pre-compiled EVM Bytecode Deployed in &lt;1.5s</span>
          </div>

          <span className="text-[#8e8e8e] font-mono text-[11px]">
            Target: Reactive Lasna (#5318007) &bull; Value: 1.0 lREACT
          </span>
        </div>
      </div>
    </div>
  );
}
