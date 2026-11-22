'use client';

import type { DeploymentDetail, DeploymentExecution } from '@/lib/deployments';
import type { SnapshotStreamStatus } from './SnapshotExecutionPulse';

const runtimeLabels = {
  monitoring: 'Monitoring',
  connecting: 'Connecting to live updates',
  disconnected: 'Live updates unavailable',
  'sign-in': 'Sign in for live status',
  signed: 'Awaiting deployment receipt',
  reverted: 'Deployment reverted',
  unverified: 'Runtime status unavailable',
  'awaiting-authorization': 'Awaiting Vault permission',
  'awaiting-principal': 'Awaiting principal',
  'awaiting-fees': 'Awaiting fees',
};

type RuntimeState = keyof typeof runtimeLabels;

export function getSnapshotRuntimeState(
  snapshot: Pick<DeploymentDetail, 'status' | 'runtime'> | undefined,
  signedIn: boolean,
  refreshFailed: boolean,
  stream: SnapshotStreamStatus,
): RuntimeState {
  if (!signedIn) return 'sign-in';
  if (refreshFailed || !snapshot) return 'unverified';
  if (snapshot.status !== 'deployed') return snapshot.status;
  const readiness = snapshot.runtime?.status ?? 'unverified';
  if (readiness !== 'ready') return readiness;
  if (stream === 'subscribed') return 'monitoring';
  return stream === 'connecting' ? 'connecting' : 'disconnected';
}

const executionLabels: Record<string, string> = {
  SUCCESS: 'Executed',
  SKIPPED: 'Skipped',
  FAILED: 'Failed',
  PENDING: 'Awaiting confirmation',
  UNVERIFIED: 'Unverified',
  REORGED: 'Reorganized',
};

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function SnapshotRuntimeStatus({ state, checkedAt, execution }: {
  state: RuntimeState;
  checkedAt?: string;
  execution?: DeploymentExecution;
}) {
  const executionLabel = execution && executionLabels[execution.status];
  return (
    <div className="min-w-0 space-y-1 text-xs">
      <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${state === 'monitoring' ? 'text-emerald-300' : 'text-[var(--ws-text)]'}`}>
          <span aria-hidden="true" className={`size-1.5 rounded-full ${state === 'monitoring' ? 'bg-emerald-400' : 'bg-[var(--ws-muted)]'}`} />
          {runtimeLabels[state]}
        </span>
        {checkedAt && <span className="text-[var(--ws-muted)]">Checked <time dateTime={checkedAt}>{formatTime(checkedAt)}</time></span>}
      </div>
      {execution && executionLabel && (
        <p className="break-words text-[var(--ws-muted)]">
          Last recorded activity · <span className="font-medium text-[var(--ws-text)]">{executionLabel}</span>
          {' · '}<time dateTime={execution.timestamp}>{formatTime(execution.timestamp)}</time>
          {execution.details?.reason && <span> · {execution.details.reason}</span>}
        </p>
      )}
    </div>
  );
}
