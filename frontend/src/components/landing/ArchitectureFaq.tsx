"use client";

import React, { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does OmniFlow automate on-chain actions?",
    answer:
      "A Reactive Smart Contract subscribes to on-chain events. When a matching Base Sepolia event meets the configured conditions, it requests a callback through Reactive Omni.",
    tag: "Autonomic Architecture",
  },
  {
    question: "How is gas managed for cross-chain execution?",
    answer:
      "Each deployed Reactive Smart Contract maintains an lREACT gas balance on Reactive Omni Lasna. Autonomic event processing consumes lREACT, while destination execution on Base Sepolia is delivered through the official Reactive Callback Proxy. ActionVault includes gas safety limits to protect against gas griefing.",
    tag: "Gas Economics",
  },
  {
    question: "How is the ActionVault protected against unauthorized callbacks?",
    answer:
      "ActionVault implements dual-check authorization: first, msg.sender must match the official Reactive Callback Proxy address on Base Sepolia; second, rscCaller must be explicitly registered in authorizedRSCs[rscCaller] == true by the vault owner. Any untrusted callback transaction reverts immediately.",
    tag: "Security Invariants",
  },
  {
    question: "How does OmniFlow limit repeated triggers?",
    answer:
      "After the stop-loss contract triggers, it uses block timestamps to skip further triggers until the configured cooldown expires.",
    tag: "Cooldown",
  },
  {
    question: "Can I recover funds if the OmniFlow frontend is ever offline?",
    answer:
      "Yes. The owner can call emergencyWithdraw() directly on Base Sepolia to return the vault's ETH balance to the owner wallet.",
    tag: "Non-Custodial Guarantee",
  },
];

export default function ArchitectureFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="motion-section faq-section" aria-label="Architecture FAQ">
      <div className="motion-section-header scroll-reveal">
        <span className="motion-coord-tag">0x05 // TECHNICAL_FAQ</span>
        <div className="motion-badge-pill">
          <span className="motion-badge-dot" />
          <span>Technical Reference</span>
        </div>
        <h2 className="motion-section-title">Frequently Asked Questions</h2>
        <p className="motion-section-subhead">
          In-depth technical answers regarding OmniFlow's decentralized cross-chain architecture,
          gas lifecycle, and security guarantees.
        </p>
      </div>

      <div className="faq-list">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`faq-card scroll-reveal scroll-stagger-${Math.min(i + 1, 5)} ${isOpen ? "open" : ""}`}
              onClick={() => toggle(i)}
            >
              <div className="faq-question-row">
                <div className="faq-q-text-group">
                  <span className="faq-tag">{faq.tag}</span>
                  <h3 className="faq-question">{faq.question}</h3>
                </div>
                <button
                  type="button"
                  className="faq-toggle-btn"
                  aria-expanded={isOpen}
                  aria-label="Toggle answer"
                >
                  <i className={`fa-solid fa-chevron-down ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {isOpen && (
                <div className="faq-answer-wrapper">
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
