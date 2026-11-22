'use client';

import { useReactFlow, useStore } from '@xyflow/react';
import { LayoutGrid, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';

type CanvasActionDockProps = {
  isSnapshot: boolean;
  isPaletteOpen: boolean;
  hasNodes: boolean;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  onTogglePalette: () => void;
  onClear: () => void;
};

const button = 'inline-flex h-9 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40';

export function CanvasActionDock({
  isSnapshot, isPaletteOpen, hasNodes, selectedNodeIds, selectedEdgeIds, onTogglePalette, onClear,
}: CanvasActionDockProps) {
  const { deleteElements, fitView, zoomIn, zoomOut } = useReactFlow();
  const zoom = useStore(state => state.transform[2]);
  const minZoom = useStore(state => state.minZoom);
  const maxZoom = useStore(state => state.maxZoom);
  const percent = Math.round(zoom * 100);
  const selectedCount = selectedNodeIds.length + selectedEdgeIds.length;
  const deleteLabel = selectedCount > 1 ? 'Delete ' + selectedCount + ' selected items'
    : selectedNodeIds.length ? 'Delete node'
    : selectedEdgeIds.length ? 'Delete connection' : 'Select a node or connection to delete';

  return (
    <div role="group" aria-label="Canvas controls"
      className="nopan nodrag nowheel absolute bottom-5 left-1/2 z-[5] flex w-max max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--ws-border)] bg-[#13151c]/95 px-1 py-0.5 shadow-xl backdrop-blur-md [scrollbar-width:none]">
      {!isSnapshot && (
        <>
          <button type="button" aria-label="Node catalog" title="Node catalog" aria-pressed={isPaletteOpen}
            aria-controls="studio-node-palette" onClick={onTogglePalette}
            className={button + (isPaletteOpen ? ' !border-[var(--ws-accent)]/40 bg-[var(--ws-accent-bg)] !text-[var(--ws-accent)]' : '')}>
            <LayoutGrid aria-hidden="true" className="size-4" />
            <span className="studio-dock-label">Catalog</span>
          </button>
          <button type="button" aria-label={deleteLabel} title={deleteLabel} disabled={selectedCount === 0}
            onClick={() => void deleteElements({
              nodes: selectedNodeIds.map(id => ({ id })), edges: selectedEdgeIds.map(id => ({ id })),
            })}
            className={button + ' ml-2' + (selectedCount ? ' !border-rose-500/30 bg-rose-500/10 !text-rose-300 hover:bg-rose-500/20' : '')}>
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </>
      )}

      <div className={'flex shrink-0 items-center gap-0.5 ' + (isSnapshot ? '' : 'border-x border-[var(--ws-border)] px-1')}>
        <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom <= minZoom}
          className={button} onClick={() => void zoomOut({ duration: 250 })}>
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <button type="button" aria-label={'Fit view. Current zoom ' + percent + '%'} title="Fit view" disabled={!hasNodes}
          className={button + ' w-11 tabular-nums'} onClick={() => void fitView({ padding: 0.2, duration: 250 })}>
          {percent}%
        </button>
        <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= maxZoom}
          className={button} onClick={() => void zoomIn({ duration: 250 })}>
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>

      {!isSnapshot && (
        <button type="button" aria-label="Clear canvas" title="Clear canvas" disabled={!hasNodes} className={button} onClick={onClear}>
          <RotateCcw aria-hidden="true" className="size-4" />
          <span className="studio-dock-label">Clear</span>
        </button>
      )}
    </div>
  );
}
