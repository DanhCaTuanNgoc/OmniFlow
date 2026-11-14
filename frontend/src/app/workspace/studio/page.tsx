'use client';

import React from 'react';
import { StudioCanvas } from '@/components/canvas/StudioCanvas';

export default function StudioPage() {
  return (
    <div className="w-full h-full relative">
      <StudioCanvas />
    </div>
  );
}
