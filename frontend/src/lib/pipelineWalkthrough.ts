import type { Edge, Node } from '@xyflow/react';
import type { PipelineIssue } from './pipelineLint';

export type WalkthroughStep = {
  nodes: Node[];
  edges: Edge[];
  issue?: PipelineIssue;
};

// Without a recorded per-node trace, only a single complete route is safe to replay.
export function hasSingleExecutionRoute(nodes: readonly Node[], edges: readonly Edge[], steps: readonly WalkthroughStep[]) {
  return steps.length === nodes.length && edges.length === steps.length - 1 &&
    steps.every((step, index) => step.nodes.length === 1 && step.edges.length === (index === 0 ? 0 : 1)) &&
    steps[0]?.nodes[0]?.data.category === 'trigger' && steps.at(-1)?.nodes[0]?.data.category === 'action';
}

export function planPipelineWalkthrough(
  nodes: readonly Node[], edges: readonly Edge[], issues: readonly PipelineIssue[],
): WalkthroughStep[] {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const incoming = new Map<string, Edge[]>();
  const outgoing = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }

  const remaining = new Map([...incoming].map(([id, links]) => [id, links.length]));
  const steps: WalkthroughStep[] = [];
  const visited = new Set<string>();
  let frontier = nodes.filter(node => node.data.category === 'trigger');
  while (frontier.length) {
    const issue = issues.find(error => frontier.some(node => error.nodeId === node.id));
    const arrivals = issue ? frontier.filter(node => node.id === issue.nodeId) : frontier;
    steps.push({ nodes: arrivals, edges: arrivals.flatMap(node =>
      (incoming.get(node.id) ?? []).filter(edge => visited.has(edge.source))), issue });
    if (issue) return steps;

    const next: Node[] = [];
    for (const node of frontier) {
      visited.add(node.id);
      for (const edge of outgoing.get(node.id) ?? []) {
        const count = remaining.get(edge.target)! - 1;
        remaining.set(edge.target, count);
        if (count === 0 && !visited.has(edge.target)) next.push(byId.get(edge.target)!);
      }
    }
    frontier = next.filter(node => !visited.has(node.id));
  }

  const issue = issues.find(error => error.nodeId && !visited.has(error.nodeId)) ?? issues[0];
  if (issue) {
    const node = issue.nodeId ? byId.get(issue.nodeId) : undefined;
    steps.push({ nodes: node ? [node] : [], edges: [], issue });
  }
  return steps;
}
