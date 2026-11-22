'use client';

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import type { DeploymentExecution } from '@/lib/deployments';
import { WebSocketProvider, useWebSocket } from '@/components/providers/WebSocketProvider';
import { getWorkspaceSessionToken } from '@/lib/workspaceSession';

export type SnapshotStreamStatus = 'connecting' | 'subscribed' | 'unavailable';

type SnapshotExecutionPulseProps = {
  owner: Address;
  deploymentId: string;
  onExecution: (execution: DeploymentExecution) => void;
  onStreamStatus: (status: SnapshotStreamStatus) => void;
};

export function SnapshotExecutionPulse(props: SnapshotExecutionPulseProps) {
  return <WebSocketProvider><ExecutionListener {...props} /></WebSocketProvider>;
}

function ExecutionListener({ owner, deploymentId, onExecution, onStreamStatus }: SnapshotExecutionPulseProps) {
  const { addListener, sendMessage, status } = useWebSocket();
  const executionCallback = useRef(onExecution);
  useEffect(() => { executionCallback.current = onExecution; }, [onExecution]);

  useEffect(() => {
    const token = getWorkspaceSessionToken(owner);
    onStreamStatus(status === 'DISCONNECTED' || !token ? 'unavailable' : 'connecting');
    if (status !== 'CONNECTED' || !token) return;

    const acknowledgement = setTimeout(() => onStreamStatus('unavailable'), 8000);
    const removeListener = addListener((message) => {
      if (getWorkspaceSessionToken(owner) !== token) return;
      if (message.type === 'AUTHENTICATED') {
        sendMessage({ type: 'SUBSCRIBE_PIPELINE', pipelineId: deploymentId });
      } else if (message.type === 'ERROR') {
        clearTimeout(acknowledgement);
        onStreamStatus('unavailable');
      } else if (message.pipelineId === deploymentId) {
        if (message.type === 'PIPELINE_STATUS_CHANGED' && message.data?.subscribed === true) {
          clearTimeout(acknowledgement);
          onStreamStatus('subscribed');
        } else if (message.type === 'EXECUTION_UPDATED' && typeof message.data?.status === 'string' &&
                   typeof message.data?.timestamp === 'string' && Number.isFinite(Date.parse(message.data.timestamp))) {
          executionCallback.current(message.data);
        }
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });

    return () => {
      clearTimeout(acknowledgement);
      removeListener();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, deploymentId, onStreamStatus, owner, sendMessage, status]);

  return null;
}
