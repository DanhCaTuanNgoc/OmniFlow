export default function Footer() {
  return (
    <footer style={{"--body-light-loud": "#141414", "--body-light-ghost": "#A4A4A4", "--body-light-muted": "#656565"} as React.CSSProperties} className={"footer"}>
      <div className={"footer-container px-24 sm:px-32 lg:px-24 xl:px-0"}>
        <div className={"footer-header"}>
          <a href={"/"} className={"footer-brand"}>
            <img alt={"OmniFlow logo"} decoding={"async"} fetchPriority={"low"} height={"44"} src={"/assets/images/cta/logo-mark.png"} width={"44"} className={"footer-logo footer-brand-logo"} />
            <span className={"footer-brand-name"}>
              {"OmniFlow"}
            </span>
          </a>
          <a aria-label={"System status: All systems are operational"} data-footer-status={""} href={"https://kopli.reactscan.net"} className={"footer-status-pill"} target={"_blank"} rel={"noopener"}>
            <span data-footer-status-indicator={""} style={{"--status-dot": "#14A362", "--status-ring": "rgba(18, 163, 98, 0.12)", "--status-glow": "rgba(20, 163, 98, 1)"} as React.CSSProperties} className={"footer-status-indicator"}>
              <span className={"footer-status-dot"}></span>
            </span>
            <span data-footer-status-text={""} className={"footer-status-text"}>
              {"Reactive Omni & Base: Operational"}
            </span>
          </a>
        </div>
        <div aria-hidden={"true"} className={"footer-divider footer-divider-top"}></div>
        <div className={"footer-links"}>
          <nav aria-label={"Workspace"} className={"footer-section"}>
            <h2 className={"footer-section-title"}>
              {"Workspace"}
            </h2>
            <ul className={"footer-section-links"}>
              <li>
                <a href={"/workspace/studio"} className={"footer-link"}>
                  {"Studio Canvas"}
                </a>
              </li>
              <li>
                <a href={"/workspace/templates"} className={"footer-link"}>
                  {"Recipe Store"}
                </a>
              </li>
              <li>
                <a href={"/workspace/vault"} className={"footer-link"}>
                  {"ActionVault Escrow"}
                </a>
              </li>
              <li>
                <a href={"/workspace/active"} className={"footer-link"}>
                  {"Active Pipelines"}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label={"Explorers"} className={"footer-section"}>
            <h2 className={"footer-section-title"}>
              {"Explorers & Chains"}
            </h2>
            <ul className={"footer-section-links"}>
              <li>
                <a href={"https://sepolia.basescan.org"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"BaseScan (Sepolia)"}
                </a>
              </li>
              <li>
                <a href={"https://kopli.reactscan.net"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"ReactScan (Lasna Testnet)"}
                </a>
              </li>
              <li>
                <a href={"https://docs.reactive.network"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"Reactive Network Docs"}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label={"Smart Contracts"} className={"footer-section"}>
            <h2 className={"footer-section-title"}>
              {"Smart Contracts"}
            </h2>
            <ul className={"footer-section-links"}>
              <li>
                <a href={"https://github.com/Reactive-Network"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"Reactive Omni RSC"}
                </a>
              </li>
              <li>
                <a href={"/workspace/vault"} className={"footer-link"}>
                  {"ActionVault.sol"}
                </a>
              </li>
              <li>
                <a href={"/workspace/logs"} className={"footer-link"}>
                  {"Full Loop Telemetry"}
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label={"Project"} className={"footer-section"}>
            <h2 className={"footer-section-title"}>
              {"Project"}
            </h2>
            <ul className={"footer-section-links"}>
              <li>
                <a href={"https://github.com/Reactive-Network"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"Repository"}
                </a>
              </li>
              <li>
                <a href={"https://docs.reactive.network"} className={"footer-link"} target={"_blank"} rel={"noopener"}>
                  {"Buildathon Rules"}
                </a>
              </li>
              <li>
                <a href={"/workspace/studio"} className={"footer-link"}>
                  {"Launch Studio"}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div aria-hidden={"true"} className={"footer-divider footer-divider-bottom"}></div>
        <div className={"footer-meta"}>
          <p className={"footer-copyright"}>
            {"© 2026 OmniFlow · Reactive Omni Buildathon"}
          </p>
          <p className={"footer-yc"}>
            <img alt={"OmniFlow mark"} decoding={"async"} fetchPriority={"low"} height={"20"} src={"/assets/images/footer/y.png"} width={"20"} className={"footer-yc-logo"} />
            <span>
              {"powered by Reactive Omni"}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
