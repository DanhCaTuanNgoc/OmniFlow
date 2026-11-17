'use client';

import React from 'react';

export function PageBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10">
      {/* Base Light Surface */}
      <div className="absolute inset-0 bg-[#FAFAFC]" />

      {/* Technical Grid / Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Luminous Radial Mesh Glows (Obsidian Violet + Soft Indigo) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-violet-500/[0.14] via-indigo-400/[0.08] to-transparent blur-[120px] rounded-full" />
      <div className="absolute top-48 left-1/4 w-[500px] h-[350px] bg-purple-400/[0.07] blur-[100px] rounded-full" />
      <div className="absolute top-64 right-1/4 w-[450px] h-[320px] bg-violet-400/[0.08] blur-[90px] rounded-full" />

      {/* Mid-page ambient glow */}
      <div className="absolute top-[1400px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-violet-200/[0.3] via-indigo-100/[0.2] to-transparent blur-[140px] rounded-full" />

      {/* Bottom ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-violet-300/[0.12] blur-[130px] rounded-full" />
    </div>
  );
}
