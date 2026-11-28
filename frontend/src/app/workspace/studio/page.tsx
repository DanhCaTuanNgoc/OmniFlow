'use client';

import React, { Suspense, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { PipelineOpenState } from '@/components/studio/PipelineOpenState';
import { PipelineStudioHub } from '@/components/studio/PipelineStudioHub';

const StudioCanvas = dynamic(
  () => import('@/components/canvas/StudioCanvas').then((mod) => mod.StudioCanvas),
  {
    ssr: false,
    loading: () => <PipelineOpenState />,
  }
);

const emptySubscribe = () => () => {};

export default function StudioPage() {
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!hydrated) return <PipelineOpenState state="studio" />;

  return (
    <Suspense fallback={<PipelineOpenState state="studio" />}>
      <StudioRoute />
    </Suspense>
  );
}

function StudioRoute() {
  const params = useSearchParams();
  const { address, isConnected, status } = useAccount();
  const owner = isConnected ? address?.toLowerCase() : undefined;
  const source = ['deployment', 'pipeline', 'local', 'recipe', 'new'].find(key => params.has(key));
  const privateGraph = source === 'pipeline' || source === 'deployment';
  if (source && ['deployment', 'pipeline', 'local'].includes(source) && !params.get(source)?.trim()) {
    return <PipelineOpenState state="error" message="This pipeline link is missing an ID." />;
  }
  if (privateGraph && !owner) {
    return <PipelineOpenState state={status === 'connecting' || status === 'reconnecting' ? 'loading' : 'sign-in'} />;
  }
  if (source) {
    return (
      <div className="h-full w-full">
        <StudioCanvas key={JSON.stringify([source, params.get(source), owner])} />
      </div>
    );
  }
  return <PipelineStudioHub key={owner ?? 'guest'} />;
}

