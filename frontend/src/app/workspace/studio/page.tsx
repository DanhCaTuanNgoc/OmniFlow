'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { WorkspaceState } from '@/components/common/WorkspaceUI';
import { PipelineStudioHub } from '@/components/studio/PipelineStudioHub';

const StudioCanvas = dynamic(
  () => import('@/components/canvas/StudioCanvas').then((mod) => mod.StudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#000000] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-xs font-mono text-[#8e8e8e]">Loading Pipeline Studio...</span>
        </div>
      </div>
    ),
  }
);

export default function StudioPage() {
  return (
    <Suspense fallback={<WorkspaceState title="Loading Pipeline Studio…" />}>
      <StudioRoute />
    </Suspense>
  );
}

function StudioRoute() {
  const params = useSearchParams();
  if (['new', 'recipe', 'pipeline', 'deployment', 'local'].some((key) => params.has(key))) {
    return (
      <div className="h-full w-full">
        <StudioCanvas />
      </div>
    );
  }
  return <PipelineStudioHub />;
}

