'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { isPhaseTwoGraph, resolvePhaseTwo, resolveStopLoss, STOP_LOSS_TEMPLATE, type StopLossGraph } from '@omniflow/shared';
import { APP_CONFIG } from '@/lib/constants';
import { listBrowserDrafts, parsePipelineDraft, saveBrowserDraft, renameBrowserDraft, studioGraph } from '@/lib/pipelineDraft';
import { workspaceRequest } from '@/lib/workspaceSession';
import { useStudioHeaderStore } from '@/lib/studioHeaderStore';

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
  ArrowLeft,
  Rocket, 
  AlertTriangle,
  Code2,
  ShieldCheck,
  Plus,
  PanelLeftOpen,
  PanelLeftClose
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
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSolidityOpen, setIsSolidityOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [savedDraft, setSavedDraft] = useState<{ id: string; updatedAt: number }>();
  const [draftMessage, setDraftMessage] = useState<string>();
  const [draftBusy, setDraftBusy] = useState(false);
  const [pipelineName, setPipelineName] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const pipelineParam = searchParams.get('pipeline');
  const deploymentParam = searchParams.get('deployment');
  const localParam = searchParams.get('local');
  const isSnapshot = Boolean(deploymentParam && !savedDraft);
  const draftName = pipelineName.trim() || RECIPE_PRESETS[activeRecipeId]?.title || 'Custom pipeline';

  const { setStudioHeader, clearStudioHeader } = useStudioHeaderStore();

  const handleRenameFromHeader = useCallback((newName: string) => {
    setPipelineName(newName);
    setIsDirty(true);
    if (localParam) {
      renameBrowserDraft(localParam, newName);
    }
  }, [localParam]);

  // Synchronize active pipeline name and rename handler with top Workspace Header breadcrumb
  useEffect(() => {
    setStudioHeader({
      pipelineName: draftName,
      isEditable: !isSnapshot,
      onRename: handleRenameFromHeader,
    });
    return () => {
      clearStudioHeader();
    };
  }, [draftName, isSnapshot, handleRenameFromHeader, setStudioHeader, clearStudioHeader]);

  // Warn user before closing window/tab if there are unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSnapshot) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSnapshot]);

  // Hydrate preset from query parameter ?recipe=...
  useEffect(() => {
    const rId = searchParams?.get('recipe');
    if (rId && RECIPE_PRESETS[rId]) {
      setActiveRecipeId(rId);
      setNodes(RECIPE_PRESETS[rId].nodes);
      setEdges(RECIPE_PRESETS[rId].edges);
      setDraftNetworks(undefined);
      setSelectedNodeId(null);
      setIsDirty(false);
    }
  }, [searchParams, setNodes, setEdges]);

  useEffect(() => {
    if (!localParam) return;
    try {
      const saved = listBrowserDrafts().find(draft => draft.id === localParam);
      if (!saved) throw new Error('Browser draft not found.');
      const restored = parsePipelineDraft(JSON.stringify(saved.graph), draftNodeTypes);
      setNodes(restored.nodes);
      setEdges(restored.edges);
      setDraftNetworks(restored.networks);
      setPipelineName(saved.name);
      setIsDirty(false);
    } catch {
      setValidationWarning('The browser draft could not be opened. Import a valid Studio JSON file.');
    }
  }, [localParam, setNodes, setEdges]);

  // Auto-load wallet draft or deployment snapshot from query parameter
  useEffect(() => {
    if (!address || (!pipelineParam && !deploymentParam)) return;
    void openSavedGraph();
  }, [address, pipelineParam, deploymentParam]);

  async function openSavedGraph() {
    if (!address || (!pipelineParam && !deploymentParam)) return;
    setDraftBusy(true);
    setValidationWarning(null);
    try {
      const path = deploymentParam
        ? `/pipeline/deployments/${encodeURIComponent(deploymentParam)}`
        : `/pipeline/drafts/${encodeURIComponent(pipelineParam!)}`;
      const snapshot = await workspaceRequest<{ graph: { metadata: { name: string } }; id?: string; updatedAt?: number }>(address, path);
      const draft = parsePipelineDraft(JSON.stringify(snapshot.graph), draftNodeTypes);
      setNodes(draft.nodes);
      setEdges(draft.edges);
      setDraftNetworks(draft.networks);
      setSelectedNodeId(null);
      setPipelineName(snapshot.graph.metadata.name);
      setSavedDraft(snapshot.id && snapshot.updatedAt !== undefined ? { id: snapshot.id, updatedAt: snapshot.updatedAt } : undefined);
      setDraftMessage(deploymentParam ? 'Deployment snapshot opened. Save to create an editable draft.' : 'Saved draft opened.');
      setIsDirty(false);
    } catch (error) {
      setValidationWarning(error instanceof Error ? error.message : 'Unable to open the saved graph.');
    } finally {
      setDraftBusy(false);
    }
  }

  async function saveGraph() {
    setDraftBusy(true);
    setValidationWarning(null);
    try {
      const watcher = nodes.find(node => node.type === 'watchDEXPrice');
      const originChainId = watcher?.data.originChainId ?? watcher?.data.chainId;
      const graph = studioGraph(nodes, edges, draftNetworks ?? {
        ...STOP_LOSS_TEMPLATE.networks,
        originChainId: typeof originChainId === 'number' ? originChainId : STOP_LOSS_TEMPLATE.networks.originChainId,
      });
      if (isConnected && address) {
        const result = await workspaceRequest<{ id: string; updatedAt: number }>(address, '/pipeline/drafts', {
          method: 'POST', body: JSON.stringify({
            graph: { ...graph, metadata: { name: draftName, ownerAddress: address } }, revision: savedDraft,
          }),
        });
        setSavedDraft(result);
        setIsDirty(false);
        router.replace(`/workspace/studio?pipeline=${result.id}`, { scroll: false });
        setDraftMessage('Draft saved to your wallet workspace.');
      } else {
        const id = localParam ?? crypto.randomUUID();
        saveBrowserDraft(id, draftName, graph);
        setIsDirty(false);
        router.replace(`/workspace/studio?local=${id}`, { scroll: false });
        setDraftMessage('Draft saved in this browser.');
      }
    } catch (error) {
      setValidationWarning(error instanceof Error ? error.message : 'Unable to save the draft.');
    } finally {
      setDraftBusy(false);
    }
  }

  const handleCreateDraftFromSnapshot = async () => {
    if (draftBusy || nodes.length === 0) return;
    setDraftBusy(true);
    try {
      const v2Name = `${draftName} (Draft v2)`;
      const graph = studioGraph(nodes, edges, draftNetworks ?? {
        ...STOP_LOSS_TEMPLATE.networks,
      });
      if (isConnected && address) {
        const result = await workspaceRequest<{ id: string; updatedAt: number }>(address, '/pipeline/drafts', {
          method: 'POST',
          body: JSON.stringify({
            graph: { ...graph, metadata: { name: v2Name, ownerAddress: address } },
          }),
        });
        router.push(`/workspace/studio?pipeline=${result.id}`);
      } else {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
        saveBrowserDraft(newId, v2Name, graph);
        router.push(`/workspace/studio?local=${encodeURIComponent(newId)}`);
      }
    } catch (err) {
      setValidationWarning(err instanceof Error ? err.message : 'Unable to create editable draft.');
    } finally {
      setDraftBusy(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const phaseTwo = isPhaseTwoGraph({ nodes, edges });
  const crossChain = nodes.some(node => node.type === 'priceVelocityGuard');
  const priceGate = nodes.find(node => node.type === 'logicGate');
  const primaryGuard = priceGate && edges.find(edge => edge.target === priceGate.id && edge.targetHandle === 'signal-a');
  const supportsPriceVault = phaseTwo && nodes.every(node =>
    ['watchDEXPrice', 'priceThresholdGuard', 'priceVelocityGuard', 'logicGate', 'cooldownGuard', 'dexSwap'].includes(node.type ?? ''));
  const originPool = nodes.find(node => node.type === 'watchDEXPrice' &&
    (!priceGate || edges.some(edge => edge.source === node.id && edge.target === primaryGuard?.source)))?.data.pairAddress;

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      const hasMeaningfulChanges = changes.some((c: any) => c.type !== 'select' && c.type !== 'dimensions');
      if (hasMeaningfulChanges && !isSnapshot) setIsDirty(true);
    },
    [onNodesChange, isSnapshot]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const hasMeaningfulChanges = changes.some((c: any) => c.type !== 'select');
      if (hasMeaningfulChanges && !isSnapshot) setIsDirty(true);
    },
    [onEdgesChange, isSnapshot]
  );

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
        if (!isSnapshot) setIsDirty(true);
      }
    },
    [isValidConnection, setEdges, nodes, isSnapshot]
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
      if (!isSnapshot) setIsDirty(true);
    },
    [nodes, reactFlowInstance, setNodes, isSnapshot]
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
    if (!isSnapshot) setIsDirty(true);
  };

  const handleUpdateNodeData = (id: string, updatedData: Record<string, any>) => {
    if (typeof updatedData.originChainId === 'number'
      && nodes.filter(node => node.type === 'watchDEXPrice').length === 1
      && nodes.some(node => node.id === id && node.type === 'watchDEXPrice')) {
      setDraftNetworks({ ...STOP_LOSS_TEMPLATE.networks, originChainId: updatedData.originChainId });
    }
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updatedData },
          };
        }
        return node;
      })
    );
    if (!isSnapshot) setIsDirty(true);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (!isSnapshot) setIsDirty(true);
  };

  const handleOpenDeploy = () => {
    if (!isConnected) return;
    try {
      const graph = { nodes, edges, networks: draftNetworks };
      if (phaseTwo) {
        resolvePhaseTwo(graph);
        setValidationWarning('Phase 2 validation passed. Deployment remains disabled until the versioned Vault policy setup is available.');
        setTimeout(() => setValidationWarning(null), 6000);
        return;
      }
      resolveStopLoss(graph);
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
      {!isSnapshot && (
        <div
          id="studio-node-palette"
          className={`absolute inset-y-0 left-0 z-30 w-full max-w-[17.5rem] shrink-0 flex-col bg-[var(--ws-rail)] border-r border-[var(--ws-border)] transition-all duration-200 lg:relative ${
            isPaletteOpen ? 'flex' : 'hidden'
          }`}
        >
          <NodePalette
            onClose={() => setPaletteOpen(false)}
            onAddNode={(type, data) => {
              handleAddNodeFromPalette(type, data);
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setPaletteOpen(false);
              }
            }}
          />
        </div>
      )}

      <div className="relative flex h-full min-w-0 flex-1 flex-col" ref={reactFlowWrapper}>
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ws-border)] bg-[var(--ws-rail)] px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 cursor-pointer"
              onClick={() => {
                if (isDirty && !isSnapshot) {
                  setShowExitModal(true);
                } else {
                  router.push('/workspace/studio');
                }
              }}
              title="Back to pipeline list"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </button>

            {!isPaletteOpen && !isSnapshot && (
              <button
                type="button"
                className="ws-button inline-flex items-center gap-1.5 cursor-pointer text-xs"
                onClick={() => setPaletteOpen(true)}
                title="Open Node Catalog"
              >
                <PanelLeftOpen className="size-3.5 text-[var(--ws-accent)]" />
                <span>Node Catalog</span>
              </button>
            )}
          </div>

          <div className="ws-actions">
            <button
              type="button"
              className="ws-button"
              disabled={draftBusy || !nodes.length}
              onClick={() => void saveGraph()}
            >
              {isSnapshot ? 'Save a draft copy' : 'Save draft'}
            </button>
            <button
              type="button"
              className="ws-button"
              onClick={() => setIsSolidityOpen(true)}
              disabled={!nodes.length}
            >
              <Code2 size={14} aria-hidden="true" />
              <span>Solidity</span>
            </button>
            <button
              type="button"
              className="ws-button ws-button-primary"
              onClick={handleOpenDeploy}
              disabled={!isConnected || !nodes.length || isSnapshot}
            >
              <Rocket size={14} aria-hidden="true" />
              <span>{isConnected ? 'Deploy' : 'Connect wallet to deploy'}</span>
            </button>
          </div>
          {validationWarning && <p role="alert" className="flex w-full items-center gap-2 text-xs text-amber-200">
            <AlertTriangle size={14} aria-hidden="true" />{validationWarning}
          </p>}
          {draftMessage && <p role="status" className="w-full text-xs text-[var(--ws-muted)]">{draftMessage}</p>}
        </div>

        {/* Deployed Snapshot Banner (Section 7.1 & 7.2 of Operations Analysis) */}
        {isSnapshot && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-400 shrink-0" />
              <span>
                Viewing deployed on-chain snapshot (Read-Only). Live on Base Sepolia and Reactive Lasna.
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateDraftFromSnapshot()}
              disabled={draftBusy || !nodes.length}
              className="ws-button ws-button-primary text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              <span>Create Editable Draft (v2)</span>
            </button>
          </div>
        )}

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
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={isSnapshot ? undefined : onDrop}
            onDragOver={onDragOver}
            nodesDraggable={!isSnapshot}
            nodesConnectable={!isSnapshot}
            elementsSelectable={!isSnapshot}
            deleteKeyCode={isSnapshot ? null : undefined}
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
      {selectedNode && !isSnapshot && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[20rem] shrink-0 lg:relative">
        <InspectorPanel
          selectedNode={selectedNode}
          owner={isConnected ? address : undefined}
          phaseTwo={phaseTwo}
          supportsPriceVault={supportsPriceVault}
          crossChain={crossChain}
          originPool={originPool}
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
        graph={studioGraph(nodes, edges, draftNetworks)}
        workspacePipelineId={savedDraft?.id}
        name={draftName}
      />

      {/* Solidity Preview Modal */}
      <SolidityPreviewModal
        isOpen={isSolidityOpen}
        onClose={() => setIsSolidityOpen(false)}
        nodes={nodes}
        edges={edges}
        networks={draftNetworks}
      />

      {/* Unsaved Changes Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--ws-border)] bg-[var(--ws-panel)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Unsaved Changes</h3>
                <p className="text-xs text-[var(--ws-muted)]">You have unsaved edits in this pipeline.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If you leave now without saving, any newly placed nodes, modified parameters, or updated wiring will be lost.
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="ws-button w-full sm:w-auto"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  router.push('/workspace/studio');
                }}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors w-full sm:w-auto cursor-pointer"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={async () => {
                  await saveGraph();
                  setShowExitModal(false);
                  router.push('/workspace/studio');
                }}
                disabled={draftBusy}
                className="ws-button ws-button-primary w-full sm:w-auto"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudioCanvas() {
  const { address, isConnected } = useAccount();
  const owner = isConnected ? address : undefined;
  const [identity, setIdentity] = useState({ owner, version: 0 });
  if (identity.owner !== owner) {
    setIdentity({ owner, version: identity.version + 1 });
  }
  return (
    <ReactFlowProvider>
      <Suspense fallback={<div className="w-full h-full bg-[#07080d]" />}>
        <StudioCanvasInner key={`${owner ?? 'guest'}:${identity.version}`} />
      </Suspense>
    </ReactFlowProvider>
  );
}
