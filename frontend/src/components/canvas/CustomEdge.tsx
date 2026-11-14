'use client';

import React from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
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

  const isPulsing = (data?.isPulsing as boolean | undefined) ?? true;
  const strokeColor = (data?.color as string | undefined) || '#38bdf8';

  return (
    <g className="react-flow__edge-custom group">
      {/* Layer 1: Soft Outer Neon Glow */}
      <path
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={7}
        opacity={isPulsing ? 0.2 : 0.08}
        strokeLinecap="round"
        className="transition-opacity duration-300 pointer-events-none"
      />

      {/* Layer 2: Core Wire */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeOpacity={isPulsing ? 0.85 : 0.4}
        strokeLinecap="round"
        style={style}
      />

      {/* Layer 3: Animated Photon Particle gliding along the stream */}
      {isPulsing && (
        <circle r="3" fill="#ffffff" className="pointer-events-none">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {isPulsing && (
        <circle r="5" fill={strokeColor} opacity={0.6} className="pointer-events-none filter blur-[1px]">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </g>
  );
}
