'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { RECIPE_PRESETS } from '@/lib/recipes';

export interface NewPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlank: (name: string) => void;
  onSelectRecipe: (recipeId: string) => void;
}

export function NewPipelineModal({
  isOpen,
  onClose,
  onCreateBlank,
  onSelectRecipe,
}: NewPipelineModalProps) {
  const [pipelineName, setPipelineName] = useState('');
  const [activeTab, setActiveTab] = useState<'blank' | 'recipe'>('blank');

  useEffect(() => {
    if (isOpen) {
      setPipelineName('');
      setActiveTab('blank');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBlankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBlank(pipelineName.trim() || 'New Pipeline');
    onClose();
  };

  const handleRecipePick = (recipeId: string) => {
    onSelectRecipe(recipeId);
    onClose();
  };

  const recipesList = Object.values(RECIPE_PRESETS);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-pipeline-title"
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-[var(--ws-border)] bg-[#191c24] p-5 shadow-2xl text-[var(--ws-text)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ws-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]">
              <Plus className="size-4" />
            </div>
            <div>
              <h2 id="new-pipeline-title" className="text-sm font-semibold tracking-tight text-white">
                Create New Pipeline
              </h2>
              <p className="text-xs text-[var(--ws-muted)]">
                Start from a clean pipeline or initialize with a verified preset recipe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--ws-muted)] hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg border border-[var(--ws-border)] bg-[#111318] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('blank')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'blank'
                ? 'bg-[var(--ws-panel)] text-white shadow-sm font-semibold'
                : 'text-[var(--ws-muted)] hover:text-white'
            }`}
          >
            <Layers className="size-3.5" />
            <span>Blank Pipeline</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recipe')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'recipe'
                ? 'bg-[var(--ws-panel)] text-white shadow-sm font-semibold'
                : 'text-[var(--ws-muted)] hover:text-white'
            }`}
          >
            <Sparkles className="size-3.5 text-[var(--ws-accent)]" />
            <span>Preset Recipes ({recipesList.length})</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'blank' ? (
          <form onSubmit={handleBlankSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label htmlFor="blank-pipeline-name" className="block text-xs font-medium text-[var(--ws-muted)]">
                Pipeline Name (Optional)
              </label>
              <input
                id="blank-pipeline-name"
                type="text"
                autoFocus
                maxLength={120}
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="e.g. My Arbitrage Pipeline"
                className="w-full rounded-md border border-[var(--ws-border)] bg-[#111318] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[var(--ws-accent)] focus:outline-none focus:ring-0"
              />
            </div>
            <p className="text-xs text-[var(--ws-muted)] leading-relaxed">
              Creates an empty pipeline workspace. You can drag and drop Triggers, Condition Guards, and Destination Actions freely in the Visual Studio.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--ws-border)]">
              <button type="button" onClick={onClose} className="ws-button">
                Cancel
              </button>
              <button type="submit" className="ws-button ws-button-primary">
                <span>Open Blank Studio</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
            {recipesList.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipePick(recipe.id)}
                className="group flex flex-col justify-between p-3 rounded-lg border border-[var(--ws-border)] bg-[#111318] hover:border-[var(--ws-accent)]/70 hover:bg-[#181b24] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-white group-hover:text-[var(--ws-accent)] transition-colors">
                    {recipe.title}
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--ws-accent-bg)] text-[var(--ws-accent)] border border-[var(--ws-accent)]/30">
                    {recipe.nodesCount} Nodes
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ws-muted)] line-clamp-2 mt-1 leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
