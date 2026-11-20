import type { Edge, Node } from '@xyflow/react';
import type { StopLossGraph } from '@omniflow/shared';

export function studioGraph(nodes: readonly Node[], edges: readonly Edge[], networks?: StopLossGraph['networks']) {
  return {
    nodes: nodes.map(({ id, type, position, data }) => {
      const { state: _state, ...fields } = data;
      return { id, type, position, data: fields };
    }),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) =>
      ({ id, source, target, sourceHandle: sourceHandle ?? null, targetHandle: targetHandle ?? null })),
    networks,
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
  const nodeIds = new Set(nodes.map(node => node.id));
  if (nodeIds.size !== nodes.length) throw new Error('The file contains duplicate node IDs.');

  const edges: Edge[] = graph.edges.map((value: unknown) => {
    if (!record(value) || typeof value.id !== 'string' || !value.id ||
        typeof value.source !== 'string' || !nodeIds.has(value.source) ||
        typeof value.target !== 'string' || !nodeIds.has(value.target) ||
        (value.sourceHandle != null && typeof value.sourceHandle !== 'string') ||
        (value.targetHandle != null && typeof value.targetHandle !== 'string')) {
      throw new Error('The file contains an invalid edge or an edge to a missing node.');
    }
    return { id: value.id, source: value.source, target: value.target, type: 'custom',
      sourceHandle: value.sourceHandle, targetHandle: value.targetHandle, data: { isPulsing: false } };
  });
  if (new Set(edges.map(edge => edge.id)).size !== edges.length) throw new Error('The file contains duplicate edge IDs.');

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
  return { nodes, edges, networks };
}
