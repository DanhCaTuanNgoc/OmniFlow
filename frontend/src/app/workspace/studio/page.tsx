'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const StudioCanvas = dynamic(
  () => import('@/components/canvas/StudioCanvas').then((mod) => mod.StudioCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#08090D] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading Pipeline Studio...</span>
        </div>
      </div>
    ),
  }
);

export default function StudioPage() {
  return (
    <div className="w-full h-full relative">
      <StudioCanvas />
    </div>
  );
}
