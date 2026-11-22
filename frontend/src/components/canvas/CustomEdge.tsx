'use client';

import { memo } from 'react';
import { BaseEdge, type EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { Globe2 } from 'lucide-react';

export const CustomEdge = memo(function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  interactionWidth = 20,
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

  const strokeColor = typeof data?.color === 'string' ? data.color : '#38bdf8';
  const crossChainLabel = data?.crossChainLabel as string | undefined;

  return (
    <>
      <g className="react-flow__edge-custom studio-flow-edge"
        data-simulation-pulse={data?.isBurst ? '' : undefined}
        data-flow-traversed={data?.isTraversed ? '' : undefined}
        data-monitoring-edge={data?.monitoring ? '' : undefined}>
        {selected && <path aria-hidden="true" d={edgePath} fill="none"
          stroke="var(--ws-accent)" strokeWidth={8} strokeOpacity={0.24} strokeLinecap="round"
          className="pointer-events-none" />}
        <BaseEdge
          id={id}
          path={edgePath}
          interactionWidth={interactionWidth}
          className="studio-flow-edge-wire"
          strokeLinecap="round"
          style={{ stroke: selected ? 'var(--ws-accent)' : strokeColor, strokeWidth: selected ? 2.5 : 2, ...style }}
        />

        <path
          aria-hidden="true"
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray="5 8"
          className="studio-flow-edge-stream pointer-events-none"
        />
        <path
          aria-hidden="true"
          d={edgePath}
          pathLength={100}
          fill="none"
          stroke={strokeColor}
          strokeWidth={3.5}
          strokeDasharray="24 120"
          strokeLinecap="round"
          className="studio-flow-edge-signal pointer-events-none"
        />
        <circle aria-hidden="true" cx={targetX} cy={targetY} r={3.5} fill={strokeColor}
          className="studio-flow-edge-target pointer-events-none" />
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
            <Globe2 aria-hidden="true" className="size-3" />
            <span>{crossChainLabel}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
