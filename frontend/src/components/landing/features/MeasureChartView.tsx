// Generated from the landing markup by landing-port/gen.py (views.json). Do not edit by hand.
import type { Bind, Kids } from "@/components/landing/bind";

export default function MeasureChartView({ b, k }: { b: Bind; k: Kids }) {
  return (
    <div style={{"--background-image-desktop": "url('/assets/images/features/measure/chart-bg.png')", "--background-image-mobile": "url('/assets/images/features/measure/chart-bg.png')"} as React.CSSProperties} className={"lazy-background-image lazy-background-image-backgroundImage opacity-0 w-316 center-x top-88 features-measure-chart-wrapper bg-white rounded-14 h-125"} {...b("root", 0, "lazy-background-image lazy-background-image-backgroundImage opacity-0 w-316 center-x top-88 features-measure-chart-wrapper bg-white rounded-14 h-125")}>
      <div className={"absolute w-full -top-53 left-0"}>
        <div className={"transition-all mx-auto duration-[400ms] w-max bg-white/95 items-center rounded-full py-10 px-16 flex gap-12 features-measure-chart-labels backdrop-blur-md translate-y-32 opacity-0 grayscale shadow-sm border border-purple-100"} {...b("labels", 0, "transition-all mx-auto duration-[400ms] w-max bg-white/95 items-center rounded-full py-10 px-16 flex gap-12 features-measure-chart-labels backdrop-blur-md translate-y-32 opacity-0 grayscale shadow-sm border border-purple-100")}>
          <div className={"flex gap-4 text-12/16 font-600 text-violet-900 features-measure-chart-labels-item-v3"}>
            <span className="w-2 h-2 rounded-full bg-violet-700 inline-block my-auto"></span>
            {"Ingest 200ms"}
          </div>
          <div className={"h-10 w-1 bg-purple-200"}></div>
          <div className={"flex gap-4 text-12/16 font-600 text-purple-600 features-measure-chart-labels-item-mainnet"}>
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block my-auto"></span>
            {"Lasna ~1.0s"}
          </div>
          <div className={"h-10 w-1 bg-purple-200"}></div>
          <div className={"flex gap-4 text-12/16 font-600 text-fuchsia-600 features-measure-chart-labels-item-dev"}>
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 inline-block my-auto"></span>
            {"Vault 200ms"}
          </div>
        </div>
      </div>
      <div className={"overlay overflow-hidden"}>
        <div style={{"height": "100px", "opacity": "0"} as React.CSSProperties} className={"features-measure-chart-hover absolute bottom-11 -left-8 rounded-11 w-43 z-10"} {...b("hover", 0, "features-measure-chart-hover absolute bottom-11 -left-8 rounded-11 w-43 z-10")}>
          <div className={"-inset-x-[3px] bottom-0 h-[calc(100%+6px)] bg-white absolute"}></div>
          <div className={"features-measure-chart-hover-front overlay"}></div>
        </div>
        <div className={"px-50 py-19 flex items-end gap-36 features-measure-chart relative z-10 features-measure-chart-initial"} {...b("chart", 0, "px-50 py-19 flex items-end gap-36 features-measure-chart relative z-10 features-measure-chart-initial")}>
          <div className={"features-measure-chart-item flex flex-col gap-3 w-27"} {...b("item", 0, "features-measure-chart-item flex flex-col gap-3 w-27")}>
            <div style={{"height": "2px", "--index": "3", "--bar-index": "0"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "2", "--bar-index": "1"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "1", "--bar-index": "2"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
          </div>
          <div className={"features-measure-chart-item flex flex-col gap-3 w-27"} {...b("item", 1, "features-measure-chart-item flex flex-col gap-3 w-27")}>
            <div style={{"height": "2px", "--index": "6", "--bar-index": "0"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "5", "--bar-index": "1"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "4", "--bar-index": "2"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
          </div>
          <div className={"features-measure-chart-item flex flex-col gap-3 w-27"} {...b("item", 2, "features-measure-chart-item flex flex-col gap-3 w-27")}>
            <div style={{"height": "2px", "--index": "9", "--bar-index": "0"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "8", "--bar-index": "1"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "7", "--bar-index": "2"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
          </div>
          <div className={"features-measure-chart-item flex flex-col gap-3 w-27"} {...b("item", 3, "features-measure-chart-item flex flex-col gap-3 w-27")}>
            <div style={{"height": "2px", "--index": "12", "--bar-index": "0"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "11", "--bar-index": "1"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
            <div style={{"height": "2px", "--index": "10", "--bar-index": "2"} as React.CSSProperties} className={"features-measure-chart-item-bar rounded-4 backdrop-blur-4 transition-all"}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
