'use client';

import React from 'react';

export function PageBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden -z-10">
      {/* Canary Ultra-Fidelity Photographic Lights Layer */}
      <div className="page-background h-[2300px] md:h-[2850px] w-full overflow-hidden absolute top-0 left-0 -z-10 select-none pointer-events-none">
        <img
          decoding="async"
          fetchPriority="high"
          src="/assets/images/page-background-lights.png"
          width="1530"
          alt="Ambient Lighting"
          aria-hidden="true"
          className="center-x max-w-unset top-0 opacity-90 md:opacity-100"
        />
      </div>

      {/* Header Silhouette Vectors */}
      <div className="h-80 md:h-120 header-placeholder relative overflow-hidden pointer-events-none">
        <img
          alt="Header background vector"
          decoding="async"
          fetchPriority="high"
          height="88"
          src="/assets/images/header/vector.png"
          width="1440"
          aria-hidden="true"
          className="bottom-0 hidden md:block center-x max-w-unset opacity-60"
        />
        <img
          alt="Mobile header background vector"
          decoding="async"
          fetchPriority="high"
          height="65"
          src="/assets/images/header/vector-mobile.png"
          width="390"
          aria-hidden="true"
          className="bottom-0 md:hidden left-0 absolute max-w-unset opacity-60"
        />
      </div>

      {/* Subtle Engineering Mesh / Dot Alignment */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139, 92, 246, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Mid & Lower Ambient Refractions */}
      <div className="absolute top-[1800px] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-violet-500/[0.06] via-indigo-400/[0.04] to-transparent blur-[140px] rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-violet-400/[0.05] blur-[130px] rounded-full" />
    </div>
  );
}
