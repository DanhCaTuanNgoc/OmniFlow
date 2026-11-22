'use client';

import { useEffect, type RefObject } from 'react';
import type { Address } from 'viem';
import { WebSocketProvider, useWebSocket } from '@/components/providers/WebSocketProvider';
import { getWorkspaceSessionToken } from '@/lib/workspaceSession';

type SnapshotExecutionPulseProps = {
  owner: Address;
  deploymentId: string;
  canvasRef: RefObject<HTMLDivElement>;
};

export function SnapshotExecutionPulse(props: SnapshotExecutionPulseProps) {
  return <WebSocketProvider><ExecutionListener {...props} /></WebSocketProvider>;
}

function ExecutionListener({ owner, deploymentId, canvasRef }: SnapshotExecutionPulseProps) {
  const { addListener, sendMessage, status } = useWebSocket();

  useEffect(() => {
    const token = getWorkspaceSessionToken(owner);
    const canvas = canvasRef.current;
    if (status !== 'CONNECTED' || !token || !canvas) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearPulse = () => {
      clearTimeout(timer);
      canvas.removeAttribute('data-execution-pulse');
    };
    const removeListener = addListener((message) => {
      if (getWorkspaceSessionToken(owner) !== token) return;
      if (message.type === 'AUTHENTICATED') {
        sendMessage({ type: 'SUBSCRIBE_PIPELINE', pipelineId: deploymentId });
      } else if (message.type === 'EXECUTION_UPDATED' && message.pipelineId === deploymentId &&
                 message.data?.status === 'SUCCESS') {
        clearTimeout(timer);
        canvas.setAttribute('data-execution-pulse', '');
        timer = setTimeout(clearPulse, 1600);
      }
    });
    sendMessage({ type: 'AUTHENTICATE', data: { token } });

    return () => {
      removeListener();
      clearPulse();
      sendMessage({ type: 'UNSUBSCRIBE_PIPELINE', pipelineId: deploymentId });
    };
  }, [addListener, canvasRef, deploymentId, owner, sendMessage, status]);

  return null;
}
