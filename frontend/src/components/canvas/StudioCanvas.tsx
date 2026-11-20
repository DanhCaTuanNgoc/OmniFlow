'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAccount } from 'wagmi';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { resolveStopLoss, type StopLossGraph } from '@omniflow/shared';
import { APP_CONFIG } from '@/lib/constants';
import { parsePipelineDraft } from '@/lib/pipelineDraft';

import {
  WatchDEXPriceNode,
  WatchTransfersNode,
  PeriodicCronNode,
  PriceThresholdGuardNode,
  CooldownGuardNode,
  BalanceThresholdNode,
  DEXSwapNode,
  EmergencySafeSweepNode,
  NotifyLogWebhookNode,
  LogicGateNode,
  CustomEventWatcherNode,
  PriceVelocityGuardNode,
} from './nodes';
import { CustomEdge } from './CustomEdge';
import { NodePalette, PALETTE_ITEMS } from './NodePalette';
import { InspectorPanel } from './InspectorPanel';
import { DeployModal } from './DeployModal';
import { SolidityPreviewModal } from './SolidityPreviewModal';
import { 
  Rocket, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle,
  Code2
} from 'lucide-react';

// STABLE DEFINITIONS OUTSIDE COMPONENT SCOPE (Mandatory for XYFlow performance)
const nodeTypes: NodeTypes = {
  watchDEXPrice: WatchDEXPriceNode,
  watchTransfers: WatchTransfersNode,
  periodicCron: PeriodicCronNode,
  priceThresholdGuard: PriceThresholdGuardNode,
  cooldownGuard: CooldownGuardNode,
  balanceThreshold: BalanceThresholdNode,
  dexSwap: DEXSwapNode,
  emergencySafeSweep: EmergencySafeSweepNode,
  notifyLogWebhook: NotifyLogWebhookNode,
  logicGate: LogicGateNode,
  customEventWatcher: CustomEventWatcherNode,
  priceVelocityGuard: PriceVelocityGuardNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};
const draftNodeTypes = new Map(PALETTE_ITEMS.map(item => [item.type, item.category]));

let idCounter = 10;
function getId(prefix: string, nodes: readonly Node[]) {
  let id = `${prefix}-${idCounter++}`;
  while (nodes.some(node => node.id === id)) id = `${prefix}-${idCounter++}`;
  return id;
}

function StudioCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [draftNetworks, setDraftNetworks] = useState<StopLossGraph['networks']>();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSolidityOpen, setIsSolidityOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Hydrate preset from query parameter ?recipe=...
  useEffect(() => {
    const rId = searchParams?.get('recipe');
    if (rId && RECIPE_PRESETS[rId]) {
      setActiveRecipeId(rId);
      setNodes(RECIPE_PRESETS[rId].nodes);
      setEdges(RECIPE_PRESETS[rId].edges);
      setDraftNetworks(undefined);
      setSelectedNodeId(null);
    }
  }, [searchParams, setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // DAG & Port Constraint Enforcement
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;
      if (sourceNode.id === targetNode.id) return false;

      const sourceCategory = sourceNode.data.category;
      const targetCategory = targetNode.data.category;

      // Reject invalid reverse flow
      if (sourceCategory === 'action') return false;
      if (targetCategory === 'trigger') return false;

      // Typed Port Constraint: Custom Event Watcher (Node #11) cannot connect to DEX Price conditions (#4 / #14)
      if (
        sourceNode.type === 'customEventWatcher' &&
        (targetNode.type === 'priceThresholdGuard' || targetNode.type === 'priceVelocityGuard')
      ) {
        setValidationWarning(
          'Custom Event Watcher (Node #11) emits raw topic logs and cannot connect to DEX Price Guards. Use Cooldown Guard (#5) or connect directly to Actions.'
        );
        setTimeout(() => setValidationWarning(null), 4000);
        return false;
      }

      // Check cycles (DAG enforcement)
      const hasCycle = (nodeId: string, visited = new Set<string>()): boolean => {
        if (visited.has(nodeId)) return true;
        visited.add(nodeId);
        const outEdges = edges.filter((e) => e.source === nodeId);
        for (const edge of outEdges) {
          if (hasCycle(edge.target, new Set(visited))) return true;
        }
        return false;
      };

      if (hasCycle(connection.target, new Set([connection.source]))) {
        setValidationWarning('Cyclic connections are strictly prohibited in DAG pipelines.');
        setTimeout(() => setValidationWarning(null), 3000);
        return false;
      }

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        const targetNode = nodes.find((n) => n.id === params.target);

        const isCrossChain = sourceNode?.data?.chainId === 1301;
        const color = isCrossChain
          ? '#c084fc'
          : sourceNode?.data.category === 'trigger'
          ? '#38bdf8'
          : sourceNode?.data.category === 'condition'
          ? '#fbbf24'
          : '#34d399';

        const crossChainLabel = isCrossChain ? 'Cross-Chain: Unichain -> Base' : undefined;

        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'custom',
              data: { isPulsing: true, color, crossChainLabel },
            },
            eds
          )
        );
      }
    },
    [isValidConnection, setEdges, nodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataStr = event.dataTransfer.getData('application/reactflow/data');

      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const parsedData = dataStr ? JSON.parse(dataStr) : {};

      const newNode: Node = {
        id: getId(parsedData.category || 'node', nodes),
        type,
        position,
        data: parsedData,
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [nodes, reactFlowInstance, setNodes]
  );

  const handleAddNodeFromPalette = (type: string, defaultData: Record<string, any>) => {
    const position = {
      x: 350 + Math.random() * 120,
      y: 200 + Math.random() * 120,
    };
    const newNode: Node = {
      id: getId(defaultData.category || 'node', nodes),
      type,
      position,
      data: defaultData,
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateNodeData = (id: string, updatedData: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      })
    );
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleResetGraph = () => {
    setNodes([]);
    setDraftNetworks(undefined);
    setEdges([]);
    setSelectedNodeId(null);
    setActiveRecipeId('');
  };

  const handleSelectPreset = (recipeKey: string) => {
    if (RECIPE_PRESETS[recipeKey]) {
      const preset = RECIPE_PRESETS[recipeKey];
      setActiveRecipeId(recipeKey);
      setNodes(preset.nodes);
      setEdges(preset.edges);
      setDraftNetworks(undefined);
      setSelectedNodeId(null);
    }
  };

  const handleExportGraph = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ nodes, edges, networks: draftNetworks }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'omniflow-pipeline.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 1_048_576) throw new Error('Choose a Studio JSON file smaller than 1 MB.');
      const draft = parsePipelineDraft(await file.text(), draftNodeTypes);
      if ((reactFlowInstance?.getNodes().length ?? nodes.length) &&
          !window.confirm('Replace the current canvas with this file?')) return;
      setActiveRecipeId('');
      setSelectedNodeId(null);
      setNodes(draft.nodes);
      setEdges(draft.edges);
      setDraftNetworks(draft.networks);
      setValidationWarning(null);
    } catch (error) {
      setValidationWarning(error instanceof Error ? error.message : 'Unable to read the Studio JSON file.');
    }
  };

  const handleOpenDeploy = () => {
    if (!isConnected) return;
    try {
      resolveStopLoss({ nodes, edges, networks: draftNetworks });
    } catch (error) {
      setValidationWarning(error instanceof Error ? error.message : 'Unable to validate this graph.');
      setTimeout(() => setValidationWarning(null), 4000);
      return;
    }
    setValidationWarning(null);
    setIsDeployOpen(true);
  };

  return (
    <div className="relative flex h-full min-h-[24rem] w-full overflow-hidden">
      <div id="studio-node-palette" className={`absolute inset-y-0 left-0 z-30 w-full max-w-[17rem] shrink-0 flex-col bg-[var(--ws-rail)] lg:relative lg:flex ${isPaletteOpen ? 'flex' : 'hidden'}`}>
        <div className="border-b border-[var(--ws-border)] p-2 lg:hidden">
          <button type="button" className="ws-button" onClick={() => setPaletteOpen(false)}>Close nodes</button>
        </div>
        <NodePalette onAddNode={(type, data) => {
          handleAddNodeFromPalette(type, data);
          setPaletteOpen(false);
        }} />
      </div>

      <div className="relative flex h-full min-w-0 flex-1 flex-col" ref={reactFlowWrapper}>
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" className="ws-button lg:hidden" aria-expanded={isPaletteOpen} aria-controls="studio-node-palette"
              onClick={() => setPaletteOpen(open => !open)}>Add nodes</button>
            <h1 className="truncate text-sm font-semibold">{RECIPE_PRESETS[activeRecipeId]?.title || 'Custom pipeline'}</h1>
            {nodes.length > 0 && <span className="ws-badge shrink-0">Unsaved</span>}
          </div>

          <div className="ws-actions">
            <select aria-label="Recipe preset" value={activeRecipeId} onChange={(event) => handleSelectPreset(event.target.value)}
              className="ws-button max-w-[11rem] bg-[var(--ws-panel)]">
              <option value="">Recipe preset</option>
              {Object.values(RECIPE_PRESETS).map(preset => (
                <option key={preset.id} value={preset.id}>{preset.title}{preset.id !== 'stop-loss' ? ' (draft)' : ''}</option>
              ))}
            </select>
            <button type="button" className="ws-button" onClick={() => setIsSolidityOpen(true)} disabled={!nodes.length}>
              <Code2 size={14} aria-hidden="true" /> Solidity
            </button>
            <button type="button" className="ws-button" onClick={handleResetGraph} disabled={!nodes.length}>
              <RotateCcw size={14} aria-hidden="true" /> Clear
            </button>
            <button type="button" className="ws-button" onClick={handleExportGraph} disabled={!nodes.length}>Export JSON</button>
            <label className="ws-button cursor-pointer focus-within:outline focus-within:outline-2">
              Import JSON
              <input type="file" className="sr-only" accept=".json,application/json" onChange={handleImportGraph} />
            </label>
            <button type="button" className="ws-button ws-button-primary" onClick={handleOpenDeploy} disabled={!isConnected || !nodes.length}>
              <Rocket size={14} aria-hidden="true" /> {isConnected ? 'Deploy' : 'Connect wallet to deploy'}
            </button>
          </div>
          {validationWarning && <p role="alert" className="flex w-full items-center gap-2 text-xs text-amber-200">
            <AlertTriangle size={14} aria-hidden="true" />{validationWarning}
          </p>}
        </div>

        <div className="relative min-h-0 flex-1 bg-[var(--ws-bg)]">
          {nodes.length === 0 && (
            <p className="pointer-events-none absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 text-center text-sm text-[var(--ws-muted)]">
              Add a trigger or choose a recipe to start.
            </p>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            isValidConnection={isValidConnection}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={1.5}
            defaultEdgeOptions={{ type: 'custom' }}
            className="w-full h-full"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.5}
              color="rgba(148, 163, 184, 0.20)"
            />
            <Controls className="!bg-[#0f111a]/90 !border-white/[0.08] !rounded-xl !shadow-2xl" />
            <MiniMap
              nodeColor={(node) => {
                if (node.data.category === 'trigger') return '#38bdf8';
                if (node.data.category === 'condition') return '#fbbf24';
                if (node.data.category === 'action') return '#34d399';
                return '#a855f7';
              }}
              maskColor="rgba(7, 8, 13, 0.75)"
              className="!bg-[#0f111a]/90 !border !border-white/10 !rounded-xl overflow-hidden shadow-lg"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right Node Inspector */}
      {selectedNode && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[20rem] shrink-0 lg:relative">
        <InspectorPanel
          selectedNode={selectedNode}
          onUpdateNodeData={handleUpdateNodeData}
          onDeleteNode={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
        </div>
      )}

      {/* Deploy Modal */}
      <DeployModal
        key={isConnected ? address : 'guest'}
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        graph={{ nodes, edges, networks: draftNetworks }}
      />

      {/* Solidity Preview Modal */}
      <SolidityPreviewModal
        isOpen={isSolidityOpen}
        onClose={() => setIsSolidityOpen(false)}
        nodes={nodes}
        edges={edges}
        networks={draftNetworks}
      />
    </div>
  );
}

export function StudioCanvas() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={<div className="w-full h-full bg-[#07080d]" />}>
        <StudioCanvasInner />
      </Suspense>
    </ReactFlowProvider>
  );
}
