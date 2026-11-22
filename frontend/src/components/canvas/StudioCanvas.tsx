'use client';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
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
import { isPhaseTwoGraph, resolvePhaseTwo, resolveStopLoss, STOP_LOSS_TEMPLATE, StopLossValidationError, type StopLossGraph } from '@omniflow/shared';
import { APP_CONFIG } from '@/lib/constants';
import { listBrowserDrafts, parsePipelineDraft, saveBrowserDraft, renameBrowserDraft, studioGraph, studioEdgeData, exportDraftJson, connectionError } from '@/lib/pipelineDraft';
import { planPipelineWalkthrough } from '@/lib/pipelineWalkthrough';
import { WorkspaceSignInRequired, workspaceRequest } from '@/lib/workspaceSession';
import { useWorkspaceSignedIn } from '@/components/common/WorkspaceSignIn';
import { PipelineOpenState } from '@/components/studio/PipelineOpenState';
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
import { SnapshotExecutionPulse } from './SnapshotExecutionPulse';
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
  PanelLeftClose,
  RotateCcw,
  Download,
  Upload,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import { lintPipelineGraph, autoLayoutGraph, type PipelineIssue } from '@/lib/pipelineLint';

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

const walkthroughLabels = {
  sandbox: 'Sandbox',
  preflight: 'Deploy checks',
  snapshot: 'Snapshot preview',
  execution: 'Confirmed execution',
};

type WalkthroughMode = keyof typeof walkthroughLabels;
type Walkthrough = {
  mode: WalkthroughMode;
  message: string;
  running: boolean;
  nodeIds: ReadonlySet<string>;
  edgeIds?: ReadonlySet<string>;
  issue?: PipelineIssue;
};

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
  const nodesInitialized = useNodesInitialized();
  const [draftNetworks, setDraftNetworks] = useState<StopLossGraph['networks']>();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSolidityOpen, setIsSolidityOpen] = useState(false);
  const [walkthrough, setWalkthrough] = useState<Walkthrough>();
  const walkthroughTimer = useRef<ReturnType<typeof setTimeout>>();
  const autoWalkthroughStarted = useRef(false);
  const [isDeployedSnapshot, setIsDeployedSnapshot] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{ id: string; updatedAt: number }>();
  const [draftMessage, setDraftMessage] = useState<string>();
  const [draftBusy, setDraftBusy] = useState(false);
  const [pipelineName, setPipelineName] = useState('');
  const [description, setDescription] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [signInRequired, setSignInRequired] = useState(false);
  const signedIn = useWorkspaceSignedIn(isConnected ? address : undefined);
  const active = useRef(false);
  const editVersion = useRef(0);
  useLayoutEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const stopWalkthrough = useCallback(() => {
    clearTimeout(walkthroughTimer.current);
    walkthroughTimer.current = undefined;
    setWalkthrough(undefined);
  }, []);
  const markDirty = useCallback(() => {
    editVersion.current++;
    stopWalkthrough();
    setIsDirty(true);
  }, [stopWalkthrough]);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const deploymentParam = searchParams.get('deployment');
  const pipelineParam = searchParams.has('deployment') ? null : searchParams.get('pipeline');
  const localParam = searchParams.has('deployment') || searchParams.has('pipeline') ? null : searchParams.get('local');
  const recipeParam = ['deployment', 'pipeline', 'local'].some(key => searchParams.has(key))
    ? null : searchParams.get('recipe');
  const isSnapshot = Boolean(deploymentParam);
  const draftName = pipelineName.trim() || RECIPE_PRESETS[activeRecipeId]?.title || 'Custom pipeline';
  const activeNodeIds = walkthrough?.nodeIds;
  const activeEdgeIds = walkthrough?.edgeIds;
  const activeIssue = walkthrough?.issue;
  const displayedEdges = useMemo(() => activeEdgeIds
    ? edges.map(edge => activeEdgeIds.has(edge.id) ? { ...edge, data: { ...edge.data, isBurst: true } } : edge)
    : edges, [activeEdgeIds, edges]);

  const lintResult = useMemo(() => lintPipelineGraph(nodes, edges), [nodes, edges]);
  const annotatedNodes = useMemo(() => {
    return nodes.map((n) => {
      const issues = lintResult.nodeIssues.get(n.id);
      const isOrphan = lintResult.isOrphanMap.get(n.id) ?? false;
      const firstWarning = activeIssue?.nodeId === n.id ? activeIssue.message : issues?.[0]?.message ?? null;
      return {
        ...n,
        data: {
          ...n.data,
          warning: firstWarning,
          isOrphan,
          state: activeNodeIds?.has(n.id) && !activeIssue ? 'CHECKING' : n.data.state,
        },
      };
    });
  }, [nodes, lintResult, activeNodeIds, activeIssue]);

  const handleAutoLayout = useCallback(() => {
    if (isSnapshot) return;
    const arranged = autoLayoutGraph(nodes);
    setNodes(arranged);
    markDirty();
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [nodes, isSnapshot, setNodes, markDirty, reactFlowInstance]);

  const { setStudioHeader, clearStudioHeader } = useStudioHeaderStore();

  const handleRenameFromHeader = useCallback((newName: string) => {
    setPipelineName(newName);
    markDirty();
    if (localParam) {
      renameBrowserDraft(localParam, newName);
    }
  }, [localParam, markDirty]);

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
  }, [isDirty, isSnapshot, markDirty]);

  // Hydrate preset from query parameter ?recipe=...
  useEffect(() => {
    const rId = recipeParam;
    if (rId && RECIPE_PRESETS[rId]) {
      setActiveRecipeId(rId);
      setNodes(RECIPE_PRESETS[rId].nodes);
      setEdges(RECIPE_PRESETS[rId].edges);
      setDraftNetworks(undefined);
      setSelectedNodeId(null);
      setIsDirty(false);
    }
  }, [recipeParam, setNodes, setEdges]);

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
      setDescription(saved.description ?? restored.description);
      setLoaded(true);
      setIsDirty(false);
    } catch {
      setLoadError('The browser draft could not be opened.');
    }
  }, [localParam, setNodes, setEdges]);

  useEffect(() => {
    if (loaded || !address || (!pipelineParam && !deploymentParam)) return;
    const controller = new AbortController();
    const resource = deploymentParam ? 'deployments' : 'drafts';
    const id = deploymentParam ?? pipelineParam!;
    void workspaceRequest<{ graph: unknown; status?: string; id?: string; updatedAt?: number }>(
      address, '/pipeline/' + resource + '/' + encodeURIComponent(id), { signal: controller.signal, sessionOnly: true },
    ).then(snapshot => {
      if (controller.signal.aborted || !active.current) return;
      setSignInRequired(false);
      setLoadError(undefined);
      const draft = parsePipelineDraft(JSON.stringify(snapshot.graph), draftNodeTypes);
      setNodes(draft.nodes);
      setEdges(draft.edges);
      setDraftNetworks(draft.networks);
      setPipelineName(draft.name ?? '');
      setDescription(draft.description);
      setIsDeployedSnapshot(Boolean(deploymentParam) && snapshot.status === 'deployed');
      if (!deploymentParam && snapshot.id && snapshot.updatedAt !== undefined) {
        setSavedDraft({ id: snapshot.id, updatedAt: snapshot.updatedAt });
      }
      setLoaded(true);
    }).catch(error => {
      if (controller.signal.aborted || !active.current) return;
      const needsSignIn = error instanceof WorkspaceSignInRequired;
      setSignInRequired(needsSignIn);
      setLoadError(needsSignIn ? undefined : error instanceof Error ? error.message : 'Unable to load pipeline.');
    });
    return () => controller.abort();
  }, [address, pipelineParam, deploymentParam, setNodes, setEdges, signedIn, loaded]);

  async function saveGraph(leave = false) {
    if (isSnapshot || draftBusy) return false;
    const version = editVersion.current;
    setDraftBusy(true);
    setValidationWarning(null);
    try {
      const graph = studioGraph(nodes, edges, draftNetworks);
      if (isConnected && address) {
        const result = await workspaceRequest<{ id: string; updatedAt: number }>(address, '/pipeline/drafts', {
          method: 'POST', body: JSON.stringify({
            graph: { ...graph, metadata: { name: draftName, ownerAddress: address, description } }, revision: savedDraft,
          }),
        });
        if (!active.current) return false;
        setSavedDraft(result);
        if (!leave && editVersion.current === version && pipelineParam !== result.id) {
          router.replace('/workspace/studio?pipeline=' + result.id, { scroll: false });
        }
        setDraftMessage('Draft saved to your wallet workspace.');
      } else {
        const id = localParam ?? crypto.randomUUID();
        saveBrowserDraft(id, draftName, graph, description);
        if (!leave && localParam !== id) router.replace('/workspace/studio?local=' + id, { scroll: false });
        setDraftMessage('Draft saved in this browser.');
      }
      const current = editVersion.current === version;
      if (current) setIsDirty(false);
      return current;
    } catch (error) {
      if (active.current) setValidationWarning(error instanceof Error ? error.message : 'Unable to save the draft.');
      return false;
    } finally {
      setDraftBusy(false);
    }
  }

  const handleCreateDraftFromSnapshot = async () => {
    if (!isSnapshot || draftBusy || nodes.length === 0) return;
    setDraftBusy(true);
    try {
      const copyName = `${draftName} (Copy)`;
      const graph = studioGraph(nodes, edges, draftNetworks);
      if (isConnected && address) {
        const result = await workspaceRequest<{ id: string; updatedAt: number }>(address, '/pipeline/drafts', {
          method: 'POST',
          body: JSON.stringify({
            graph: { ...graph, metadata: { name: copyName, ownerAddress: address, description } },
          }),
        });
        if (active.current) router.push(`/workspace/studio?pipeline=${result.id}`);
      } else {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `draft-${Date.now()}`;
        saveBrowserDraft(newId, copyName, graph, description);
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
      if (hasMeaningfulChanges && !isSnapshot) markDirty();
    },
    [onNodesChange, isSnapshot, markDirty]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
      const hasMeaningfulChanges = changes.some((c: any) => c.type !== 'select');
      if (hasMeaningfulChanges && !isSnapshot) markDirty();
    },
    [onEdgesChange, isSnapshot, markDirty]
  );

  // DAG & Port Constraint Enforcement
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;
      if (sourceNode.id === targetNode.id) return false;

      const error = connectionError(sourceNode, targetNode, connection);
      if (error) {
        setValidationWarning(error);
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
        if (!sourceNode || !targetNode) return;

        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'custom',
              data: studioEdgeData(sourceNode, targetNode),
            },
            eds
          )
        );
        if (!isSnapshot) markDirty();
      }
    },
    [isValidConnection, setEdges, nodes, isSnapshot, markDirty]
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
      if (!isSnapshot) markDirty();
    },
    [nodes, reactFlowInstance, setNodes, isSnapshot, markDirty]
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
    if (!isSnapshot) markDirty();
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
    if (!isSnapshot) markDirty();
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    if (!isSnapshot) markDirty();
  };

  useEffect(() => {
    return () => clearTimeout(walkthroughTimer.current);
  }, []);

  // Clear Graph (Reset Pipeline)
  const handleResetGraph = useCallback(() => {
    if (!nodes.length || isSnapshot) return;
    if (window.confirm('Clear all nodes and connections from the pipeline?')) {
      markDirty();
      setNodes([]);
      setEdges([]);
      setDraftNetworks(undefined);
      setSelectedNodeId(null);
      setActiveRecipeId('');
      setDraftMessage('Pipeline cleared.');
    }
  }, [nodes.length, isSnapshot, setNodes, setEdges, markDirty]);

  // Export Pipeline to JSON
  const handleExportGraph = useCallback(() => {
    const graph = studioGraph(nodes, edges, draftNetworks);
    exportDraftJson(draftName, {
      ...graph,
      metadata: {
        name: draftName,
        description,
        exportedAt: new Date().toISOString(),
        ownerAddress: address ?? undefined,
      },
    });
    setDraftMessage('Pipeline configuration exported to JSON.');
  }, [nodes, edges, draftNetworks, draftName, address, description]);

  // Import Pipeline from JSON
  const handleImportGraph = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || isSnapshot) return;

      try {
        if (file.size > 1_048_576) throw new Error('Choose a Studio JSON file smaller than 1 MB.');
        const text = await file.text();
        if (!active.current) return;
        const draft = parsePipelineDraft(text, draftNodeTypes);

        if (nodes.length > 0 && !window.confirm('Importing will replace the current pipeline. Continue?')) {
          return;
        }

        markDirty();
        if (draft.name?.trim()) setPipelineName(draft.name);
        if (draft.description !== undefined) setDescription(draft.description);
        setNodes(draft.nodes);
        setEdges(draft.edges);
        setDraftNetworks(draft.networks);
        setSelectedNodeId(null);
        setActiveRecipeId('');
        setValidationWarning(null);
        setDraftMessage('Pipeline imported successfully.');
      } catch (error) {
        setValidationWarning(error instanceof Error ? error.message : 'Unable to import JSON file.');
        setTimeout(() => setValidationWarning(null), 4000);
      }
    },
    [nodes.length, isSnapshot, setNodes, setEdges, markDirty]
  );

  const startWalkthrough = useCallback((mode: WalkthroughMode, preflightIssue?: PipelineIssue) => {
    stopWalkthrough();
    const checkConfiguration = mode === 'sandbox' || mode === 'preflight';
    const issues = checkConfiguration ? [...lintResult.errors] : [];
    if (preflightIssue) issues.push(preflightIssue);
    const steps = planPipelineWalkthrough(nodes, edges, issues);
    if (!steps.length) return;

    setValidationWarning(null);
    const label = walkthroughLabels[mode];
    const schedule = (run: () => void, delay: number) => {
      walkthroughTimer.current = setTimeout(run, delay);
    };

    function showStep(index: number) {
      const step = steps[index];
      if (!step) {
        if (mode === 'preflight') {
          stopWalkthrough();
          setIsDeployOpen(true);
          return;
        }
        setWalkthrough({
          mode, running: false, nodeIds: new Set(),
          message: mode === 'execution' ? 'Execution confirmed.' : label + ' complete.',
        });
        schedule(stopWalkthrough, 1500);
        return;
      }

      const nodeIds = new Set(step.nodes.map(node => node.id));
      const names = step.nodes.map(node => String(node.data.label || node.type || node.id)).join(', ');
      const arrive = () => {
        if (step.issue) {
          walkthroughTimer.current = undefined;
          setShowDiagnostics(checkConfiguration && lintResult.errors.length > 0);
          setWalkthrough({
            mode, nodeIds, running: false, issue: step.issue,
            message: (names ? label + ' stopped at ' + names : label + ' blocked') + '. ' + step.issue.message,
          });
          return;
        }
        setWalkthrough({ mode, nodeIds, running: true, message: label + ' · ' + names });
        schedule(() => showStep(index + 1), 450);
      };

      if (step.edges.length) {
        setWalkthrough({
          mode, running: true, nodeIds: new Set(), message: label + ' · ' + names,
          edgeIds: new Set(step.edges.map(edge => edge.id)),
        });
        schedule(arrive, 800);
      } else {
        arrive();
      }
    }

    showStep(0);
  }, [edges, lintResult.errors, nodes, stopWalkthrough]);

  useEffect(() => {
    if (!isDeployedSnapshot || !loaded || !nodesInitialized || autoWalkthroughStarted.current) return;
    autoWalkthroughStarted.current = true;
    startWalkthrough('snapshot');
  }, [isDeployedSnapshot, loaded, nodesInitialized, startWalkthrough]);

  const handleConfirmedExecution = useCallback(() => {
    if (!walkthroughTimer.current) startWalkthrough('execution');
  }, [startWalkthrough]);

  const handleOpenDeploy = () => {
    if (isSnapshot || !isConnected || walkthrough?.running) return;

    let issue: PipelineIssue | undefined;
    const graph = { nodes, edges, networks: draftNetworks };
    try {
      if (phaseTwo) {
        resolvePhaseTwo(graph);
        issue = { id: 'phase-two', severity: 'error', message: 'Phase 2 deployment requires the versioned Vault policy setup.' };
      } else {
        resolveStopLoss(graph);
      }
    } catch (error) {
      issue = {
        id: 'deployment-configuration', severity: 'error',
        nodeId: error instanceof StopLossValidationError ? error.nodeId : undefined,
        message: error instanceof Error ? error.message : 'Unable to validate this graph.',
      };
    }
    if (!issue && (!savedDraft || isDirty)) {
      issue = { id: 'draft-required', severity: 'error', message: 'Save this revision to your wallet workspace before deploying.' };
    }
    startWalkthrough('preflight', issue);
  };

  if ((pipelineParam || deploymentParam || localParam) && !loaded) {
    if (signInRequired) return <PipelineOpenState state="sign-in" />;
    if (loadError) return <PipelineOpenState state="error" message={loadError} />;
    return <PipelineOpenState />;
  }

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

      <div className="relative flex h-full min-w-0 flex-1 flex-col">
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

          <div className="ws-actions flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Clear Board */}
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 cursor-pointer text-xs"
              onClick={handleResetGraph}
              disabled={!nodes.length || isSnapshot}
              title="Clear all nodes and connections from pipeline"
            >
              <RotateCcw className="size-3.5 text-zinc-400" />
              <span>Clear</span>
            </button>

            {/* Import JSON */}
            <label
              className={`ws-button inline-flex items-center gap-1.5 text-xs ${
                isSnapshot ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              }`}
              title="Import pipeline structure from JSON file"
            >
              <Upload className="size-3.5 text-zinc-400" />
              <span>Import</span>
              <input
                type="file"
                className="sr-only"
                accept=".json,application/json"
                onChange={(e) => void handleImportGraph(e)}
                disabled={isSnapshot}
              />
            </label>

            {/* Export JSON */}
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 cursor-pointer text-xs"
              onClick={handleExportGraph}
              title="Export pipeline structure to JSON file"
            >
              <Download className="size-3.5 text-zinc-400" />
              <span>Export</span>
            </button>

            {/* Auto-Arrange Layout */}
            {/* <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white"
              onClick={handleAutoLayout}
              disabled={!nodes.length || isSnapshot}
              title="Automatically arrange nodes cleanly into columns"
            >
              <LayoutGrid className="size-3.5 text-zinc-400" aria-hidden="true" />
              <span className="hidden sm:inline">Auto-Arrange</span>
            </button> */}

            {/* Pipeline Diagnostics Pill */}
            {nodes.length > 0 && (
              lintResult.allIssues.length === 0 ? (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="size-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Pipeline Valid</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDiagnostics((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="Click to view all configuration issues"
                >
                  <AlertTriangle className="size-3.5 text-amber-400" aria-hidden="true" />
                  <span>{lintResult.allIssues.length} {lintResult.allIssues.length === 1 ? 'Issue' : 'Issues'}</span>
                  {showDiagnostics ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              )
            )}

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Save draft */}
            {!isSnapshot && (
              <button
                type="button"
                className="ws-button text-xs"
                disabled={draftBusy}
                onClick={() => void saveGraph()}
              >
                Save draft
              </button>
            )}

            {/* View Solidity */}
            <button
              type="button"
              className="ws-button inline-flex items-center gap-1.5 text-xs"
              onClick={() => setIsSolidityOpen(true)}
              disabled={!nodes.length}
            >
              <Code2 className="size-3.5 text-violet-400" aria-hidden="true" />
              <span>Solidity</span>
            </button>

            {/* Simulate Flow (Dry-Run) */}
            <button
              type="button"
              onClick={() => startWalkthrough('sandbox')}
              disabled={walkthrough?.running || !nodes.length}
              className={`ws-button inline-flex items-center gap-1.5 text-xs cursor-pointer transition-all ${
                walkthrough?.running && walkthrough.mode === 'sandbox'
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
              title="Simulate end-to-end event execution without spending gas"
            >
              <FlaskConical aria-hidden="true" className="size-3.5" />
              <span>{walkthrough?.running && walkthrough.mode === 'sandbox' ? 'Simulating…' : 'Simulate Flow'}</span>
            </button>

            {/* Deploy */}
            {!isSnapshot && (
              <button
                type="button"
                className="ws-button ws-button-primary inline-flex items-center gap-1.5 text-xs"
                onClick={handleOpenDeploy}
                disabled={!isConnected || !nodes.length || walkthrough?.running}
              >
                <Rocket className="size-3.5" aria-hidden="true" />
                <span>{walkthrough?.running && walkthrough.mode === 'preflight' ? 'Checking…' : isConnected ? 'Deploy' : 'Connect wallet to deploy'}</span>
              </button>
            )}
          </div>
          {validationWarning && <p role="alert" className="flex w-full items-center gap-2 text-xs text-amber-200">
            <AlertTriangle size={14} aria-hidden="true" />{validationWarning}
          </p>}
          {draftMessage && <p role="status" className="w-full text-xs text-[var(--ws-muted)]">{draftMessage}</p>}
        </div>

        {/* Collapsible Diagnostics Drawer */}
        {showDiagnostics && lintResult.allIssues.length > 0 && (
          <div className="border-b border-amber-500/25 bg-[#17120a] px-4 py-3 text-xs shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                <span>Pipeline Diagnostics ({lintResult.allIssues.length} {lintResult.allIssues.length === 1 ? 'issue' : 'issues'} found)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {lintResult.allIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => {
                    if (issue.nodeId) {
                      setSelectedNodeId(issue.nodeId);
                      const targetNode = nodes.find(n => n.id === issue.nodeId);
                      if (targetNode && reactFlowInstance) {
                        reactFlowInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 70, { duration: 500, zoom: 1 });
                      }
                    }
                  }}
                  className={`flex items-start gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                    issue.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 hover:bg-rose-950/40 text-rose-200'
                      : 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/40 text-amber-200'
                  }`}
                >
                  {issue.severity === 'error' ? (
                    <AlertCircle className="size-3.5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    {issue.nodeLabel && (
                      <span className="font-semibold text-white mr-1.5 font-mono text-[11px]">
                        [{issue.nodeLabel}]
                      </span>
                    )}
                    <span>{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deployed Snapshot Banner (Section 7.1 & 7.2 of Operations Analysis) */}
        {isSnapshot && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-400 shrink-0" />
              <span>
                Read-only deployment snapshot. Duplicate the pipeline to edit a new draft.
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateDraftFromSnapshot()}
              disabled={draftBusy || !nodes.length}
              className="ws-button ws-button-primary text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              <span>Duplicate pipeline</span>
            </button>
          </div>
        )}

        <div className="relative min-h-0 flex-1 flex overflow-hidden bg-[var(--ws-bg)]">
          <div className="relative min-h-0 flex-1 h-full" ref={reactFlowWrapper} data-flow-walkthrough={walkthrough ? '' : undefined}>
            {deploymentParam && address && signedIn && (
              <SnapshotExecutionPulse owner={address} deploymentId={deploymentParam} onExecution={handleConfirmedExecution} />
            )}
            {walkthrough && (
              <div role={walkthrough.issue ? 'alert' : 'status'} className={`pointer-events-none absolute inset-x-3 top-3 z-30 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-start gap-2 rounded-lg border bg-[var(--ws-panel)] px-3 py-2 text-xs leading-relaxed ${
                walkthrough.issue ? 'border-rose-500/40 text-rose-200' : 'border-[var(--ws-border)] text-[var(--ws-text)]'
              }`}>
                {walkthrough.issue ? <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-rose-400" />
                  : <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ws-accent)]" />}
                <span className="break-words">{walkthrough.message}</span>
              </div>
            )}

            {nodes.length === 0 && (
              <p className="pointer-events-none absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 text-center text-sm text-[var(--ws-muted)]">
                Add a trigger or choose a recipe to start.
              </p>
            )}
            <ReactFlow
              nodes={annotatedNodes}
              edges={displayedEdges}
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
                size={1.8}
                color="rgba(194, 205, 230, 0.40)"
              />
              <Controls className="!bg-[#0f111a]/90 !border-white/[0.08] !rounded-xl !shadow-2xl" />
            </ReactFlow>
          </div>

          {/* Right Node Inspector: Inside visual board at same level with canvas, below top toolbar */}
          {selectedNode && !isSnapshot && (
            <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[20.5rem] shrink-0 border-l border-[var(--ws-border)] bg-[var(--ws-rail)] lg:relative flex flex-col h-full shadow-2xl lg:shadow-none">
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
                nodeIssues={selectedNode ? lintResult.nodeIssues.get(selectedNode.id) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Deploy Modal */}
      <DeployModal
        key={isConnected ? address : 'guest'}
        isOpen={!isSnapshot && isDeployOpen}
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
                {validationWarning && <p role="alert" className="text-xs text-amber-200">{validationWarning}</p>}
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
                  if (await saveGraph(true) && active.current) router.push('/workspace/studio');
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
