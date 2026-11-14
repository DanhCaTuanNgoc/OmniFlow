'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight } from 'lucide-react';

export default function ActiveAutomationsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Active Automations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor running Reactive Smart Contracts, Gas consumption & Execution counts.
          </p>
        </div>
        <Link
          href="/workspace/studio"
          className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          Create in Studio <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <p className="text-sm text-slate-300">
          Automations deployed from the Pipeline Studio will appear here with live lREACT gas gauges.
        </p>
      </div>
    </div>
  );
}
