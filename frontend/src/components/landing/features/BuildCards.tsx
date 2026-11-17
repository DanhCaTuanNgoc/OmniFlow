"use client";

import { useEffect, useRef, useState } from "react";
import { cls, usePresence, useVisibleOnce } from "../fx";

// OmniFlow Live Pipeline Execution: 3 stages (Trigger, Reactive Omni Core, ActionVault)
// are verified in sequence. Each card's bar fills, "Verifying..." gives way to "Verified on-chain",
// and stacks into the live execution proof.
const TARGETS = ["trigger", "rsc", "vault"] as const;
type Target = (typeof TARGETS)[number];
const SUCCESS = "Verified on-chain";

interface TargetMeta {
  title: string;
  chain: string;
  bg: string;
  icon: React.ReactNode;
}

const TARGET_META: Record<Target, TargetMeta> = {
  trigger: {
    title: "Uniswap V2 Pair",
    chain: "Base Sepolia (84532)",
    bg: "bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-sm shadow-violet-500/20",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  rsc: {
    title: "OmniFlow StopLoss RSC",
    chain: "Reactive Lasna (5318007)",
    bg: "bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-sm shadow-purple-500/20",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  vault: {
    title: "ActionVault.sol SafeSweep",
    chain: "Base Sepolia Callback",
    bg: "bg-gradient-to-br from-violet-700 to-fuchsia-800 text-white shadow-sm shadow-fuchsia-500/20",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
};

const Connector = () => (
  <svg fill={"none"} height={"32"} viewBox={"0 0 14 32"} width={"14"} xmlns={"http://www.w3.org/2000/svg"}>
    <path d={"M10 13L7 16M7 16L4 19M7 16L4 13M7 16L10 19"} stroke={"#7c3aed"} strokeLinecap={"round"} strokeOpacity={"0.35"}></path>
  </svg>
);
const Tick = () => (
  <svg fill={"none"} height={"16"} viewBox={"0 0 16 16"} width={"16"} xmlns={"http://www.w3.org/2000/svg"}>
    <path clipRule={"evenodd"} d={"M8.00016 1.33325C4.31826 1.33325 1.3335 4.31802 1.3335 7.99992C1.3335 11.6818 4.31826 14.6666 8.00016 14.6666C11.6821 14.6666 14.6668 11.6818 14.6668 7.99992C14.6668 4.31802 11.6821 1.33325 8.00016 1.33325ZM10.5161 6.75543C10.7493 6.47047 10.7073 6.05045 10.4223 5.8173C10.1374 5.58415 9.71734 5.62615 9.48419 5.91111L6.95067 9.00764L6.13823 8.1952C5.87788 7.93485 5.45577 7.93485 5.19543 8.1952C4.93508 8.45555 4.93508 8.87766 5.19543 9.13801L6.52876 10.4713C6.66194 10.6045 6.84525 10.6752 7.03337 10.6658C7.22149 10.6564 7.39686 10.5679 7.51613 10.4221L10.5161 6.75543Z"} fill={"#10B981"} fillRule={"evenodd"}></path>
  </svg>
);

function Decoding({ leaveTo }: { leaveTo: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v + 1) % 4), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={cls("text-body-light-ghost w-64 absolute top-0 center-x text-center transition-all text-12 font-500", leaveTo && "opacity-0 -translate-y-10 blur-[8px]")}>
      {"Verifying state"}{".".repeat(n)}
    </span>
  );
}

function Success({ onFinish }: { onFinish: () => void }) {
  const box = useRef<HTMLSpanElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const [gap, setGap] = useState(false);
  const done = useRef(onFinish);
  done.current = onFinish;
  useEffect(() => {
    const b = box.current, w = word.current;
    if (!b || !w) return;
    const width = w.clientWidth;
    w.style.width = "0px";
    b.animate({ translate: ["0 12px", "0 0px"], filter: ["blur(8px)", "blur(0px)"], opacity: ["0", "1"] }, { duration: 500, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" });
    setGap(true);
    w.style.width = `${width}px`;
    let timer: number | undefined;
    const letters = Array.from(w.children);
    const anims = letters.map((s, i) =>
      s.animate(
        { opacity: ["0", "1"], filter: ["blur(3px) grayscale(1)", "blur(0px) grayscale(0)"], translate: ["0 8px", "0 0px"] },
        { duration: 300, easing: "cubic-bezier(0.76, 0, 0.24, 1)", delay: 100 + i * 30, fill: "forwards" },
      ),
    );
    anims[anims.length - 1]?.finished.then(() => { timer = window.setTimeout(() => done.current(), 1000); }).catch(() => {});
    return () => { clearTimeout(timer); anims.forEach((a) => a.cancel()); };
  }, []);
  return (
    <span ref={box} className={cls("absolute w-full text-[#00B36C] top-0 left-0 text-center transition-all opacity-0 flex justify-center features-build-card-completed", gap && "gap-6")}>
      <Tick />
      <span ref={word} className="transition-all whitespace-nowrap flex">
        {SUCCESS.split("").map((ch, i) => <span key={i} className="block min-w-4" style={{ opacity: 0 }}>{ch}</span>)}
      </span>
    </span>
  );
}

function Card({ index, active, leaveTo, onFinish }: { index: number; active: number; leaveTo: boolean; onFinish: () => void }) {
  const os = TARGETS[index];
  const [complete, setComplete] = useState(false);
  const decoding = usePresence(!complete, 600);
  const success = usePresence(complete, 600);
  const s = active - index;
  const style: React.CSSProperties = active !== -1
    ? { transform: `translate(0, ${s * -6}px) scale(${1 - s * 0.1})`, opacity: `${1 - s * 0.3}` }
    : { transform: leaveTo ? "translateY(250px) scale(0.6)" : "translateY(0px)", filter: leaveTo ? "blur(4px) grayscale(1)" : "blur(0px)", transitionDelay: leaveTo ? `${(TARGETS.length - index) * 100}ms` : "" };
  return (
    <div className="w-full -top-40 pt-40 h-267 overflow-hidden absolute left-0">
      <div style={style} className="py-18 px-20 bg-white rounded-20 features-build-card w-340 mx-auto text-special-mono transition-all origin-top">
        <div className="transition-all" style={{ opacity: s > 0 ? "0" : "1", transitionDelay: leaveTo ? "0ms" : "" }}>
          <div className="flex justify-between mb-20 items-center">
            <span className="text-body-light-loud text-13 font-600">{TARGET_META[os].title}</span>
            <span className="text-body-light-ghost text-11 font-mono">{TARGET_META[os].chain}</span>
          </div>
          <div className="flex gap-8 items-center">
            <div className={cls("w-52 h-32 rounded-full flex-center", TARGET_META[os].bg)}>
              {TARGET_META[os].icon}
            </div>
            <Connector />
            <div className="rounded-full bg-[#37373714] flex-1 p-2">
              <div className="h-28 bg-white rounded-full features-build-card-progress w-28" onAnimationEnd={() => setComplete(true)}></div>
            </div>
            <Connector />
            <div className={cls(
              "features-build-card-logo w-32 h-32 overflow-hidden relative transition before:transition before:mix-blend-color before:overlay before:bg-[#999999] rounded-full",
              complete ? "before:opacity-0 features-build-card-logo-completed" : "features-build-card-logo-disabled opacity-50",
            )}>
              <img alt="check" decoding="async" height="32" loading="lazy" src="/assets/images/features/build/mark.png" width="32" className="lazy-image opacity-0 !transition-none" style={{}} />
            </div>
          </div>
          <div className="mt-20 flex justify-center items-center relative h-16">
            {decoding.map((p) => <Decoding key={`d${p.key}`} leaveTo={p.leaveTo} />)}
            {success.map((p) => <Success key={`s${p.key}`} onFinish={onFinish} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot({ index, active, onFinish }: { index: number; active: number; onFinish: () => void }) {
  const items = usePresence(active >= index, 1000);
  return <>{items.map((p) => <Card key={p.key} index={index} active={active} leaveTo={p.leaveTo} onFinish={onFinish} />)}</>;
}

export default function BuildCards() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useVisibleOnce(root, () => later(() => setActive(0), 500));
  const finish = (i: number) => () => {
    const next = i + 1;
    if (next === TARGETS.length) { setActive(-1); later(() => setActive(0), 1500); } else setActive(next);
  };
  return (
    <div ref={root}>
      {TARGETS.map((_, i) => <Slot key={i} index={i} active={active} onFinish={finish(i)} />)}
    </div>
  );
}
