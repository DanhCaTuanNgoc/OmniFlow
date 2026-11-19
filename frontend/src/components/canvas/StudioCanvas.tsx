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
import { APP_CONFIG } from '@/lib/constants';

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
import { NodePalette } from './NodePalette';
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

let idCounter = 10;
const getId = (prefix: string) => `${prefix}-${idCounter++}`;

function StudioCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { address, isConnected } = useAccount();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
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
        id: getId(parsedData.category || 'node'),
        type,
        position,
        data: parsedData,
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [reactFlowInstance, setNodes]
  );

  const handleAddNodeFromPalette = (type: string, defaultData: Record<string, any>) => {
    const position = {
      x: 350 + Math.random() * 120,
      y: 200 + Math.random() * 120,
    };
    const newNode: Node = {
      id: getId(defaultData.category || 'node'),
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
      setSelectedNodeId(null);
    }
  };

  const handleExportGraph = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'omniflow-pipeline.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenDeploy = () => {
    if (!isConnected) return;
    const hasTrigger = nodes.some((n) => n.data.category === 'trigger');
    const hasAction = nodes.some((n) => n.data.category === 'action');

    if (!hasTrigger || !hasAction) {
      setValidationWarning('Pipeline must contain at least 1 Trigger and 1 Action node.');
      setTimeout(() => setValidationWarning(null), 4000);
      return;
    }
    setIsDeployOpen(true);
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden select-none bg-[#07080d]">
      {/* Left Node Palette */}
      <NodePalette onAddNode={handleAddNodeFromPalette} />

      {/* Main XYFlow Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        {/* Studio Top Control Bar */}
        <div className="h-16 border-b border-white/[0.08] bg-[#000000]/85 backdrop-blur-md px-5 flex items-center justify-between z-10 font-sans transform-gpu">
          {/* Cluster 1: Left (Breadcrumb, Pipeline Title, Autosave, Preset Selector) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-white tracking-tight">
                  {RECIPE_PRESETS[activeRecipeId]?.title || 'Custom Pipeline'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  UNSAVED
                </span>
              </div>
            </div>

            {/* Recipe Preset Selector */}
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/10">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Preset:</span>
              <select
                value={activeRecipeId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-[#14151a] hover:bg-[#202126] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              >
                <option value="">Custom pipeline</option>
                {Object.values(RECIPE_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cluster 2: Center (Segmented View / Execution Switcher) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-[#12141c] rounded-xl border border-white/[0.08] text-xs">
            <button
              className="px-3 py-1 font-medium rounded-lg bg-white/10 text-white shadow-sm transition-colors cursor-pointer"
            >
              Graph Canvas
            </button>
            <button
              onClick={() => setIsSolidityOpen(true)}
              className="px-3 py-1 font-medium rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Solidity Preview</span>
            </button>
          </div>

          {/* Graph actions */}
          <div className="flex items-center gap-2.5">
            {validationWarning && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{validationWarning}</span>
              </div>
            )}

            <button
              onClick={handleResetGraph}
              className="py-1.5 px-3 rounded-lg border border-white/10 bg-[#14151a] hover:bg-[#202126] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear graph"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear</span>
            </button>

            <button type="button" onClick={handleExportGraph} disabled={nodes.length === 0}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 disabled:opacity-50">
              Export JSON
            </button>

            {/* Primary CTA: Institutional High-Contrast Button */}
            <button
              onClick={handleOpenDeploy}
              disabled={!isConnected}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-200 text-black shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Rocket className="w-3.5 h-3.5 fill-black" />
              <span>{isConnected ? 'Deploy Automation' : 'Connect Wallet to Deploy'}</span>
            </button>
          </div>
        </div>

        {/* Canvas Body (Explicit non-zero dimensions with Radial Spotlight) */}
        <div className="flex-1 w-full h-full relative">
          {/* Lớp hào quang nền nhẹ ở giữa Canvas giúp xóa cảm giác đen đặc */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.08),rgba(139,92,246,0.05)_40%,transparent_75%)]" />

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
        <InspectorPanel
          selectedNode={selectedNode}
          onUpdateNodeData={handleUpdateNodeData}
          onDeleteNode={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {/* Deploy Modal */}
      <DeployModal
        key={isConnected ? address : 'guest'}
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        graph={{ nodes, edges }}
      />

      {/* Solidity Preview Modal */}
      <SolidityPreviewModal
        isOpen={isSolidityOpen}
        onClose={() => setIsSolidityOpen(false)}
        nodes={nodes}
        edges={edges}
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
