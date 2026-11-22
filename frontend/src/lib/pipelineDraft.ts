import type { Edge, Node } from '@xyflow/react';
import { STOP_LOSS_TEMPLATE, type StopLossGraph } from '@omniflow/shared';

const localDraftsKey = 'omniflow.studio.drafts.v1';
export type BrowserDraft = { id: string; name: string; description?: string; updatedAt: number; graph: unknown; isArchived?: boolean };

export function listBrowserDrafts(): BrowserDraft[] {
  const serialized = localStorage.getItem(localDraftsKey);
  if (!serialized) {
    const previous = localStorage.getItem('omniflow.studio.guest.v1');
    return previous ? [{ id: 'previous', name: 'Browser draft', description: 'Recovered browser draft', updatedAt: 0, graph: JSON.parse(previous), isArchived: false }] : [];
  }
  const drafts: unknown = JSON.parse(serialized);
  if (!Array.isArray(drafts) || !drafts.every(draft => record(draft) &&
    typeof draft.id === 'string' && typeof draft.name === 'string' && typeof draft.updatedAt === 'number' && 'graph' in draft &&
    (draft.description === undefined || typeof draft.description === 'string') &&
    (draft.isArchived === undefined || typeof draft.isArchived === 'boolean'))) {
    throw new Error('Browser drafts could not be read.');
  }
  return drafts as BrowserDraft[];
}

export function saveBrowserDraft(id: string, name: string, graph: unknown, description?: string, isArchived?: boolean) {
  const drafts = listBrowserDrafts();
  const existing = drafts.find(draft => draft.id === id);
  const preservedArchived = isArchived !== undefined ? isArchived : Boolean(existing?.isArchived);
  const remaining = drafts.filter(draft => draft.id !== id);
  localStorage.setItem(localDraftsKey, JSON.stringify([{ id, name, description: description ?? existing?.description, updatedAt: Date.now(), graph, isArchived: preservedArchived }, ...remaining]));
}

export function archiveBrowserDraft(id: string, isArchived: boolean = true) {
  const drafts = listBrowserDrafts();
  const existing = drafts.find(draft => draft.id === id);
  if (!existing) return;
  const updated = drafts.map(draft => draft.id === id ? { ...draft, isArchived, updatedAt: Date.now() } : draft);
  localStorage.setItem(localDraftsKey, JSON.stringify(updated));
}

export function deleteBrowserDraft(id: string) {
  const drafts = listBrowserDrafts().filter(draft => draft.id !== id);
  localStorage.setItem(localDraftsKey, JSON.stringify(drafts));
}

export function renameBrowserDraft(id: string, name: string, description?: string) {
  const drafts = listBrowserDrafts();
  const existing = drafts.find(draft => draft.id === id);
  if (!existing) return;
  const updated = drafts.map(draft => draft.id === id ? { ...draft, name, description: description ?? draft.description, updatedAt: Date.now() } : draft);
  localStorage.setItem(localDraftsKey, JSON.stringify(updated));
}

export function duplicateBrowserDraft(id: string): BrowserDraft | undefined {
  const drafts = listBrowserDrafts();
  const existing = drafts.find(draft => draft.id === id);
  if (!existing) return undefined;
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
  const copy: BrowserDraft = {
    id: newId,
    name: `${existing.name} (Copy)`,
    description: existing.description,
    updatedAt: Date.now(),
    graph: existing.graph,
  };
  localStorage.setItem(localDraftsKey, JSON.stringify([copy, ...drafts]));
  return copy;
}

export function exportDraftJson(name: string, graph: unknown) {
  const serialized = JSON.stringify(graph, null, 2);
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'pipeline'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function extractPipelineStats(graph: unknown): {
  nodeCount: number;
  edgeCount: number;
  triggerType?: string;
  actionType?: string;
} {
  if (!record(graph)) return { nodeCount: 0, edgeCount: 0 };
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  let triggerType: string | undefined;
  let actionType: string | undefined;

  for (const n of nodes) {
    if (record(n) && typeof n.type === 'string') {
      if (['watchDEXPrice', 'watchTransfers', 'periodicCron', 'customEventWatcher'].includes(n.type)) {
        triggerType = n.type;
      }
      if (['dexSwap', 'emergencySafeSweep', 'notifyLogWebhook'].includes(n.type)) {
        actionType = n.type;
      }
    }
  }

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    triggerType,
    actionType,
  };
}

export function studioGraph(nodes: readonly Node[], edges: readonly Edge[], networks?: StopLossGraph['networks']) {
  const watcher = nodes.find(node => node.type === 'watchDEXPrice');
  const originChainId = watcher?.data.originChainId ?? watcher?.data.chainId;
  return {
    nodes: nodes.map(({ id, type, position, data }) => {
      const { state: _state, ...fields } = data;
      return { id, type, position, data: fields };
    }),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) =>
      ({ id, source, target, sourceHandle: sourceHandle ?? null, targetHandle: targetHandle ?? null })),
    networks: networks ?? {
      ...STOP_LOSS_TEMPLATE.networks,
      originChainId: typeof originChainId === 'number' ? originChainId : STOP_LOSS_TEMPLATE.networks.originChainId,
    },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function connectionError(source: Node, target: Node, edge: Pick<Edge, 'sourceHandle' | 'targetHandle'>) {
  if (source.data.category === 'action' || target.data.category === 'trigger') return 'The connection uses an incompatible node direction.';
  if (edge.sourceHandle != null || (target.type === 'logicGate'
    ? !['signal-a', 'signal-b'].includes(edge.targetHandle ?? '')
    : edge.targetHandle != null)) return 'The connection references an invalid port.';
  if (source.type === 'customEventWatcher' && ['priceThresholdGuard', 'priceVelocityGuard'].includes(target.type ?? '')) {
    return 'Raw event signals cannot connect directly to a price guard.';
  }
}

export function studioEdgeData(source: Node, target: Node) {
  if ((source.data.originChainId ?? source.data.chainId) === 1301) {
    return { color: '#c084fc', crossChainLabel: 'Cross-Chain: Unichain -> Base' };
  }
  if (source.data.category === 'trigger') return { color: '#38bdf8' };
  if (source.data.category === 'logic') return { color: '#a855f7' };
  return { color: target.data.category === 'action' ? '#34d399' : '#fbbf24' };
}

export function simulationPath(nodes: readonly Node[], edges: readonly Edge[]) {
  const walk = (starts: string[], reverse: boolean) => {
    const visited = new Set(starts);
    const adjacency = new Map<string, string[]>();
    for (const { source, target } of edges) {
      const [from, to] = reverse ? [target, source] : [source, target];
      const outgoing = adjacency.get(from) ?? [];
      outgoing.push(to);
      adjacency.set(from, outgoing);
    }
    for (const id of visited) for (const next of adjacency.get(id) ?? []) visited.add(next);
    return visited;
  };
  const fromTrigger = walk(nodes.filter(n => n.data.category === 'trigger').map(n => n.id), false);
  const toAction = walk(nodes.filter(n => n.data.category === 'action').map(n => n.id), true);
  return {
    nodes: new Set([...fromTrigger].filter(id => toAction.has(id))),
    edges: new Set(edges.filter(edge => fromTrigger.has(edge.source) && toAction.has(edge.target)).map(edge => edge.id)),
  };
}

export function parsePipelineDraft(text: string, supportedTypes: ReadonlyMap<string, string>) {
  const graph: unknown = JSON.parse(text);
  if (!record(graph) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Choose a Studio JSON file with nodes and edges.');
  }

  const nodes: Node[] = graph.nodes.map((value: unknown) => {
    if (!record(value) || typeof value.id !== 'string' || !value.id ||
        typeof value.type !== 'string' || !supportedTypes.has(value.type) ||
        !record(value.position) || typeof value.position.x !== 'number' || !Number.isFinite(value.position.x) ||
        typeof value.position.y !== 'number' || !Number.isFinite(value.position.y) ||
        !record(value.data) || value.data.category !== supportedTypes.get(value.type) ||
        !Object.values(value.data).every(field =>
          field === null || typeof field === 'string' || typeof field === 'boolean' ||
          (typeof field === 'number' && Number.isFinite(field)))) {
      throw new Error('The file contains an invalid or unknown node.');
    }
    return { id: value.id, type: value.type, position: { x: value.position.x, y: value.position.y },
      data: { ...value.data, state: 'IDLE' } };
  });
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('The file contains duplicate node IDs.');

  const edges: Edge[] = graph.edges.map((value: unknown) => {
    if (!record(value) || typeof value.id !== 'string' || !value.id ||
        typeof value.source !== 'string' || !byId.has(value.source) ||
        typeof value.target !== 'string' || !byId.has(value.target) ||
        (value.sourceHandle != null && typeof value.sourceHandle !== 'string') ||
        (value.targetHandle != null && typeof value.targetHandle !== 'string')) {
      throw new Error('The file contains an invalid edge or an edge to a missing node.');
    }
    return { id: value.id, source: value.source, target: value.target, type: 'custom',
      sourceHandle: value.sourceHandle, targetHandle: value.targetHandle,
      data: studioEdgeData(byId.get(value.source)!, byId.get(value.target)!) };
  });
  if (new Set(edges.map(edge => edge.id)).size !== edges.length) throw new Error('The file contains duplicate edge IDs.');
  const incoming = new Map(nodes.map(node => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const error = connectionError(byId.get(edge.source)!, byId.get(edge.target)!, edge);
    if (error) throw new Error(error);
    incoming.set(edge.target, incoming.get(edge.target)! + 1);
    const targets = outgoing.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  }
  const ready = nodes.filter(node => incoming.get(node.id) === 0).map(node => node.id);
  for (const id of ready) {
    for (const target of outgoing.get(id) ?? []) {
      const remaining = incoming.get(target)! - 1;
      incoming.set(target, remaining);
      if (remaining === 0) ready.push(target);
    }
  }
  if (ready.length !== nodes.length) throw new Error('The file contains a cyclic connection.');

  let networks: StopLossGraph['networks'];
  if (graph.networks !== undefined) {
    const data = graph.networks;
    if (!record(data) || typeof data.originChainId !== 'number' || !Number.isSafeInteger(data.originChainId) ||
        typeof data.reactiveChainId !== 'number' || !Number.isSafeInteger(data.reactiveChainId) ||
        typeof data.destinationChainId !== 'number' || !Number.isSafeInteger(data.destinationChainId)) {
      throw new Error('The file contains invalid network IDs.');
    }
    networks = { originChainId: data.originChainId, reactiveChainId: data.reactiveChainId,
      destinationChainId: data.destinationChainId };
  }
  const metadata = record(graph.metadata) ? graph.metadata : undefined;
  return { nodes, edges, networks, name: typeof metadata?.name === 'string' ? metadata.name : undefined,
    description: typeof metadata?.description === 'string' ? metadata.description : undefined };
}
