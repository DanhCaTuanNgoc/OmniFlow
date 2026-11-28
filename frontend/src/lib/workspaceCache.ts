'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';
import type { DeploymentDetail, DeploymentSummary } from './deployments';
import { getWorkspaceSessionToken, workspaceRequest, WorkspaceSignInRequired } from './workspaceSession';

export type WalletDraftSummary = { id: string; name: string; updatedAt: number };
export type WalletDraftDetail = { id?: string; updatedAt?: number; graph: unknown };
export type VerifiedVaultItem = { address: Address; pair: Address; kind: string | null };
export type TelegramStatus = { enabled: boolean; linked: boolean };

export type ActivityExecution = {
  id: string;
  pipelineId: string;
  pipelineName: string;
  timestamp: string;
  status: 'PENDING' | 'UNVERIFIED' | 'REORGED' | 'SUCCESS' | 'SKIPPED' | 'FAILED';
  originTxHash: string;
  reactiveTxHash?: string;
  destinationTxHash?: string;
  details: {
    reason?: string;
    executionId?: string;
    amountIn?: string;
    amountOut?: string;
    triggerPrice?: string;
    thresholdPrice?: string;
    executedPrice?: string;
  };
};

export type ActivityHistory = {
  logs: ActivityExecution[];
  indexer: { checkedAt: string; error: boolean } | null;
  next: { timestamp: string; sequence: number } | null;
};

const CACHE_PREFIX = 'omniflow.ws.cache.v1.';
const SHORT_LIST_CACHE_TTL_MS = 5 * 60_000;
const LONG_LIST_CACHE_TTL_MS = 10 * 60_000;
const WORKSPACE_GC_TIME_MS = 15 * 60_000;

export const workspaceQueryKeys = {
  all: ['workspace'] as const,
  drafts: (owner: Address) => ['workspace', owner.toLowerCase(), 'drafts'] as const,
  draft: (owner: Address, id: string) => ['workspace', owner.toLowerCase(), 'draft', id] as const,
  deployments: (owner: Address) => ['workspace', owner.toLowerCase(), 'deployments'] as const,
  deployment: (owner: Address, id: string) => ['workspace', owner.toLowerCase(), 'deployment', id] as const,
  vaults: (owner: Address) => ['workspace', owner.toLowerCase(), 'vaults'] as const,
  telegramStatus: (owner: Address) => ['workspace', owner.toLowerCase(), 'telegram-status'] as const,
  logs: (owner: Address, deploymentId: string | null) => ['workspace', owner.toLowerCase(), 'logs', deploymentId ?? 'all'] as const,
};

function cacheKey(owner: Address, bucket: string) {
  return `${CACHE_PREFIX}${owner.toLowerCase()}.${bucket}`;
}

export function readWorkspaceCache<T>(owner: Address, bucket: string, maxAgeMs: number): { data: T; updatedAt: number } | undefined {
  if (typeof window === 'undefined') return undefined;
  const token = getWorkspaceSessionToken(owner);
  if (!token) return undefined;
  try {
    const raw = window.sessionStorage.getItem(cacheKey(owner, bucket));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { savedAt?: unknown; token?: unknown; data?: unknown };
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.token !== token ||
      typeof parsed.savedAt !== 'number' ||
      Date.now() - parsed.savedAt > maxAgeMs ||
      !('data' in parsed)
    ) {
      window.sessionStorage.removeItem(cacheKey(owner, bucket));
      return undefined;
    }
    return { data: parsed.data as T, updatedAt: parsed.savedAt };
  } catch {
    return undefined;
  }
}

export function writeWorkspaceCache<T>(owner: Address, bucket: string, data: T): void {
  if (typeof window === 'undefined') return;
  const token = getWorkspaceSessionToken(owner);
  if (!token) return;
  try {
    window.sessionStorage.setItem(
      cacheKey(owner, bucket),
      JSON.stringify({ savedAt: Date.now(), token, data })
    );
  } catch {
    // Ignore sessionStorage quota errors; in-memory QueryClient cache remains active.
  }
}

export function removeWorkspaceCache(owner: Address, bucket?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (bucket) {
      window.sessionStorage.removeItem(cacheKey(owner, bucket));
      return;
    }
    const prefix = `${CACHE_PREFIX}${owner.toLowerCase()}.`;
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors.
  }
}

function shouldRetryWorkspaceQuery(failureCount: number, error: unknown) {
  if (error instanceof WorkspaceSignInRequired) return false;
  return failureCount < 1;
}

export async function fetchWorkspaceDraftsList(owner: Address, signal?: AbortSignal): Promise<WalletDraftSummary[]> {
  const res = await workspaceRequest<{ drafts: WalletDraftSummary[] }>(owner, '/pipeline/drafts', {
    signal,
    sessionOnly: true,
  });
  const drafts = res.drafts ?? [];
  writeWorkspaceCache(owner, 'drafts', drafts);
  return drafts;
}

export async function fetchWorkspaceDeploymentsList(owner: Address, signal?: AbortSignal): Promise<DeploymentSummary[]> {
  const res = await workspaceRequest<{ deployments: DeploymentSummary[] }>(owner, '/pipeline/deployments', {
    signal,
    sessionOnly: true,
  });
  const deployments = res.deployments ?? [];
  writeWorkspaceCache(owner, 'deployments', deployments);
  return deployments;
}

export function useWorkspaceDraftsQuery(owner: Address | undefined, enabled: boolean) {
  const isEnabled = Boolean(owner && enabled);
  const cached = isEnabled && owner ? readWorkspaceCache<WalletDraftSummary[]>(owner, 'drafts', LONG_LIST_CACHE_TTL_MS) : undefined;

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.drafts(owner) : ['workspace', 'guest', 'drafts'],
    queryFn: ({ signal }) => fetchWorkspaceDraftsList(owner!, signal),
    enabled: isEnabled,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: 3 * 60_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: false,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function useWorkspaceDeploymentsQuery(owner: Address | undefined, enabled: boolean) {
  const isEnabled = Boolean(owner && enabled);
  const cached = isEnabled && owner ? readWorkspaceCache<DeploymentSummary[]>(owner, 'deployments', SHORT_LIST_CACHE_TTL_MS) : undefined;

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.deployments(owner) : ['workspace', 'guest', 'deployments'],
    queryFn: ({ signal }) => fetchWorkspaceDeploymentsList(owner!, signal),
    enabled: isEnabled,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: 30_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: true,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function useWorkspaceDeploymentDetailQuery(owner: Address | undefined, id: string, enabled: boolean) {
  const isEnabled = Boolean(owner && id && enabled);

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.deployment(owner, id) : ['workspace', 'guest', 'deployment', id],
    queryFn: ({ signal }) =>
      workspaceRequest<DeploymentDetail>(owner!, `/pipeline/deployments/${encodeURIComponent(id)}`, {
        signal,
        sessionOnly: true,
      }),
    enabled: isEnabled,
    staleTime: 20_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: true,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function useWorkspaceVaultsQuery(owner: Address | undefined, enabled: boolean) {
  const isEnabled = Boolean(owner && enabled);
  const cached = isEnabled && owner ? readWorkspaceCache<VerifiedVaultItem[]>(owner, 'vaults', LONG_LIST_CACHE_TTL_MS) : undefined;

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.vaults(owner) : ['workspace', 'guest', 'vaults'],
    queryFn: async ({ signal }) => {
      const res = await workspaceRequest<{ vaults: VerifiedVaultItem[] }>(owner!, '/pipeline/vaults', {
        signal,
        sessionOnly: true,
      });
      const vaults = res.vaults ?? [];
      writeWorkspaceCache(owner!, 'vaults', vaults);
      return vaults;
    },
    enabled: isEnabled,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: 3 * 60_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: false,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function useWorkspaceTelegramStatusQuery(owner: Address | undefined, enabled: boolean) {
  const isEnabled = Boolean(owner && enabled);
  const cached = isEnabled && owner ? readWorkspaceCache<TelegramStatus>(owner, 'telegram-status', LONG_LIST_CACHE_TTL_MS) : undefined;

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.telegramStatus(owner) : ['workspace', 'guest', 'telegram-status'],
    queryFn: async ({ signal }) => {
      const status = await workspaceRequest<TelegramStatus>(owner!, '/telegram/status', {
        signal,
        sessionOnly: true,
      });
      writeWorkspaceCache(owner!, 'telegram-status', status);
      return status;
    },
    enabled: isEnabled,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: 2 * 60_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: false,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function useWorkspaceLogsQuery(owner: Address | undefined, deploymentId: string | null, enabled: boolean) {
  const isEnabled = Boolean(owner && enabled);
  const bucket = `logs:${deploymentId ?? 'all'}`;
  const cached = isEnabled && owner ? readWorkspaceCache<ActivityHistory>(owner, bucket, SHORT_LIST_CACHE_TTL_MS) : undefined;
  const path = deploymentId ? `/logs?pipelineId=${encodeURIComponent(deploymentId)}` : '/logs';

  return useQuery({
    queryKey: owner ? workspaceQueryKeys.logs(owner, deploymentId) : ['workspace', 'guest', 'logs', deploymentId ?? 'all'],
    queryFn: async ({ signal }) => {
      const res = await workspaceRequest<ActivityHistory>(owner!, path, {
        signal,
        sessionOnly: true,
      });
      writeWorkspaceCache(owner!, bucket, res);
      return res;
    },
    enabled: isEnabled,
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: 20_000,
    gcTime: WORKSPACE_GC_TIME_MS,
    refetchOnMount: true,
    retry: shouldRetryWorkspaceQuery,
  });
}

export function invalidateDraftsCache(queryClient: QueryClient, owner: Address) {
  removeWorkspaceCache(owner, 'drafts');
  return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.drafts(owner) });
}

export function invalidateDraftDetailCache(queryClient: QueryClient, owner: Address, id: string) {
  return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.draft(owner, id) });
}

export function invalidateDeploymentsCache(queryClient: QueryClient, owner: Address, deploymentId?: string) {
  removeWorkspaceCache(owner, 'deployments');
  const tasks: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.deployments(owner) }),
  ];
  if (deploymentId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.deployment(owner, deploymentId) }));
  }
  return Promise.all(tasks);
}

export function invalidateVaultsCache(queryClient: QueryClient, owner: Address) {
  removeWorkspaceCache(owner, 'vaults');
  return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.vaults(owner) });
}

export function invalidateTelegramCache(queryClient: QueryClient, owner: Address) {
  removeWorkspaceCache(owner, 'telegram-status');
  return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.telegramStatus(owner) });
}

export function invalidateLogsCache(queryClient: QueryClient, owner: Address, deploymentId?: string | null) {
  if (deploymentId !== undefined) {
    removeWorkspaceCache(owner, `logs:${deploymentId ?? 'all'}`);
    return queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.logs(owner, deploymentId) });
  }
  return queryClient.invalidateQueries({ queryKey: ['workspace', owner.toLowerCase(), 'logs'] });
}

export function useOptionalQueryClient() {
  return useQueryClient();
}

export function useWorkspaceCacheActions(owner?: Address) {
  const queryClient = useQueryClient();
  const invalidateDrafts = useCallback(() => {
    if (owner) void invalidateDraftsCache(queryClient, owner);
  }, [owner, queryClient]);
  const invalidateDeployments = useCallback((deploymentId?: string) => {
    if (owner) void invalidateDeploymentsCache(queryClient, owner, deploymentId);
  }, [owner, queryClient]);
  return { queryClient, invalidateDrafts, invalidateDeployments };
}
