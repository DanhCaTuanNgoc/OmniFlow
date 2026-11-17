// Generated from the landing markup by landing-port/gen.py (views.json). Do not edit by hand.
import Link from "next/link";
import type { Bind, Kids } from "@/components/landing/bind";

export default function HeaderPanelView({ b, k }: { b: Bind; k: Kids }) {
  return (
    <div style={{"top": "-10000px", "left": "-10000px", "width": "472px", "display": "none"} as React.CSSProperties} className={"header-products-dropdown-portal md:block hidden fixed z-[9999] pointer-events-none"} {...b("panel", 0, "header-products-dropdown-portal md:block hidden fixed z-[9999] pointer-events-none")}>
      <div className={"relative"} {...b("variant", 0, "relative")}>
        <div className={"relative"}>
          <div aria-hidden={"true"} className={"absolute -top-2 left-0 h-16 w-full"}></div>
          <div className={"rounded-16 p-6 relative backdrop-blur-16 shadow-products-dropdown-dark"}>
            <div>
              <Link href={"/workspace/studio"} className={"group/item flex items-start gap-12 rounded-12 px-12 py-10 hover:bg-white/5 hover:outline hover:outline-1 hover:outline-white/8"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/dashboard.png"} srcSet={"/assets/images-original/nav/dashboard.png 1x, /assets/images-original/nav/dashboard@2x.png 2x, /assets/images-original/nav/dashboard@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-start justify-between"}>
                    <p className={"truncate text-14/22 font-600 text-white"}>
                      {"Studio Canvas"}
                    </p>
                  </div>
                  <p className={"text-14/22 text-white/64"}>
                    {"Visual drag-and-drop reactive studio with 10-node orthogonal catalog, instant DAG validation, and 1-click deployment."}
                  </p>
                </div>
              </Link>
              <Link href={"/workspace/templates"} className={"group/item flex items-start gap-12 rounded-12 px-12 py-10 hover:bg-white/5 hover:outline hover:outline-1 hover:outline-white/8"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/compare.png"} srcSet={"/assets/images-original/nav/compare.png 1x, /assets/images-original/nav/compare@2x.png 2x, /assets/images-original/nav/compare@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-start justify-between"}>
                    <p className={"truncate text-14/22 font-600 text-white"}>
                      {"Recipe Store"}
                    </p>
                  </div>
                  <p className={"text-14/22 text-white/64"}>
                    {"Pre-built 1-click recipes for Stop-Loss DEX, Anti-Drainer SafeSweep, Whale Alert, and Portfolio Rebalancing."}
                  </p>
                </div>
              </Link>
            </div>
            <div className={"mt-6 pt-6 border-t border-white/12 text-white"}>
              <Link href={"/workspace/vault"} className={"group/item flex items-center gap-12 rounded-12 px-12 py-10 hover:bg-white/5 hover:outline hover:outline-1 hover:outline-white/8"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/cli.png"} srcSet={"/assets/images-original/nav/cli.png 1x, /assets/images-original/nav/cli@2x.png 2x, /assets/images-original/nav/cli@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-center"}>
                    <p className={"truncate text-14/22 font-600 text-white"}>
                      {"ActionVault Escrow & Panic Button"}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={"absolute inset-0 opacity-0 pointer-events-none"} {...b("variant", 1, "absolute inset-0 opacity-0 pointer-events-none")}>
        <div className={"relative"}>
          <div aria-hidden={"true"} className={"absolute -top-2 left-0 h-16 w-full"}></div>
          <div className={"rounded-16 p-6 relative border border-[var(--body-stroke-lighter)] bg-[#FFFFFFE0] backdrop-blur-12 shadow-[0px_1px_2px_0px_#00000014,_0px_4px_16px_0px_#00000014,_0px_16px_56px_0px_#00000014]"}>
            <div>
              <Link href={"/workspace/studio"} className={"group/item flex items-start gap-12 rounded-12 px-12 py-10 hover:bg-[#00000005] hover:outline hover:outline-1 hover:outline-[#0000000A]"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/dashboard-light.png"} srcSet={"/assets/images-original/nav/dashboard-light.png 1x, /assets/images-original/nav/dashboard-light@2x.png 2x, /assets/images-original/nav/dashboard-light@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-start justify-between"}>
                    <p className={"truncate text-14/22 font-600 text-[var(--body-light-loud)]"}>
                      {"Studio Canvas"}
                    </p>
                  </div>
                  <p className={"text-14/22 text-[var(--body-light-muted)]"}>
                    {"Visual drag-and-drop reactive studio with 10-node orthogonal catalog, instant DAG validation, and 1-click deployment."}
                  </p>
                </div>
              </Link>
              <Link href={"/workspace/templates"} className={"group/item flex items-start gap-12 rounded-12 px-12 py-10 hover:bg-[#00000005] hover:outline hover:outline-1 hover:outline-[#0000000A]"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/compare-light.png"} srcSet={"/assets/images-original/nav/compare-light.png 1x, /assets/images-original/nav/compare-light@2x.png 2x, /assets/images-original/nav/compare-light@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-start justify-between"}>
                    <p className={"truncate text-14/22 font-600 text-[var(--body-light-loud)]"}>
                      {"Recipe Store"}
                    </p>
                  </div>
                  <p className={"text-14/22 text-[var(--body-light-muted)]"}>
                    {"Pre-built 1-click recipes for Stop-Loss DEX, Anti-Drainer SafeSweep, Whale Alert, and Portfolio Rebalancing."}
                  </p>
                </div>
              </Link>
            </div>
            <div className={"mt-6 pt-6 border-t border-[var(--body-stroke-lighter)] text-[var(--body-light-muted)]"}>
              <Link href={"/workspace/vault"} className={"group/item flex items-center gap-12 rounded-12 px-12 py-10 hover:bg-[#00000005] hover:outline hover:outline-1 hover:outline-[#0000000A]"}>
                <div className={"grid h-36 w-36 place-items-center flex-shrink-0"}>
                  <img src={"/assets/images-original/nav/cli-light.png"} srcSet={"/assets/images-original/nav/cli-light.png 1x, /assets/images-original/nav/cli-light@2x.png 2x, /assets/images-original/nav/cli-light@3x.png 3x"} alt={""} aria-hidden={"true"} decoding={"async"} height={"36"} width={"36"} className={"h-36 w-36"} />
                </div>
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-center"}>
                    <p className={"truncate text-14/22 font-600 text-[var(--body-light-loud)]"}>
                      {"ActionVault Escrow & Panic Button"}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
