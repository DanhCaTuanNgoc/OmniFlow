'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isPulsing = (data?.isPulsing as boolean | undefined) ?? true;
  const isBurst = Boolean(data?.isBurst);
  const strokeColor = (data?.color as string | undefined) || '#38bdf8';
  const crossChainLabel = data?.crossChainLabel as string | undefined;
  const animDur = isBurst ? '0.9s' : '2.2s';

  return (
    <>
      <g className="react-flow__edge-custom group">
        {/* Layer 1: Soft Outer Neon Glow */}
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isBurst ? 10 : 7}
          opacity={isBurst ? 0.4 : isPulsing ? 0.2 : 0.08}
          strokeLinecap="round"
          className="transition-opacity duration-300 pointer-events-none"
        />

        {/* Layer 2: Core Wire */}
        <path
          id={id}
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isBurst ? 3 : 2}
          strokeOpacity={isBurst ? 1 : isPulsing ? 0.85 : 0.4}
          strokeLinecap="round"
          style={style}
        />

        {/* Layer 3: Animated Photon Particle gliding along the stream */}
        {isPulsing && (
          <circle r={isBurst ? 4 : 3} fill="#ffffff" className="pointer-events-none filter drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
            <animateMotion
              dur={animDur}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        )}

        {isPulsing && (
          <circle r={isBurst ? 7 : 5} fill={strokeColor} opacity={isBurst ? 0.9 : 0.6} className="pointer-events-none filter blur-[2px]">
            <animateMotion
              dur={animDur}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        )}
      </g>

      {/* Cross-Chain Badge */}
      {crossChainLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="px-2.5 py-0.5 rounded-full bg-[#120824]/95 border border-purple-500/40 text-[10px] font-mono text-purple-300 shadow-xl backdrop-blur-md flex items-center gap-1 select-none"
          >
            <span>🌐</span>
            <span>{crossChainLabel}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
