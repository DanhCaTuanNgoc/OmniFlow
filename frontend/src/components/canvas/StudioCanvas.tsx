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
    <div className="flex h-full w-full relative overflow-hidden select-none bg-[#08050F]">
      {/* Left Node Palette */}
      <NodePalette onAddNode={handleAddNodeFromPalette} />

      {/* Main XYFlow Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        {/* Studio Top Control Bar */}
        <div className="h-16 border-b border-[#2E1E54]/60 bg-[#0D0819]/80 backdrop-blur-md px-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-violet" />
              <span className="font-bold text-sm text-white">
                Pipeline Studio
              </span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-purple-950/50 border border-purple-800/40 text-purple-300 font-medium tabular-nums">
              DAG Flow: {nodes.length} Nodes &bull; {edges.length} Edges
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {validationWarning && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{validationWarning}</span>
              </div>
            )}

            <button
              onClick={handleResetGraph}
              className="py-1.5 px-3.5 rounded-xl border border-purple-900/40 bg-[#150E28] hover:bg-[#1E1438] text-purple-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Reset Demo</span>
            </button>

            <button
              onClick={handleOpenDeploy}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Deploy Automation (1-Click)</span>
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
              color="#2E1E54"
            />
            <Controls className="!bg-[#110B1F] !border-[#2E1E54]/60 !rounded-xl !shadow-xl" />
            <MiniMap
              nodeColor={(node) => {
                if (node.data.category === 'trigger') return '#00E5FF';
                if (node.data.category === 'condition') return '#F59E0B';
                if (node.data.category === 'action') return '#10B981';
                return '#8B5CF6';
              }}
              maskColor="rgba(8, 5, 15, 0.85)"
              className="!border-[#2E1E54]/60 !rounded-xl !bg-[#110B1F]"
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
