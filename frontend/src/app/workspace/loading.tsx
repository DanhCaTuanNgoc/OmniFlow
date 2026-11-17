import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div className="w-full h-full p-8 space-y-6 animate-pulse select-none bg-[#08090D]">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
          <div className="space-y-2">
            <div className="w-48 h-5 rounded-md bg-white/[0.06]" />
            <div className="w-72 h-3 rounded-md bg-white/[0.04]" />
          </div>
        </div>
        <div className="w-32 h-9 rounded-full bg-white/[0.05]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
        <div className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
        <div className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
        <div className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
      </div>

      <div className="h-96 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
    </div>
  );
}
