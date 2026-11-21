import type { Edge, Node } from '@xyflow/react';
import { isAddress } from 'viem';
import { connectionError, simulationPath } from './pipelineDraft';

export interface PipelineIssue {
  id: string;
  nodeId?: string;
  nodeLabel?: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface PipelineLintResult {
  isValid: boolean;
  canDeploy: boolean;
  errors: PipelineIssue[];
  warnings: PipelineIssue[];
  allIssues: PipelineIssue[];
  nodeIssues: Map<string, PipelineIssue[]>;
  isOrphanMap: Map<string, boolean>;
  hasTrigger: boolean;
  hasAction: boolean;
  hasCompletePath: boolean;
}

export function lintPipelineGraph(nodes: readonly Node[], edges: readonly Edge[]): PipelineLintResult {
  const errors: PipelineIssue[] = [];
  const warnings: PipelineIssue[] = [];
  const nodeIssues = new Map<string, PipelineIssue[]>();
  const isOrphanMap = new Map<string, boolean>();

  const addIssue = (issue: PipelineIssue) => {
    if (issue.severity === 'error') {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
    if (issue.nodeId) {
      const existing = nodeIssues.get(issue.nodeId) ?? [];
      existing.push(issue);
      nodeIssues.set(issue.nodeId, existing);
    }
  };

  // Build incoming / outgoing counts
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
    isOrphanMap.set(n.id, false);
  }
  for (const e of edges) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    outgoing.set(e.source, (outgoing.get(e.source) ?? 0) + 1);
  }

  // 1. Connection-level validation
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const edge of edges) {
    const src = byId.get(edge.source);
    const tgt = byId.get(edge.target);
    if (!src || !tgt) continue;
    const err = connectionError(src, tgt, edge);
    if (err) {
      addIssue({
        id: `edge-${edge.id}`,
        severity: 'error',
        message: `Edge ${src.data.label || src.id} -> ${tgt.data.label || tgt.id}: ${err}`,
      });
    }
  }

  // 2. Node-level validation (Connectivity & Parameters)
  for (const node of nodes) {
    const category = node.data?.category as string | undefined;
    const label = String(node.data?.label || node.id);
    const inCount = incoming.get(node.id) ?? 0;
    const outCount = outgoing.get(node.id) ?? 0;
    const data = (node.data ?? {}) as Record<string, any>;

    // Structural connectivity checks
    if (category === 'trigger') {
      if (outCount === 0) {
        isOrphanMap.set(node.id, true);
        addIssue({
          id: `orphan-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Trigger has no outgoing connections. Connect it to a condition or action.',
        });
      }
      if (inCount > 0) {
        addIssue({
          id: `bad-in-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'error',
          message: 'Triggers cannot have incoming connections.',
        });
      }
    } else if (category === 'action') {
      if (inCount === 0) {
        isOrphanMap.set(node.id, true);
        addIssue({
          id: `orphan-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Action has no incoming connections. Connect an upstream signal to it.',
        });
      }
      if (outCount > 0) {
        addIssue({
          id: `bad-out-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'error',
          message: 'Actions cannot have outgoing connections.',
        });
      }
    } else if (category === 'condition') {
      const isOrphan = inCount === 0 || outCount === 0;
      isOrphanMap.set(node.id, isOrphan);
      if (inCount === 0 && outCount === 0) {
        addIssue({
          id: `orphan-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Condition is disconnected. Connect an incoming trigger and an outgoing action.',
        });
      } else if (inCount === 0) {
        addIssue({
          id: `no-in-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Condition has no incoming signal from a trigger.',
        });
      } else if (outCount === 0) {
        addIssue({
          id: `no-out-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Condition has no outgoing signal to an action or next guard.',
        });
      }
    } else if (category === 'logic') {
      const isOrphan = inCount === 0 || outCount === 0;
      isOrphanMap.set(node.id, isOrphan);
      if (inCount === 0 && outCount === 0) {
        addIssue({
          id: `orphan-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Logic gate is disconnected. Connect inputs and an action output.',
        });
      } else if (inCount === 0) {
        addIssue({
          id: `no-in-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Logic gate requires condition inputs.',
        });
      } else if (outCount === 0) {
        addIssue({
          id: `no-out-${node.id}`,
          nodeId: node.id,
          nodeLabel: label,
          severity: 'warning',
          message: 'Logic gate requires an outgoing connection to an action.',
        });
      }
    }

    // Node Parameter Completeness checks
    switch (node.type) {
      case 'watchDEXPrice':
        if (!data.pairAddress && !data.pairLabel) {
          addIssue({
            id: `param-${node.id}-pair`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'DEX pair contract address is required.',
          });
        }
        break;

      case 'customEventWatcher':
        if (!data.contractAddress) {
          addIssue({
            id: `param-${node.id}-addr`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Target contract address is required.',
          });
        } else if (!isAddress(data.contractAddress)) {
          addIssue({
            id: `param-${node.id}-addr-inv`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Target contract address must be a valid 0x address (42 chars).',
          });
        }
        if (!data.eventName || !String(data.eventName).trim()) {
          addIssue({
            id: `param-${node.id}-evt`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Event signature is required (e.g. Sync(uint112,uint112)).',
          });
        }
        break;

      case 'priceThresholdGuard':
        if (data.thresholdPriceUSD === undefined || Number(data.thresholdPriceUSD) <= 0 || isNaN(Number(data.thresholdPriceUSD))) {
          addIssue({
            id: `param-${node.id}-price`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Price threshold must be a positive number greater than $0.',
          });
        }
        break;

      case 'priceVelocityGuard':
        if (!data.velocityThresholdBps || Number(data.velocityThresholdBps) <= 0) {
          addIssue({
            id: `param-${node.id}-bps`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Velocity drop bps must be greater than 0 (e.g. 500 = 5%).',
          });
        }
        if (!data.windowSeconds || Number(data.windowSeconds) <= 0) {
          addIssue({
            id: `param-${node.id}-win`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Time window must be at least 1 second.',
          });
        }
        break;

      case 'cooldownGuard':
        if (data.cooldownSeconds !== undefined && Number(data.cooldownSeconds) < 0) {
          addIssue({
            id: `param-${node.id}-cool`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Cooldown seconds cannot be negative.',
          });
        }
        break;

      case 'dexSwap':
        if (!data.amountPercentage || Number(data.amountPercentage) <= 0 || Number(data.amountPercentage) > 100) {
          addIssue({
            id: `param-${node.id}-pct`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Swap percentage must be between 1% and 100%.',
          });
        }
        break;

      case 'emergencySafeSweep':
        if (!data.safeAddress || !String(data.safeAddress).trim()) {
          addIssue({
            id: `param-${node.id}-safe`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Cold safe destination address is required.',
          });
        } else if (!isAddress(data.safeAddress)) {
          addIssue({
            id: `param-${node.id}-safe-inv`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Cold safe address must be a valid 0x address.',
          });
        }
        break;

      case 'notifyLogWebhook':
        if (!data.alertTitle || !String(data.alertTitle).trim()) {
          addIssue({
            id: `param-${node.id}-title`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Alert title is required.',
          });
        }
        break;

      case 'watchTransfers':
        if (data.targetWallet && data.targetWallet !== 'Connected Wallet' && !isAddress(data.targetWallet)) {
          addIssue({
            id: `param-${node.id}-wallet`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Target wallet must be "Connected Wallet" or a valid 0x address.',
          });
        }
        break;

      case 'periodicCron':
        if (!data.intervalValue || Number(data.intervalValue) <= 0) {
          addIssue({
            id: `param-${node.id}-cron`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Cron interval must be greater than zero.',
          });
        }
        break;

      case 'balanceThreshold':
        if (!data.thresholdAmount || Number(data.thresholdAmount) <= 0) {
          addIssue({
            id: `param-${node.id}-bal`,
            nodeId: node.id,
            nodeLabel: label,
            severity: 'error',
            message: 'Threshold balance amount must be greater than 0.',
          });
        }
        break;
    }
  }

  // 3. Graph-Level Flow validation
  const triggers = nodes.filter(n => n.data?.category === 'trigger');
  const actions = nodes.filter(n => n.data?.category === 'action');
  const hasTrigger = triggers.length > 0;
  const hasAction = actions.length > 0;

  if (nodes.length > 0 && !hasTrigger) {
    addIssue({
      id: 'graph-no-trigger',
      severity: 'error',
      message: 'Pipeline must have at least one Trigger node to start execution.',
    });
  }

  if (nodes.length > 0 && !hasAction) {
    addIssue({
      id: 'graph-no-action',
      severity: 'error',
      message: 'Pipeline must have at least one Action node to execute on-chain.',
    });
  }

  let hasCompletePath = false;
  if (hasTrigger && hasAction) {
    const path = simulationPath(nodes, edges);
    hasCompletePath = path.nodes.size > 0;
    if (!hasCompletePath) {
      addIssue({
        id: 'graph-broken-path',
        severity: 'error',
        message: 'No continuous path connects any Trigger to an Action. Connect your nodes into a complete flow.',
      });
    }
  }

  const allIssues = [...errors, ...warnings];
  const isValid = errors.length === 0 && warnings.length === 0;
  const canDeploy = nodes.length > 0 && errors.length === 0 && hasTrigger && hasAction && hasCompletePath;

  return {
    isValid,
    canDeploy,
    errors,
    warnings,
    allIssues,
    nodeIssues,
    isOrphanMap,
    hasTrigger,
    hasAction,
    hasCompletePath,
  };
}

/**
 * Organizes nodes cleanly into columns by category:
 * Triggers (X: 60) -> Conditions / Logic (X: 420) -> Actions (X: 780)
 */
export function autoLayoutGraph(nodes: Node[]): Node[] {
  const triggers = nodes.filter(n => n.data?.category === 'trigger');
  const conditions = nodes.filter(n => n.data?.category === 'condition' || n.data?.category === 'logic');
  const actions = nodes.filter(n => n.data?.category === 'action');
  const others = nodes.filter(n => !['trigger', 'condition', 'logic', 'action'].includes(n.data?.category as string));

  const startY = 80;
  const gapY = 160;

  const positions = new Map<string, { x: number; y: number }>();

  triggers.forEach((n, idx) => {
    positions.set(n.id, { x: 60, y: startY + idx * gapY });
  });

  conditions.forEach((n, idx) => {
    positions.set(n.id, { x: 420, y: startY + idx * gapY });
  });

  actions.forEach((n, idx) => {
    positions.set(n.id, { x: 780, y: startY + idx * gapY });
  });

  others.forEach((n, idx) => {
    positions.set(n.id, { x: 1140, y: startY + idx * gapY });
  });

  return nodes.map(n => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }));
}
