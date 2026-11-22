'use client';

import { useEffect, useRef } from 'react';
import type { Address } from 'viem';
import { WebSocketProvider, useWebSocket } from '@/components/providers/WebSocketProvider';
import { getWorkspaceSessionToken } from '@/lib/workspaceSession';

type SnapshotExecutionPulseProps = {
  owner: Address;
  deploymentId: string;
  onExecution: () => void;
};

export function SnapshotExecutionPulse(props: SnapshotExecutionPulseProps) {
  return <WebSocketProvider><ExecutionListener {...props} /></WebSocketProvider>;
}

function ExecutionListener({ owner, deploymentId, onExecution }: SnapshotExecutionPulseProps) {
  const { addListener, sendMessage, status } = useWebSocket();
  const executionCallback = useRef(onExecution);
  useEffect(() => { executionCallback.current = onExecution; }, [onExecution]);

  useEffect(() => {
    const token = getWorkspaceSessionToken(owner);
    if (status !== 'CONNECTED' || !token) return;
    const removeListener = addListener((message) => {
      if (getWorkspaceSessionToken(owner) !== token) return;
      if (message.type === 'AUTHENTICATED') {
        sendMessage({ type: 'SUBSCRIBE_PIPELINE', pipelineId: deploymentId });
      } else if (message.type === 'EXECUTION_UPDATED' && message.pipelineId === deploymentId &&
                 message.data?.status === 'SUCCESS') {
        executionCallback.current();
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });

    return () => {
      removeListener();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, deploymentId, owner, sendMessage, status]);

  return null;
}
