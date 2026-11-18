'use client';

import React from 'react';
import dynamic from 'next/dynamic';

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
    <div className="w-full h-full relative bg-[#000000]">
      <StudioCanvas />
    </div>
  );
}
