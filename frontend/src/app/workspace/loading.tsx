import React from 'react';

export default function WorkspaceLoading() {
  return (
    <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-50 pointer-events-none">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse" />
    </div>
  );
}
