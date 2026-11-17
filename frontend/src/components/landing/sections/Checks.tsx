import Link from "next/link";

export default function Checks() {
  return (
    <section className={"pricing py-56 lg:py-120"}>
      <div className={"px-14 py-4 rounded-full text-body-light-muted bg-body-light-bg-ghost text-special-mono mb-12 w-max mx-auto"}>
        {"Defensive Architecture"}
      </div>
      <h2 className={"text-body-light-loud text-title-h2 text-center mb-36 lg:mb-56 lg-max:px-16"}>
        {"Security Invariants & "}
        <br />
        {" Zero-Custodial Protections"}
      </h2>
      <p className={"text-body-large text-body-light-muted max-w-628 px-14 mb-36 md:mb-72 mx-auto text-center"}>
        {"Every invariant is "}
        <b className={"text-body-light-loud"}>
          {"100% on-chain and mathematically verifiable"}
        </b>
        {"."}
      </p>
      <div className={"flex justify-center items-center mb-36 lg:mb-56"}></div>
      <div className={"grid lg:grid-cols-3 gap-16 lg:gap-24 lg:max-w-[1128px] mx-auto lg-max:px-16 max-w-360"}>
        {/* Card 1: Callback Proxy Auth */}
        <div className={"bg-body-light-bg-ghost rounded-24 p-4 bg-body-dark-bg-ghost pricing-box-light flex flex-col justify-between"}>
          <div>
            <div className={"p-36 pt-32 rounded-20 pricing-box-name mb-32"}>
              <div className={"text-title-h5 mb-12 text-body-light-loud"}>
                {"Callback Proxy Auth"}
              </div>
              <p className={"text-body-normal text-body-light-muted"}>
                {"Origin & destination verification, "}
                <br />
                {" layer by layer."}
              </p>
            </div>
            <div className={"p-36 pt-0"}>
              <div className={"flex gap-9 items-end mb-24"}>
                <div className={"text-title-h3 text-title-no-mobile text-body-light-loud"}>
                  {"2-Way"}
                </div>
                <div className={"text-body-normal mb-8 text-body-light-muted"}>
                  {"/ Auth"}
                </div>
              </div>
              <Link href={"/workspace/vault"} className={"block"}>
                <button aria-label={"Open ActionVault"} className={"rounded-full relative button block transition-all duration-[200ms] active:duration-[50ms] button-light p-13 w-full"}>
                  <span className={"flex items-center gap-4 justify-center text-label-normal text-body-light-loud"}>
                    {"Open ActionVault"}
                  </span>
                </button>
              </Link>
              <svg fill={"none"} height={"2"} viewBox={"0 0 280 2"} width={"280"} className={"my-31 w-full text-body-stroke-muted"} xmlns={"http://www.w3.org/2000/svg"}>
                <line stroke={"currentColor"} strokeDasharray={"0.01 6"} strokeLinecap={"round"} strokeWidth={"1.5"} x1={"0.75"} x2={"279.25"} y1={"1.25"} y2={"1.25002"}></line>
              </svg>
              <div className={"text-special-mono mb-24 text-body-light-muted"}>
                {"Auth invariants:"}
              </div>
              <div className={"flex flex-col gap-16"}>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"msg.sender verified"}</b>{" against Reactive Callback Proxy"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"authorizedRSCs whitelist"}</b>{" checked before execution"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Reverts immediately"}</b>{" on unauthorized direct calls"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Dual-way event mirroring:"}</b>{" Executed & Failed"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Payload decoding"}</b>{" validated against strict ABI schema"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"nonReentrant guard"}</b>{" on all vault execution paths"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Stateless Cooldown Protection (Featured Dark Card) */}
        <div className={"bg-body-light-bg-ghost rounded-24 p-4 bg-body-light-loud pricing-box-dark flex flex-col justify-between"}>
          <div>
            <div className={"p-36 pt-32 rounded-20 pricing-box-name mb-32"}>
              <div className={"text-title-h5 mb-12 text-white/88"}>
                {"Stateless Cooldown"}
              </div>
              <p className={"text-body-normal text-body-light-ghost"}>
                {"Burst protection for "}
                <br />
                {" 200ms blocks on Base Sepolia."}
              </p>
            </div>
            <div className={"p-36 pt-0"}>
              <div className={"flex gap-9 items-end mb-24"}>
                <div className={"text-title-h3 text-title-no-mobile text-white/88"}>
                  {"200ms"}
                </div>
                <div className={"text-body-normal mb-8 text-body-light-ghost"}>
                  {"/ Protection"}
                </div>
              </div>
              <Link href={"/workspace/templates"} className={"block"}>
                <button aria-label={"Explore Recipes"} className={"rounded-full relative button block transition-all duration-[200ms] active:duration-[50ms] button-primary p-13 w-full"}>
                  <span className={"flex items-center gap-4 justify-center text-label-normal text-body-dark-label"}>
                    {"Explore Recipes"}
                  </span>
                </button>
              </Link>
              <svg fill={"none"} height={"2"} viewBox={"0 0 280 2"} width={"280"} className={"my-31 w-full text-white/12"} xmlns={"http://www.w3.org/2000/svg"}>
                <line stroke={"currentColor"} strokeDasharray={"0.01 6"} strokeLinecap={"round"} strokeWidth={"1.5"} x1={"0.75"} x2={"279.25"} y1={"1.25"} y2={"1.25002"}></line>
              </svg>
              <div className={"text-special-mono mb-24 text-body-light-ghost"}>
                {"Cooldown invariants:"}
              </div>
              <div className={"flex flex-col gap-16"}>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Timestamp delta guard:"}</b>{" block.timestamp - lastTriggered"}
                  </div>
                </div>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Eliminates callback storms"}</b>{" across fast Denim blocks"}
                  </div>
                </div>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Atomic early exit"}</b>{" inside react() before callback dispatch"}
                  </div>
                </div>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Stateless invariant:"}</b>{" zero state corruption on burst triggers"}
                  </div>
                </div>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Gas-efficient rejection:"}</b>{" terminates before cross-chain fees"}
                  </div>
                </div>
                <div className={"flex gap-12 text-[#707070]"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-400 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-[#999999] [&_b]:text-white/88"}>
                    <b>{"Configurable duration:"}</b>{" customized per pipeline requirements"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Live Price Re-Validation */}
        <div className={"bg-body-light-bg-ghost rounded-24 p-4 bg-body-dark-bg-ghost pricing-box-light flex flex-col justify-between"}>
          <div>
            <div className={"p-36 pt-32 rounded-20 pricing-box-name mb-32"}>
              <div className={"text-title-h5 mb-12 text-body-light-loud"}>
                {"Live Price Re-Validation"}
              </div>
              <p className={"text-body-normal text-body-light-muted"}>
                {"Guaranteed slippage protection, "}
                <br />
                {" immune to MEV sandwiches."}
              </p>
            </div>
            <div className={"p-36 pt-0"}>
              <div className={"flex gap-9 items-end mb-24"}>
                <div className={"text-title-h3 text-title-no-mobile text-body-light-loud"}>
                  {"0%"}
                </div>
                <div className={"text-body-normal mb-8 text-body-light-muted"}>
                  {"/ MEV Loss"}
                </div>
              </div>
              <Link href={"/workspace/studio"} className={"block"}>
                <button aria-label={"Launch Studio"} className={"rounded-full relative button block transition-all duration-[200ms] active:duration-[50ms] button-light p-13 w-full"}>
                  <span className={"flex items-center gap-4 justify-center text-label-normal text-body-light-loud"}>
                    {"Launch Studio"}
                  </span>
                </button>
              </Link>
              <svg fill={"none"} height={"2"} viewBox={"0 0 280 2"} width={"280"} className={"my-31 w-full text-body-stroke-muted"} xmlns={"http://www.w3.org/2000/svg"}>
                <line stroke={"currentColor"} strokeDasharray={"0.01 6"} strokeLinecap={"round"} strokeWidth={"1.5"} x1={"0.75"} x2={"279.25"} y1={"1.25"} y2={"1.25002"}></line>
              </svg>
              <div className={"text-special-mono mb-24 text-body-light-muted"}>
                {"Price invariants:"}
              </div>
              <div className={"flex flex-col gap-16"}>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Live reserve re-query"}</b>{" on Base Sepolia at execution time"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Strict minAmountOut"}</b>{" prevents unfavorable slippage"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Reverts execution"}</b>{" if price rebounded mid-hop"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Sandwich-proof:"}</b>{" zero profit opportunity for MEV bots"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"No stale oracles:"}</b>{" direct on-chain AMM reserve read"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Emits PriceRejection"}</b>{" with detailed expected vs actual"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Non-Custodial Panic Button & Safe Sweep (Wide Bottom Banner) */}
      <div className={"mt-24 mx-auto px-16 lg:px-0 max-w-360 lg:max-w-[1128px]"}>
        <div className={"rounded-20 bg-body-light-bg-ghost pricing-box-light"}>
          <div className={"flex flex-col lg:flex-row p-4 gap-16 lg:gap-24"}>
            <div className={"p-36 pt-32 rounded-18 pricing-box-name lg:w-1/3 flex flex-col justify-between"}>
              <div>
                <div className={"text-title-h5 mb-12 text-body-light-loud"}>
                  {"Non-Custodial Panic Button"}
                </div>
                <p className={"text-body-normal lg:mb-24 text-body-light-muted"}>
                  {"Guaranteed 1-tx asset recovery with emergencyWithdraw() & executeSafeSweep(). Funds are never locked."}
                </p>
              </div>
              <Link href={"/workspace/vault"} className={"hidden lg:block"}>
                <button aria-label={"Inspect ActionVault"} className={"rounded-full relative button block transition-all duration-[200ms] active:duration-[50ms] button-gray p-13 w-full"}>
                  <span className={"flex items-center gap-4 justify-center text-label-normal text-body-dark-label"}>
                    {"Inspect ActionVault"}
                  </span>
                </button>
              </Link>
            </div>
            <div className={"p-36 lg:w-2/3"}>
              <Link href={"/workspace/vault"} className={"block lg:hidden mb-24"}>
                <button aria-label={"Inspect ActionVault"} className={"rounded-full relative button block transition-all duration-[200ms] active:duration-[50ms] button-gray p-13 w-full"}>
                  <span className={"flex items-center gap-4 justify-center text-label-normal text-body-dark-label"}>
                    {"Inspect ActionVault"}
                  </span>
                </button>
              </Link>
              <div className={"text-special-mono mb-24 text-body-light-muted"}>
                {"Vault protections:"}
              </div>
              <div className={"grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-16"}>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Direct user ownership:"}</b>{" onlyOwner unconditional access"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Zero lockup periods:"}</b>{" withdraw at any block without delay"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Atomic recovery:"}</b>{" sweep ERC-20 tokens or ETH in 1 tx"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"No upgrade backdoors:"}</b>{" immutable code without admin proxies"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Foundry fuzz tested:"}</b>{" verified across 10,000 runs"}
                  </div>
                </div>
                <div className={"flex gap-12 text-body-light-ghost"}>
                  <svg fill={"none"} height={"22"} viewBox={"0 0 22 22"} width={"22"} className={"text-violet-600 shrink-0"} xmlns={"http://www.w3.org/2000/svg"}>
                    <path clipRule={"evenodd"} d={"M11 20.1667C16.0626 20.1667 20.1667 16.0626 20.1667 11C20.1667 5.93738 16.0626 1.83333 11 1.83333C5.93738 1.83333 1.83333 5.93738 1.83333 11C1.83333 16.0626 5.93738 20.1667 11 20.1667ZM15.0893 8.74388C15.4147 9.06932 15.4147 9.59696 15.0893 9.9224L10.506 14.5057C10.1805 14.8312 9.65289 14.8312 9.32745 14.5057L6.91078 12.0891C6.58535 11.7636 6.58535 11.236 6.91078 10.9106C7.23622 10.5851 7.76386 10.5851 8.0893 10.9106L9.91672 12.738L13.9108 8.74388C14.2362 8.41845 14.7638 8.41845 15.0893 8.74388Z"} fill={"currentColor"} fillRule={"evenodd"}></path>
                  </svg>
                  <div className={"text-body-normal [&_b]:text-label-normal text-body-light-muted [&_b]:text-body-light-loud"}>
                    <b>{"Zero off-chain keepers:"}</b>{" self-sufficient on-chain execution"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
