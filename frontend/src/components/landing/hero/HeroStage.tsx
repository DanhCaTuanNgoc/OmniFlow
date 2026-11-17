"use client";

import { useEffect, useRef, useState } from "react";
import type { Bind, Kids } from "@/components/landing/bind";
import { swap } from "@/components/landing/bind";
import HeroStageView from "./HeroStageView";

const ACT_DURATION_MS = 5000;
const TOTAL_ACTS = 3;

const CAPTIONS: [string, React.ReactNode][] = [
  ["Listen to Events", <>Origin chain event triggers on <br /> Base Sepolia 200ms blocks.</>],
  ["Compute on Lasna", <>Autonomous Reactive Smart Contract <br /> state machine with zero keepers.</>],
  ["Execute Callback", <>Non-custodial ActionVault <br /> callback proxy execution.</>],
];

export default function HeroStage() {
  const [act, setAct] = useState(0);
  const bar = useRef<HTMLDivElement | null>(null);
  const startTime = useRef<number>(Date.now());
  const activeActRef = useRef<number>(0);

  useEffect(() => {
    activeActRef.current = act;
    startTime.current = Date.now();
  }, [act]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / ACT_DURATION_MS, 1);

      if (bar.current) {
        bar.current.style.width = `${((activeActRef.current + progress) / TOTAL_ACTS) * 100}%`;
      }

      if (elapsed >= ACT_DURATION_MS) {
        const next = (activeActRef.current + 1) % TOTAL_ACTS;
        activeActRef.current = next;
        startTime.current = Date.now();
        setAct(next);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const b: Bind = (key, i, base) => {
    const on = i === act;
    switch (key) {
      case "tab":
        return {
          className: swap(base, ["hero-tabs-item-active"], [on && "hero-tabs-item-active"]),
          onClick: () => {
            activeActRef.current = i;
            startTime.current = Date.now();
            setAct(i);
          },
        };
      case "tabIcon":
        return { className: swap(base, ["opacity-64", "group-hover:opacity-90"], [!on && "opacity-64 group-hover:opacity-90"]) };
      case "tabText":
        return { className: swap(base, ["opacity-60", "group-hover:opacity-90"], [!on && "opacity-60 group-hover:opacity-90"]) };
      case "bar":
        return { ref: bar };
    }
    return {};
  };

  const k: Kids = (key) => {
    if (key === "capTitle") return CAPTIONS[act][0];
    if (key === "capText") return CAPTIONS[act][1];
    return undefined;
  };

  return <HeroStageView b={b} k={k} act={act} />;
}
