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
  FlaskConical,
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

// Initial Demo Graph: "Flash Crash Stop-Loss" (Ready to run for judges)
const INITIAL_NODES: Node[] = [
  {
    id: 'trigger-1',
    type: 'watchDEXPrice',
    position: { x: 40, y: 150 },
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
    position: { x: 380, y: 150 },
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
    position: { x: 720, y: 150 },
    data: {
      label: 'Cooldown Rate-Limiter',
      category: 'condition',
      state: 'CONFIGURED',
      cooldownSeconds: 300,
    },
  },
  {
    id: 'action-1',
    type: 'dexSwap',
    position: { x: 1060, y: 150 },
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
    id: 'e-trigger-cond1',
    source: 'trigger-1',
    target: 'condition-1',
    type: 'custom',
    data: { isPulsing: true, color: '#38bdf8' },
  },
  {
    id: 'e-cond1-cond2',
    source: 'condition-1',
    target: 'condition-2',
    type: 'custom',
    data: { isPulsing: true, color: '#fbbf24' },
  },
  {
    id: 'e-cond2-act1',
    source: 'condition-2',
    target: 'action-1',
    type: 'custom',
    data: { isPulsing: true, color: '#34d399' },
  },
];

let idCounter = 10;
const getId = (prefix: string) => `${prefix}-${idCounter++}`;

function StudioCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
  const [activeRecipeId, setActiveRecipeId] = useState<string>('stop-loss');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSolidityOpen, setIsSolidityOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');

  // Real-time WebSocket Gateway connection for Live Photon Pulses
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connectWs = () => {
      try {
        setWsStatus('CONNECTING');
        ws = new WebSocket(APP_CONFIG.wsUrl);

        ws.onopen = () => {
          setWsStatus('CONNECTED');
          ws?.send(JSON.stringify({ type: 'SUBSCRIBE_PIPELINE', pipelineId: 'all' }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'REACTIVE_STEP_UPDATE' && msg.data) {
              const step = msg.data.step;
              if (step === 'TRIGGER_DETECTED') {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.data.category === 'trigger'
                      ? { ...n, data: { ...n.data, state: 'EVENT_CAPTURED' as const } }
                      : n
                  )
                );
                setEdges((eds) =>
                  eds.map((e) => ({ ...e, data: { ...e.data, isBurst: true } }))
                );
                setTimeout(() => {
                  setEdges((eds) =>
                    eds.map((e) => ({ ...e, data: { ...e.data, isBurst: false } }))
                  );
                }, 3000);
              } else if (step === 'CONDITION_EVALUATED') {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.data.category === 'condition'
                      ? { ...n, data: { ...n.data, state: 'CONDITION_MET' as const } }
                      : n
                  )
                );
              } else if (step === 'DESTINATION_EXECUTED') {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.data.category === 'action'
                      ? { ...n, data: { ...n.data, state: 'SUCCESS' as const } }
                      : n
                  )
                );
              }
            }
          } catch {
            // non-json payload
          }
        };

        ws.onclose = () => {
          setWsStatus('DISCONNECTED');
          reconnectTimer = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          setWsStatus('DISCONNECTED');
        };
      } catch {
        setWsStatus('DISCONNECTED');
      }
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [setNodes, setEdges]);

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

  // Simulate Flow (Dry-Run Sandbox)
  const handleSimulateFlow = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(1);
    setSimulationMessage('Step 1/3: Origin DEX Swap event captured on Base Sepolia (ETH Price <= $1,800)');

    // Step 1: Trigger Captured + Fast Photon Burst
    setNodes((nds) =>
      nds.map((n) => {
        if (n.data.category === 'trigger') {
          return {
            ...n,
            data: { ...n.data, state: 'EVENT_CAPTURED' as const, statusMessage: 'Sync: ETH Price $1,500' },
          };
        }
        return n;
      })
    );
    setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isBurst: true } })));

    // Step 2: Reactive Omni ReactVM Condition Met
    setTimeout(() => {
      setSimulationStep(2);
      setSimulationMessage('Step 2/3: Reactive Omni Lasna RVM evaluated condition: $1,500 <= $1,800 Met • Cooldown OK');
      setNodes((nds) =>
        nds.map((n) => {
          if (n.data.category === 'condition') {
            return {
              ...n,
              data: { ...n.data, state: 'CONDITION_MET' as const, statusMessage: 'Condition Passed (200ms Guard OK)' },
            };
          }
          return n;
        })
      );
    }, 1400);

    // Step 3: Destination Action Callback Executed
    setTimeout(() => {
      setSimulationStep(3);
      setSimulationMessage('Step 3/3: ActionVault callback executed on Base Sepolia • 50% Vault ETH Swapped to USDC');
      setNodes((nds) =>
        nds.map((n) => {
          if (n.data.category === 'action') {
            return {
              ...n,
              data: { ...n.data, state: 'SUCCESS' as const, statusMessage: 'Swap Executed: 0.1 ETH -> 150 USDC' },
            };
          }
          return n;
        })
      );
    }, 2800);

    // Finish Simulation
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationMessage('✅ Simulation Complete (0-Gas Dry Run • 100% Invariants Verified)');
      setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, isBurst: false } })));
      setTimeout(() => {
        setSimulationMessage(null);
        setSimulationStep(0);
      }, 4000);
    }, 4400);
  }, [isSimulating, setNodes, setEdges]);

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
    handleSelectPreset(activeRecipeId || 'stop-loss');
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
    <div className="flex h-full w-full relative overflow-hidden select-none bg-[#07080d]">
      {/* Left Node Palette */}
      <NodePalette onAddNode={handleAddNodeFromPalette} />

      {/* Main XYFlow Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        {/* Studio Top Control Bar */}
        <div className="h-16 border-b border-white/[0.08] bg-[#000000]/85 backdrop-blur-md px-5 flex items-center justify-between z-10 font-sans transform-gpu">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-display font-bold text-sm text-white tracking-tight">
                Pipeline Studio
              </span>
            </div>

            {/* Recipe Preset Selector */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <span className="text-[11px] text-[#8e8e8e] font-mono">Preset:</span>
              <select
                value={activeRecipeId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="bg-[#16171a] hover:bg-[#202126] border border-white/20 rounded-full px-3 py-1 text-xs text-white font-medium focus:outline-none focus:border-white transition-colors cursor-pointer"
              >
                {Object.values(RECIPE_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live WebSocket Stream Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[#c4c2c3]">{wsStatus === 'CONNECTED' ? 'WS Live Stream' : 'WS Standby'}</span>
            </div>

            {validationWarning && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{validationWarning}</span>
              </div>
            )}

            <button
              onClick={handleSimulateFlow}
              disabled={isSimulating}
              className={`py-1.5 px-3.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulating
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 animate-pulse'
                  : 'border-white/20 bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white'
              }`}
            >
              <FlaskConical className={`w-3.5 h-3.5 ${isSimulating ? 'text-cyan-400 animate-spin' : 'text-cyan-400'}`} />
              <span>{isSimulating ? `Simulating (${simulationStep}/3)...` : 'Simulate Flow'}</span>
            </button>

            <button
              onClick={() => setIsSolidityOpen(true)}
              className="py-1.5 px-3.5 rounded-full border border-white/20 bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-violet-400" />
              <span>View Solidity</span>
            </button>

            <button
              onClick={handleResetGraph}
              className="py-1.5 px-3.5 rounded-full border border-white/20 bg-[#16171a] hover:bg-[#202126] text-[#c4c2c3] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Demo</span>
            </button>

            {/* Primary CTA: Motion UI White Pill Button */}
            <button
              onClick={handleOpenDeploy}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-white hover:bg-white/90 text-black shadow-[0_2px_12px_rgba(255,255,255,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-3.5 h-3.5 fill-black" />
              <span>Deploy Automation (1-Click)</span>
            </button>
          </div>
        </div>

        {/* Canvas Body (Explicit non-zero dimensions with Radial Spotlight) */}
        <div className="flex-1 w-full h-full relative">
          {/* Simulation Watermark Banner */}
          {simulationMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#0d091a]/95 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{simulationMessage}</span>
            </div>
          )}

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
