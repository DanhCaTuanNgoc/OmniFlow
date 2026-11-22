'use client';

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  Background,
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
import type { Address } from 'viem';
import { getSavedVault } from '@/lib/vaultSelection';
import { RECIPE_PRESETS } from '@/lib/recipes';
import { isPhaseTwoGraph, resolvePhaseTwo, resolveStopLoss, STOP_LOSS_TEMPLATE, StopLossValidationError, type StopLossGraph } from '@omniflow/shared';
import { APP_CONFIG } from '@/lib/constants';
import { listBrowserDrafts, parsePipelineDraft, saveBrowserDraft, renameBrowserDraft, studioGraph, studioEdgeData, exportDraftJson, connectionError, simulationPath } from '@/lib/pipelineDraft';
import { hasSingleExecutionRoute, planPipelineWalkthrough } from '@/lib/pipelineWalkthrough';
import type { DeploymentDetail, DeploymentExecution } from '@/lib/deployments';
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
import { CanvasActionDock } from './CanvasActionDock';
import { SnapshotExecutionPulse, type SnapshotStreamStatus } from './SnapshotExecutionPulse';
import { SnapshotRuntimeStatus, getSnapshotRuntimeState } from './SnapshotRuntimeStatus';
import { NodePalette, PALETTE_ITEMS } from './NodePalette';
import { InspectorPanel } from './InspectorPanel';
import { TakeProfitDeployModal } from './TakeProfitDeployModal';
import { DeployModal } from './DeployModal';
import { StudioToastContainer, type StudioNotification } from './StudioToastContainer';
import { SolidityPreviewModal } from './SolidityPreviewModal';
import { 
  ArrowLeft,
  Rocket, 
  AlertTriangle,
  Code2,
  ShieldCheck,
  Plus,
  Download,
  Upload,
  FlaskConical,
  CheckCircle2,
  LayoutGrid,
  AlertCircle,
} from 'lucide-react';
import { lintPipelineGraph, hasConfiguredVault, autoLayoutGraph, type PipelineIssue } from '@/lib/pipelineLint';

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
const deleteSelectionKeys = ['Delete', 'Backspace'];
const draftNodeTypes = new Map(PALETTE_ITEMS.map(item => [item.type, item.category]));

const walkthroughLabels = {
  sandbox: 'Sandbox',
  preflight: 'Deploy checks',
  execution: 'Confirmed execution',
};

type WalkthroughMode = keyof typeof walkthroughLabels;
type Walkthrough = {
  mode: WalkthroughMode;
  message: string;
  running: boolean;
  nodeIds: ReadonlySet<string>;
  edgeIds?: ReadonlySet<string>;
  traversedEdgeIds?: ReadonlySet<string>;
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
  const [draftNetworks, setDraftNetworks] = useState<StopLossGraph['networks']>();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(true);
  const [activeRecipeId, setActiveRecipeId] = useState<string>('');
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isSolidityOpen, setIsSolidityOpen] = useState(false);
  const [walkthrough, setWalkthrough] = useState<Walkthrough>();
  const walkthroughTimer = useRef<ReturnType<typeof setTimeout>>();
  const [snapshot, setSnapshot] = useState<Pick<DeploymentDetail, 'status' | 'runtime'>>();
  const [snapshotRefreshFailed, setSnapshotRefreshFailed] = useState(false);
  const [streamStatus, setStreamStatus] = useState<SnapshotStreamStatus>('connecting');
  const [latestExecution, setLatestExecution] = useState<DeploymentExecution>();
  const executionVersion = useRef(0);
  const lastAnimatedExecution = useRef<{ id: string; status: string }>();
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const [savedDraft, setSavedDraft] = useState<{ id: string; updatedAt: number }>();
  const [draftBusy, setDraftBusy] = useState(false);

  const pushNotification = useCallback((toast: Omit<StudioNotification, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushIssuesSequentially = useCallback(
    (issues: readonly PipelineIssue[]) => {
      if (!issues.length) return;
      issues.forEach((issue, index) => {
        setTimeout(() => {
          pushNotification({
            type: issue.severity === 'error' ? 'error' : 'warning',
            nodeLabel: issue.nodeLabel,
            title: issue.severity === 'error' ? 'Validation Error' : 'Configuration Warning',
            message: issue.message,
            nodeId: issue.nodeId,
            duration: 2800 + index * 400,
          });
        }, index * 200);
      });
    },
    [pushNotification]
  );
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
  const traversedEdgeIds = walkthrough?.traversedEdgeIds;
  const activeIssue = walkthrough?.issue;
  const runtimeState = getSnapshotRuntimeState(snapshot, signedIn, snapshotRefreshFailed, streamStatus);
  const isMonitoring = isSnapshot && runtimeState === 'monitoring';
  const monitoredPath = useMemo(() => isMonitoring ? simulationPath(nodes, edges) : undefined,
    [isMonitoring, nodes, edges]);
  const displayedEdges = useMemo(() => edges.map(edge => {
    const isBurst = activeEdgeIds?.has(edge.id);
    const isTraversed = traversedEdgeIds?.has(edge.id);
    const monitoring = monitoredPath?.edges.has(edge.id);
    return isBurst || isTraversed || monitoring ? { ...edge, data: { ...edge.data, isBurst, isTraversed, monitoring } } : edge;
  }), [activeEdgeIds, traversedEdgeIds, monitoredPath, edges]);

  const phaseTwo = isPhaseTwoGraph({ nodes, edges });
  const lintResult = useMemo(() => lintPipelineGraph(nodes, edges, phaseTwo && !isSnapshot), [nodes, edges, phaseTwo, isSnapshot]);
  const vaultIssue = lintResult.warnings.find(issue => issue.id === `vault-${issue.nodeId}`);
  const annotatedNodes = useMemo(() => {
    return nodes.map((n) => {
      const issues = lintResult.nodeIssues.get(n.id);
      const isOrphan = lintResult.isOrphanMap.get(n.id) ?? false;
      const firstWarning = activeIssue?.nodeId === n.id && activeIssue.severity === 'error' ? activeIssue.message : issues?.[0]?.message ?? null;
      const monitoringTrigger = n.data.category === 'trigger' && monitoredPath?.nodes.has(n.id);
      return {
        ...n,
        className: monitoringTrigger ? [n.className, 'studio-monitor-trigger'].filter(Boolean).join(' ') : n.className,
        data: {
          ...n.data,
          warning: firstWarning,
          isOrphan,
          state: activeIssue?.nodeId === n.id && activeIssue.severity === 'warning' ? 'SKIPPED'
            : activeNodeIds?.has(n.id) && !activeIssue ? 'CHECKING'
            : monitoringTrigger ? 'LISTENING' : n.data.state,
        },
      };
    });
  }, [nodes, lintResult, activeNodeIds, activeIssue, monitoredPath]);

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
    void workspaceRequest<{ graph: unknown; id?: string; updatedAt?: number } & Partial<Pick<DeploymentDetail, 'status' | 'runtime' | 'latestExecution'>>>(
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
      if (deploymentParam && snapshot.status) {
        setSnapshot({ status: snapshot.status, runtime: snapshot.runtime ?? null });
        setLatestExecution(snapshot.latestExecution ?? undefined);
      }
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

  useEffect(() => {
    if (!loaded || !deploymentParam || !address || !signedIn) return;
    const owner = address;
    const path = '/pipeline/deployments/' + encodeURIComponent(deploymentParam);
    const canvas = reactFlowWrapper.current;
    let lastChecked = Date.now();
    let request: AbortController | undefined;

    async function refresh() {
      if (document.hidden || request) return;
      const controller = new AbortController();
      request = controller;
      const version = executionVersion.current;
      try {
        const detail = await workspaceRequest<DeploymentDetail>(owner, path, { sessionOnly: true, signal: controller.signal });
        if (controller.signal.aborted) return;
        setSnapshot({ status: detail.status, runtime: detail.runtime });
        setSnapshotRefreshFailed(false);
        if (executionVersion.current === version) setLatestExecution(detail.latestExecution ?? undefined);
      } catch {
        if (!controller.signal.aborted) setSnapshotRefreshFailed(true);
      } finally {
        lastChecked = Date.now();
        request = undefined;
      }
    }

    function updateVisibility() {
      canvas?.toggleAttribute('data-page-hidden', document.hidden);
      if (!document.hidden && Date.now() - lastChecked >= 15000) void refresh();
    }
    updateVisibility();
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      clearInterval(timer);
      request?.abort();
      canvas?.removeAttribute('data-page-hidden');
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, [address, deploymentParam, loaded, signedIn]);

  async function saveGraph(leave = false) {
    if (isSnapshot || draftBusy) return false;
    const version = editVersion.current;
    setDraftBusy(true);
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
        pushNotification({ type: 'success', title: 'Draft Saved', message: 'Revision saved to your wallet workspace.' });
      } else {
        const id = localParam ?? crypto.randomUUID();
        saveBrowserDraft(id, draftName, graph, description);
        if (!leave && localParam !== id) router.replace('/workspace/studio?local=' + id, { scroll: false });
        pushNotification({ type: 'info', title: 'Draft Saved', message: 'Revision saved in local browser storage.' });
      }
      const current = editVersion.current === version;
      if (current) setIsDirty(false);
      return current;
    } catch (error) {
      if (active.current) {
        pushNotification({ type: 'error', title: 'Save Failed', message: error instanceof Error ? error.message : 'Unable to save draft revision.' });
      }
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
      pushNotification({ type: 'error', title: 'Duplicate Failed', message: err instanceof Error ? err.message : 'Unable to create editable draft.' });
    } finally {
      setDraftBusy(false);
    }
  };

  const selectedNodes = useMemo(() => nodes.filter(node => node.selected), [nodes]);
  const selectedNodeIds = useMemo(() => selectedNodes.map(node => node.id), [selectedNodes]);
  const selectedEdgeIds = useMemo(() => edges.filter(edge => edge.selected).map(edge => edge.id), [edges]);
  const selectedNode = selectedNodes.length === 1 && !selectedEdgeIds.length ? selectedNodes[0] : undefined;
  const crossChain = nodes.some(node => node.type === 'priceVelocityGuard');
  const priceGate = nodes.find(node => node.type === 'logicGate');
  const primaryGuard = priceGate && edges.find(edge => edge.target === priceGate.id && edge.targetHandle === 'signal-a');
  const supportsPriceVault = phaseTwo && nodes.every(node =>
    ['watchDEXPrice', 'priceThresholdGuard', 'priceVelocityGuard', 'logicGate', 'cooldownGuard', 'dexSwap'].includes(node.type ?? ''));
  const originPool = nodes.find(node => node.type === 'watchDEXPrice' &&
    (!priceGate || edges.some(edge => edge.source === node.id && edge.target === primaryGuard?.source)))?.data.pairAddress;

  const swap = nodes.find(node => node.type === 'dexSwap');
  const swapId = swap?.id;
  const vaultPool = crossChain ? swap?.data.destinationPoolAddress : originPool;
  const currentVault = swap?.data.actionVaultAddress;
  const lookupOwner = supportsPriceVault && signedIn && isConnected && !isSnapshot ? address : undefined;
  const lookupPair = hasConfiguredVault(vaultPool) ? String(vaultPool) : undefined;
  const lookupKey = lookupOwner && lookupPair && swapId ? `${lookupOwner}:${lookupPair}:${swapId}` : undefined;
  const [vaultLookup, setVaultLookup] = useState<{ key: string; vaults?: Address[]; error?: string }>();

  useEffect(() => {
    if (!lookupKey || !lookupOwner || !lookupPair || !swapId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ pair: lookupPair });
    const savedVault = getSavedVault(lookupOwner);
    if (hasConfiguredVault(savedVault) && savedVault) query.set('managerVault', savedVault);
    void workspaceRequest<{ vaults: Address[] }>(lookupOwner, `/pipeline/vaults/price-order-candidates?${query}`, {
      signal: controller.signal,
    }).then(({ vaults }) => {
      if (controller.signal.aborted) return;
      setVaultLookup({ key: lookupKey, vaults });
      if (vaults.length !== 1 || currentVault) return;
      setNodes(current => current.map(node => node.id === swapId && !node.data.actionVaultAddress
        ? { ...node, data: { ...node.data, actionVaultAddress: vaults[0] } } : node));
      markDirty();
    }).catch(error => {
      if (!controller.signal.aborted) {
        setVaultLookup({ key: lookupKey, error: error instanceof Error ? error.message : 'Unable to check compatible Vaults.' });
      }
    });
    return () => controller.abort();
  }, [lookupKey, lookupOwner, lookupPair, swapId, currentVault, setNodes, markDirty]);

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
        pushNotification({ type: 'warning', title: 'Invalid Connection', message: error });
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
        pushNotification({ type: 'warning', title: 'DAG Restriction', message: 'Cyclic connections are strictly prohibited in DAG pipelines.' });
        return false;
      }

      return true;
    },
    [nodes, edges, pushNotification]
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

  const selectNode = useCallback((id: string | null) => {
    if (isSnapshot) return;
    setNodes(current => current.map(node => Boolean(node.selected) === (node.id === id)
      ? node : { ...node, selected: node.id === id }));
    setEdges(current => current.map(edge => edge.selected ? { ...edge, selected: false } : edge));
  }, [isSnapshot, setEdges, setNodes]);

  const handleFocusNode = useCallback((nodeId: string) => {
    selectNode(nodeId);
    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode && reactFlowInstance) {
      reactFlowInstance.setCenter(targetNode.position.x + 140, targetNode.position.y + 70, { duration: 500, zoom: 1 });
    }
  }, [nodes, reactFlowInstance, selectNode]);

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
      selectNode(newNode.id);
      if (!isSnapshot) markDirty();
    },
    [nodes, reactFlowInstance, setNodes, selectNode, isSnapshot, markDirty]
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
    selectNode(newNode.id);
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
    if (!isSnapshot) void reactFlowInstance?.deleteElements({ nodes: [{ id }] });
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
      setActiveRecipeId('');
      pushNotification({ type: 'info', title: 'Pipeline Cleared', message: 'All nodes and connections have been reset.' });
    }
  }, [nodes.length, isSnapshot, setNodes, setEdges, markDirty, pushNotification]);

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
    pushNotification({ type: 'success', title: 'Export Complete', message: 'Pipeline configuration exported to JSON.' });
  }, [nodes, edges, draftNetworks, draftName, address, description, pushNotification]);

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
        setActiveRecipeId('');
        pushNotification({ type: 'success', title: 'Import Complete', message: 'Pipeline imported successfully.' });
      } catch (error) {
        pushNotification({ type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'Unable to import JSON file.' });
      }
    },
    [nodes.length, isSnapshot, setNodes, setEdges, markDirty, pushNotification]
  );

  const startWalkthrough = useCallback((mode: WalkthroughMode, blockingIssue?: PipelineIssue) => {
    stopWalkthrough();
    const checkConfiguration = mode === 'sandbox' || mode === 'preflight';
    const issues = checkConfiguration ? [...lintResult.errors] : [];
    if (blockingIssue) issues.push(blockingIssue);
    const steps = planPipelineWalkthrough(nodes, edges, issues);
    if (!steps.length) {
      if (checkConfiguration && lintResult.allIssues.length > 0) {
        pushIssuesSequentially(lintResult.allIssues);
      }
      return;
    }

    const label = walkthroughLabels[mode];
    let traversedEdgeIds = new Set<string>();
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
          mode, running: false, nodeIds: new Set(), traversedEdgeIds,
          message: mode === 'execution' ? 'Execution confirmed.' : label + ' complete.',
        });
        if (mode === 'sandbox') {
          pushNotification({
            type: vaultIssue ? 'warning' : 'success',
            title: 'Flow preview complete',
            message: vaultIssue ? vaultIssue.message : 'The connected path passed canvas checks.',
            nodeId: vaultIssue?.nodeId,
            nodeLabel: vaultIssue?.nodeLabel,
          });
        }
        schedule(stopWalkthrough, 1500);
        return;
      }

      const nodeIds = new Set(step.nodes.map(node => node.id));
      const edgeIds = new Set(step.edges.map(edge => edge.id));
      const names = step.nodes.map(node => String(node.data.label || node.type || node.id)).join(', ');
      const arrive = () => {
        if (edgeIds.size) traversedEdgeIds = new Set([...traversedEdgeIds, ...edgeIds]);
        if (step.issue) {
          walkthroughTimer.current = undefined;
          pushIssuesSequentially(lintResult.allIssues.length ? lintResult.allIssues : [step.issue]);
          setWalkthrough({
            mode, nodeIds, traversedEdgeIds, running: false, issue: step.issue,
            message: (names ? label + ' stopped at ' + names : label + ' blocked') + '. ' + step.issue.message,
          });
          if (mode === 'execution') schedule(stopWalkthrough, 1800);
          return;
        }
        setWalkthrough({ mode, nodeIds, traversedEdgeIds, running: true, message: label + ' · ' + names });
        schedule(() => showStep(index + 1), 450);
      };

      if (edgeIds.size) {
        setWalkthrough({
          mode, running: true, nodeIds: new Set(), message: label + ' · ' + names,
          edgeIds, traversedEdgeIds,
        });
        schedule(arrive, 800);
      } else {
        arrive();
      }
    }

    showStep(0);
  }, [edges, lintResult.errors, lintResult.allIssues, nodes, pushIssuesSequentially, pushNotification, stopWalkthrough, vaultIssue]);

  const handleExecutionUpdate = useCallback((execution: DeploymentExecution) => {
    executionVersion.current++;
    setLatestExecution(current => !current || Date.parse(execution.timestamp) >= Date.parse(current.timestamp) ? execution : current);
    const id = execution.id ?? execution.timestamp;
    const previous = lastAnimatedExecution.current;
    if (walkthrough?.mode === 'execution' && previous?.id === id && previous.status !== execution.status) {
      stopWalkthrough();
    }
    if (walkthroughTimer.current || document.hidden) return;
    const skipped = execution.status === 'SKIPPED' && execution.destinationTxHash;
    if (execution.status !== 'SUCCESS' && !skipped) return;

    const steps = planPipelineWalkthrough(nodes, edges, []);
    if (!hasSingleExecutionRoute(nodes, edges, steps)) return;
    if (previous?.id === id && previous.status === execution.status) return;
    lastAnimatedExecution.current = { id, status: execution.status };
    const issue: PipelineIssue | undefined = skipped ? {
      id: 'execution-skipped', nodeId: steps.at(-1)!.nodes[0].id, severity: 'warning',
      message: execution.details?.reason ?? 'The destination recorded a skipped action.',
    } : undefined;
    startWalkthrough('execution', issue);
  }, [edges, nodes, startWalkthrough, stopWalkthrough, walkthrough?.mode]);

  const handleOpenDeploy = () => {
    if (isSnapshot || !isConnected || walkthrough?.running) return;

    if (vaultIssue?.nodeId) {
      handleFocusNode(vaultIssue.nodeId);
      pushIssuesSequentially([{ ...vaultIssue, severity: 'error' }]);
      return;
    }

    let issue: PipelineIssue | undefined;
    const graph = { nodes, edges, networks: draftNetworks };
    try {
      if (phaseTwo) {
        const resolved = resolvePhaseTwo(graph);
        if (resolved.type !== 'price-order' || resolved.config.mode !== 1) {
          pushNotification({ type: 'warning', title: 'Deploy unavailable', message: 'This Phase 2 mode is awaiting deployment support.' });
          return;
        }
      } else {
        resolveStopLoss(graph);
      }
    } catch (error) {
      issue = {
        id: 'deployment-configuration', severity: 'error',
        nodeId: error instanceof StopLossValidationError ? error.nodeId : undefined,
        message: error instanceof Error ? error.message.replace(/^DAG Validation Failed: /, '') : 'Unable to validate this graph.',
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

          </div>

          <div className="ws-actions flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                  onClick={() => pushIssuesSequentially(lintResult.allIssues)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="Click to view all configuration issues"
                >
                  <AlertTriangle className="size-3.5 text-amber-400" aria-hidden="true" />
                  <span>{lintResult.allIssues.length} {lintResult.allIssues.length === 1 ? 'Issue' : 'Issues'}</span>
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
              title="Preview the connected path and check node configuration"
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
        </div>

        {/* Deployed Snapshot Banner (Section 7.1 & 7.2 of Operations Analysis) */}
        {isSnapshot && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 text-xs text-indigo-200">
            <div className="flex min-w-0 items-start gap-2">
              <ShieldCheck className="size-4 text-indigo-400 shrink-0" />
              <SnapshotRuntimeStatus state={runtimeState} checkedAt={snapshot?.runtime?.readAt} execution={latestExecution} />
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
          <div className="studio-canvas-pane relative h-full min-h-0 min-w-0 flex-1" ref={reactFlowWrapper}
            data-flow-walkthrough={walkthrough ? '' : undefined} data-flow-monitoring={isMonitoring ? '' : undefined}>
            {deploymentParam && address && signedIn && (
              <SnapshotExecutionPulse owner={address} deploymentId={deploymentParam}
                onExecution={handleExecutionUpdate} onStreamStatus={setStreamStatus} />
            )}
            {walkthrough && (
              <div role={walkthrough.issue ? 'alert' : 'status'} className={`pointer-events-none absolute inset-x-3 top-3 z-30 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-start gap-2 rounded-lg border bg-[var(--ws-panel)] px-3 py-2 text-xs leading-relaxed ${
                walkthrough.issue?.severity === 'warning' ? 'border-amber-500/40 text-amber-200'
                  : walkthrough.issue ? 'border-rose-500/40 text-rose-200' : 'border-[var(--ws-border)] text-[var(--ws-text)]'
              }`}>
                {walkthrough.issue ? <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
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
              onInit={setReactFlowInstance}
              onDrop={isSnapshot ? undefined : onDrop}
              onDragOver={onDragOver}
              nodesDraggable={!isSnapshot}
              nodesConnectable={!isSnapshot}
              elementsSelectable={!isSnapshot}
              deleteKeyCode={isSnapshot || isDeployOpen || isSolidityOpen || showExitModal ? null : deleteSelectionKeys}
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
              <CanvasActionDock
                isSnapshot={isSnapshot}
                isPaletteOpen={isPaletteOpen}
                hasNodes={nodes.length > 0}
                selectedNodeIds={selectedNodeIds}
                selectedEdgeIds={selectedEdgeIds}
                onTogglePalette={() => setPaletteOpen(open => !open)}
                onClear={handleResetGraph}
              />
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
                vaultLookup={vaultLookup?.key === lookupKey ? vaultLookup : undefined}
                checkingVaults={Boolean(lookupKey && vaultLookup?.key !== lookupKey)}
                crossChain={crossChain}
                originPool={originPool}
                onUpdateNodeData={handleUpdateNodeData}
                onDeleteNode={handleDeleteNode}
                onClose={() => selectNode(null)}
                nodeIssues={selectedNode ? lintResult.nodeIssues.get(selectedNode.id) : undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Deploy Modal */}
      {phaseTwo ? (!isSnapshot && isDeployOpen && address && savedDraft && (
        <TakeProfitDeployModal key={`${address}:${savedDraft.id}:${savedDraft.updatedAt}`} owner={address} draft={savedDraft}
          graph={{ ...studioGraph(nodes, edges, draftNetworks), metadata: { name: draftName, ownerAddress: address, description } }}
          onClose={() => setIsDeployOpen(false)} />
      )) : <DeployModal
        key={isConnected ? address : 'guest'}
        isOpen={!isSnapshot && isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        graph={studioGraph(nodes, edges, draftNetworks)}
        workspacePipelineId={savedDraft?.id}
        name={draftName}
      />}

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

      {/* Sequential Toast Popups (Bottom-Right) */}
      <StudioToastContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        onSelectNode={handleFocusNode}
      />
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
