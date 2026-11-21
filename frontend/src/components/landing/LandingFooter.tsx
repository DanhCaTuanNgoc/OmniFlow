"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="motion-footer-section" aria-label="Page Footer">
      {/* Final Conversion CTA Banner */}
      <div className="motion-cta-banner scroll-reveal">
        <div className="cta-banner-content">
          <div className="motion-badge-pill">
            <span className="motion-badge-dot" />
            <span>Autonomous Web3 Workflows</span>
          </div>
          <h2 className="cta-banner-title">
            Build Your First Automation
          </h2>
          <p className="cta-banner-desc">
            Start with a recipe or build an event-driven workflow in Pipeline Studio.
          </p>

          <div className="cta-banner-actions">
            <Link href="/workspace/studio" className="motion-cta-btn banner-btn-main">
              Open Pipeline Studio
            </Link>
            <Link href="/workspace/templates" className="cta-btn-secondary">
              Explore Templates
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="motion-footer-main scroll-reveal scroll-stagger-1">
        <div className="footer-top-row">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <div className="footer-logo-circle">
                <Zap className="w-4 h-4 text-black fill-black" />
              </div>
              <span className="footer-brand-name">OmniFlow</span>
            </div>
            <p className="footer-brand-tagline">
              The Zapier of Web3: No-code cross-chain automation powered by Reactive Omni.
            </p>
            <div className="footer-hackathon-badge">
              <span className="pulse-dot green" />
              <span>Set It and Forget It Track</span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="footer-links-grid">
            <div className="footer-nav-col">
              <h4 className="footer-col-title">WORKSPACE</h4>
              <ul className="footer-link-list">
                <li><Link href="/workspace/studio">Pipeline Studio</Link></li>
                <li><Link href="/workspace/active">Active Automations</Link></li>
                <li><Link href="/workspace/templates">Recipe Templates</Link></li>
                <li><Link href="/workspace/vault">ActionVault Manager</Link></li>
                <li><Link href="/workspace/logs">Live Activity Logs</Link></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-col-title">NETWORKS</h4>
              <ul className="footer-link-list">
                <li>
                  <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer">
                    Base Sepolia (84532) <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://lasna.reactscan.net" target="_blank" rel="noreferrer">
                    Reactive Lasna (5318007) <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1" />
                  </a>
                </li>
                <li>
                  <a href="https://reactive.network" target="_blank" rel="noreferrer">
                    Reactive Network Docs <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-col-title">VERIFICATION</h4>
              <ul className="footer-link-list">
                <li><a href="#proof">On-Chain Proof</a></li>
                <li><a href="#security">Vault and Callback Safeguards</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <span className="footer-copy-text">
            © 2026 OmniFlow. Built with Reactive Omni & Base Sepolia Denim. Open source under MIT.
          </span>
          <div className="footer-social-links">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <i className="fa-brands fa-github" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="X / Twitter">
              <i className="fa-brands fa-x-twitter" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord">
              <i className="fa-brands fa-discord" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
