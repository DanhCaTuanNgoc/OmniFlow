'use client';

import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isPulsing = data?.isPulsing ?? true; // Default active pulse for live feeling

  return (
    <g className={isPulsing ? 'edge-pulse-active' : ''}>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: 2,
          stroke: isPulsing ? '#00E5FF' : '#334155',
          ...style,
        }}
      />
    </g>
  );
}
