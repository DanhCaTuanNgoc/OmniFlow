'use client';

import { useState } from 'react';
import { Check, Code2, Copy, Download, X } from 'lucide-react';
import { encodeAbiParameters, formatEther, keccak256 } from 'viem';
import {
  resolveStopLoss, stopLossConstructorArgs, STOP_LOSS_PIPELINE_ABI, STOP_LOSS_PIPELINE_SOURCE,
  isPhaseTwoGraph, resolvePhaseTwo, PRICE_ORDER_PIPELINE_SOURCE, PRICE_GATE_PIPELINE_SOURCE,
  PRICE_ORDER_PIPELINE_ABI, PRICE_ORDER_PIPELINE_BYTECODE, PRICE_GATE_PIPELINE_ABI, PRICE_GATE_PIPELINE_BYTECODE,
  STOP_LOSS_TEMPLATE, type StopLossGraph,
} from '@omniflow/shared';

interface SolidityPreviewModalProps extends StopLossGraph {
  isOpen: boolean;
  onClose: () => void;
}

function previewGraph(graph: StopLossGraph) {
  try {
    if (isPhaseTwoGraph(graph)) {
      const candidate = resolvePhaseTwo(graph);
      const gate = candidate.type === 'price-gate';
      const name = gate ? 'PriceGatePipeline' : 'PriceOrderPipeline';
      const args = Object.entries(candidate.config).map(([key, value]) => `// ${key}: ${value}`);
      let bytecode: `0x${string}`;
      let encoded: `0x${string}`;
      if (candidate.type === 'price-gate') {
        const constructor = PRICE_GATE_PIPELINE_ABI.find(item => item.type === 'constructor');
        if (!constructor || constructor.inputs.length !== 1) throw new Error('Phase 2 constructor metadata is invalid.');
        bytecode = PRICE_GATE_PIPELINE_BYTECODE;
        encoded = encodeAbiParameters(constructor.inputs, [candidate.config]);
      } else {
        const constructor = PRICE_ORDER_PIPELINE_ABI.find(item => item.type === 'constructor');
        if (!constructor || constructor.inputs.length !== 1) throw new Error('Phase 2 constructor metadata is invalid.');
        bytecode = PRICE_ORDER_PIPELINE_BYTECODE;
        encoded = encodeAbiParameters(constructor.inputs, [candidate.config]);
      }
      if (bytecode.length < 4 || encoded.length < 66) throw new Error('Phase 2 deployment data is unavailable.');
      return {
        filename: `${name}.sol`,
        text: [
          `// ${name} constructor configuration`,
          '// Constructor is ABI-encoded from the selected versioned contract artifact.',
          `// Creation bytecode hash: ${keccak256(bytecode)}`,
          `// ABI-encoded constructor arguments: ${encoded}`,
          `// Base Vault pool: ${candidate.vaultPool}`,
          ...args,
          '',
          gate ? PRICE_GATE_PIPELINE_SOURCE : PRICE_ORDER_PIPELINE_SOURCE,
        ].join('\n'),
      };
    }
    const config = resolveStopLoss(graph);
    const args = stopLossConstructorArgs(config);
    const constructor = STOP_LOSS_PIPELINE_ABI.find(item => item.type === 'constructor');
    if (!constructor || constructor.inputs.length !== args.length) {
      throw new Error('The deployed template and its constructor metadata do not match.');
    }
    const summary = constructor.inputs.map((input, i) => `// ${input.name}: ${args[i]}`).join('\n');
    return {
      filename: 'StopLoss_Pipeline.sol',
      text: [
        '// Constructor arguments for the precompiled StopLoss_Pipeline',
        `// Template: ${STOP_LOSS_TEMPLATE.id} v${STOP_LOSS_TEMPLATE.version}`,
        `// Lasna deployment value: ${formatEther(STOP_LOSS_TEMPLATE.fundingWei)} lREACT`,
        `// Vault slippage cap in bps: ${STOP_LOSS_TEMPLATE.maxSlippageBps}`,
        summary,
        '',
        STOP_LOSS_PIPELINE_SOURCE,
      ].join('\n'),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to validate this graph.' };
  }
}

export function SolidityPreviewModal({ isOpen, onClose, nodes, edges, networks }: SolidityPreviewModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  if (!isOpen) return null;

  const preview = previewGraph({ nodes, edges, networks });
  const copy = async () => {
    if (!preview.text) return;
    try {
      await navigator.clipboard.writeText(preview.text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const download = () => {
    if (!preview.text) return;
    const url = URL.createObjectURL(new Blob([preview.text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = preview.filename ?? 'StopLoss_Pipeline.sol';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="solidity-preview-title"
        className="ws-panel flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ws-border)] p-4">
          <h2 id="solidity-preview-title" className="flex items-center gap-2 text-sm font-semibold">
            <Code2 size={16} aria-hidden="true" /> Solidity Deployment Preview
          </h2>
          <div className="ws-actions">
            <button type="button" className="ws-button" disabled={!preview.text} onClick={copy}>
              {copyStatus === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copyStatus === 'copied' ? 'Copied' : 'Copy source'}
            </button>
            <button type="button" className="ws-button" disabled={!preview.text} onClick={download}>
              <Download size={14} aria-hidden="true" /> Download .sol
            </button>
            <button type="button" aria-label="Close preview" className="ws-button" onClick={onClose}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>
        {preview.error ? <p role="alert" className="p-4 text-sm text-amber-200">{preview.error}</p> : (
          <pre className="overflow-auto p-4 text-xs leading-relaxed"><code>{preview.text}</code></pre>
        )}
        {copyStatus === 'failed' && <p role="alert" className="p-4 text-sm text-amber-200">Copy failed. Download the source instead.</p>}
      </section>
    </div>
  );
}
