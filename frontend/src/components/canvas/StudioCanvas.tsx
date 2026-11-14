'use client';

import React, { useState, useCallback, useRef } from 'react';
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
} from './nodes';
import { CustomEdge } from './CustomEdge';
import { NodePalette } from './NodePalette';
import { InspectorPanel } from './InspectorPanel';
import { DeployModal } from './DeployModal';
import { 
  Rocket, 
  RotateCcw, 
  Sparkles, 
  Play, 
  CheckCircle,
  AlertTriangle 
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
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Initial Demo Graph: "Flash Crash Stop-Loss" (Ready to run for judges)
const INITIAL_NODES: Node[] = [
  {
    id: 'trigger-1',
    type: 'watchDEXPrice',
    position: { x: 50, y: 140 },
    data: {
      label: 'Watch DEX Price',
      category: 'trigger',
      state: 'LISTENING',
      pairLabel: 'ETH / USDC',
      dexRouter: 'Uniswap V2',
      chainId: 84532,
      pairAddress: '0x1234567890123456789012345678901234567890',
    },
  },
  {
    id: 'condition-1',
    type: 'priceThresholdGuard',
    position: { x: 400, y: 140 },
    data: {
      label: 'Price Threshold Guard',
      category: 'condition',
      state: 'CONFIGURED',
      operator: 'LESS_THAN_OR_EQUAL',
      thresholdPriceUSD: 1800,
    },
  },
  {
    id: 'condition-2',
    type: 'cooldownGuard',
    position: { x: 750, y: 140 },
    data: {
      label: 'Cooldown Rate-Limiter',
      category: 'condition',
      state: 'CONFIGURED',
      cooldownSeconds: 300,
      timeUnit: 'Minutes',
    },
  },
  {
    id: 'action-1',
    type: 'dexSwap',
    position: { x: 1100, y: 140 },
    data: {
      label: 'DEX Token Swap',
      category: 'action',
      state: 'CONFIGURED',
      fromToken: 'ETH',
      toToken: 'USDC',
      amountPercentage: 50,
      maxSlippagePercent: 1,
      actionVaultAddress: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'trigger-1',
    target: 'condition-1',
    type: 'custom',
    data: { isPulsing: true },
  },
  {
    id: 'e2-3',
    source: 'condition-1',
    target: 'condition-2',
    type: 'custom',
    data: { isPulsing: true },
  },
  {
    id: 'e3-4',
    source: 'condition-2',
    target: 'action-1',
    type: 'custom',
    data: { isPulsing: true },
  },
];

function StudioCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Selected node lookup
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Constrained Connection Validator (DAG & Port Grammar enforcement)
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // 1. Prevent self-connection
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      // 2. Cannot connect Action as source
      if (sourceNode.data.category === 'action') return false;

      // 3. Cannot connect Trigger as target
      if (targetNode.data.category === 'trigger') return false;

      return true;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (isValidConnection(params)) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'custom',
              data: { isPulsing: true },
            },
            eds
          )
        );
        setValidationWarning(null);
      } else {
        setValidationWarning('Invalid connection: Port grammar rules violated.');
        setTimeout(() => setValidationWarning(null), 3000);
      }
    },
    [isValidConnection, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Update selected node data
  const handleUpdateNodeData = useCallback(
    (id: string, newData: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, ...newData },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  // Drag & drop add node from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataStr = event.dataTransfer.getData('application/reactflow/data');

      if (!type || !reactFlowWrapper.current || !reactFlowInstance) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaultData = dataStr ? JSON.parse(dataStr) : { label: type };

      const newNode: Node = {
        id: `${type}-${Date.now().toString().slice(-4)}`,
        type,
        position,
        data: defaultData,
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [reactFlowInstance, setNodes]
  );

  // Add node by clicking palette item
  const handleAddNodeFromPalette = useCallback(
    (type: string, data: Record<string, any>) => {
      const newNode: Node = {
        id: `${type}-${Date.now().toString().slice(-4)}`,
        type,
        position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 150 },
        data,
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [setNodes]
  );

  // Reset to default demo graph
  const handleResetGraph = useCallback(() => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setSelectedNodeId(null);
    if (reactFlowInstance) {
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
    }
  }, [setNodes, setEdges, reactFlowInstance]);

  // Open deploy modal
  const handleOpenDeploy = () => {
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
    <div className="flex h-full w-full relative overflow-hidden select-none bg-[#070B12]">
      {/* Left Node Palette */}
      <NodePalette onAddNode={handleAddNodeFromPalette} />

      {/* Main XYFlow Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        {/* Studio Top Control Bar */}
        <div className="h-14 border-b border-slate-800 bg-[#0B1120]/80 backdrop-blur-md px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Pipeline Studio
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              DAG Flow: 4 Nodes &bull; 3 Edges
            </span>
          </div>

          <div className="flex items-center gap-2">
            {validationWarning && (
              <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {validationWarning}
              </div>
            )}

            <button
              onClick={handleResetGraph}
              className="py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>

            <button
              onClick={handleOpenDeploy}
              className="py-1.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
            >
              <Rocket className="w-3.5 h-3.5" />
              Deploy Automation (1-Click)
            </button>
          </div>
        </div>

        {/* Canvas Body (Explicit non-zero dimensions) */}
        <div className="flex-1 w-full h-full relative">
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
              gap={24}
              size={1.5}
              color="#1E293B"
            />
            <Controls className="!bg-[#0F172A] !border-slate-800" />
            <MiniMap
              nodeColor={(node) => {
                if (node.data.category === 'trigger') return '#00E5FF';
                if (node.data.category === 'condition') return '#F59E0B';
                if (node.data.category === 'action') return '#00E676';
                return '#A855F7';
              }}
              maskColor="rgba(7, 11, 18, 0.7)"
              className="!border-slate-800 !rounded-xl"
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
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        graph={{ nodes, edges }}
      />
    </div>
  );
}

export function StudioCanvas() {
  return (
    <ReactFlowProvider>
      <StudioCanvasInner />
    </ReactFlowProvider>
  );
}
