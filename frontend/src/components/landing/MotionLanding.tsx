"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import "@/styles/motion-landing.css";

// Cubic easing: easeOutCubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface StatMetricProps {
  glyph: string;
  target: number;
  suffix: string;
  decimals: number;
  label: string;
  duration: number;
  delayMs: number;
  animDelay: string;
}

function StatMetric({
  glyph,
  target,
  suffix,
  decimals,
  label,
  duration,
  delayMs,
  animDelay,
}: StatMetricProps) {
  const [val, setVal] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    let frameId: number;

    const timer = setTimeout(() => {
      const step = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = easeOutCubic(progress) * target;
        setVal(current);

        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        } else {
          setVal(target);
        }
      };

      frameId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [target, duration, delayMs]);

  return (
    <div className="motion-stat-item motion-anim" style={{ "--d": animDelay } as React.CSSProperties}>
      <span className="motion-stat-glyph" aria-hidden="true">
        {glyph}
      </span>
      <div className="motion-stat-content">
        <span className="motion-stat-value">
          {val.toFixed(decimals)}
          {suffix}
        </span>
        <span className="motion-stat-label">{label}</span>
      </div>
    </div>
  );
}

export default function MotionLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on Escape key or resize > 720
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sync menu state to body class
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  const stats = [
    {
      glyph: "<",
      target: 120,
      suffix: "ms",
      decimals: 0,
      label: "Inference Time",
      duration: 1500,
      delayMs: 480,
      animDelay: "0.5s",
    },
    {
      glyph: "%",
      target: 99.99,
      suffix: "%",
      decimals: 2,
      label: "Platform Uptime",
      duration: 1580,
      delayMs: 570,
      animDelay: "0.58s",
    },
    {
      glyph: "*",
      target: 24,
      suffix: "/7",
      decimals: 0,
      label: "Autonomous Runtime",
      duration: 1660,
      delayMs: 660,
      animDelay: "0.66s",
    },
    {
      glyph: "#",
      target: 2.4,
      suffix: "M",
      decimals: 1,
      label: "Context Windows",
      duration: 1740,
      delayMs: 750,
      animDelay: "0.74s",
    },
  ];

  return (
    <main className="motion-landing-root">
      {/* Exact Background Video */}
      <div className="motion-bg">
        <video
          className="motion-bg-video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Page (Single-Viewport Layout: Header, Hero, Stats) */}
      <div className="motion-page">
        {/* 1) Header */}
        <header className="motion-header">
          {/* Logo */}
          <Link
            href="/"
            className="motion-logo-btn"
            aria-label="Intelligence Home"
          >
            <Image
              src="/assets/logo.webp"
              alt=""
              width={52}
              height={52}
              className="motion-logo-img"
              priority
            />
          </Link>

          {/* Desktop Nav Pill (White) */}
          <nav className="motion-nav-pill" aria-label="Main Navigation">
            <Link href="/" className="motion-nav-link active">
              Home
            </Link>
            <Link href="/workspace/studio" className="motion-nav-link">
              Product
            </Link>
            <Link href="/workspace/templates" className="motion-nav-link">
              Case Studies
            </Link>
            <Link href="/workspace/vault" className="motion-nav-link">
              Contact
            </Link>
          </nav>

          {/* Sign in Button */}
          <Link
            href="/workspace/studio"
            className="motion-sign-in-btn"
          >
            Sign in
          </Link>

          {/* Mobile Burger Button */}
          <button
            type="button"
            className={`motion-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="motion-burger-bar" />
            <span className="motion-burger-bar" />
            <span className="motion-burger-bar" />
          </button>
        </header>

        {/* Mobile Menu Sheet + Overlay */}
        {menuOpen && (
          <>
            <div
              className="motion-mobile-overlay"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="motion-mobile-sheet" role="dialog" aria-modal="true">
              <Link
                href="/"
                className="motion-mobile-link active"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/workspace/studio"
                className="motion-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                Product
              </Link>
              <Link
                href="/workspace/templates"
                className="motion-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                Case Studies
              </Link>
              <Link
                href="/workspace/vault"
                className="motion-mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/workspace/studio"
                className="motion-mobile-sign-in"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </>
        )}

        {/* 2) Hero (Center) */}
        <section className="motion-hero">
          {/* Trust Row ("Trusted by 2000+ Enterprises") */}
          <div
            className="motion-trust-row motion-anim"
            style={{ "--d": "0.05s" } as React.CSSProperties}
          >
            {/* Avatar 1: Microsoft */}
            <div className="motion-trust-avatar a1" title="Microsoft">
              <div className="motion-trust-avatar-inner">
                <i className="fa-brands fa-microsoft" aria-hidden="true" />
              </div>
            </div>

            {/* Avatar 2: Amazon */}
            <div className="motion-trust-avatar a2" title="Amazon">
              <div className="motion-trust-avatar-inner">
                <i className="fa-brands fa-amazon" aria-hidden="true" />
              </div>
            </div>

            {/* Avatar 3: Google */}
            <div className="motion-trust-avatar a3" title="Google">
              <div className="motion-trust-avatar-inner">
                <i className="fa-brands fa-google" aria-hidden="true" />
              </div>
            </div>

            {/* Trust Pill */}
            <div className="motion-trust-pill">
              <span className="motion-trust-text">
                Trusted by 2000+ Enterprises
              </span>
            </div>
          </div>

          {/* Headline (Two Lines with BubbleDot Font) */}
          <h1 className="motion-headline">
            <span className="line1">Intelligence</span>
            <span className="line2">Designed To Evolve</span>
          </h1>

          {/* Subhead */}
          <p
            className="motion-subhead motion-anim"
            style={{ "--d": "0.28s" } as React.CSSProperties}
          >
            Build applications that reason, adapt and collaborate using a
            modular AI platform designed for production.
          </p>

          {/* CTA Button */}
          <Link
            href="/workspace/studio"
            className="motion-cta-btn"
            style={{ "--d": "0.4s" } as React.CSSProperties}
          >
            Get Started
          </Link>
        </section>

        {/* 3) Stats Footer (Exact 4 Metrics) */}
        <footer className="motion-stats-footer" aria-label="Key Performance Metrics">
          {stats.map((s, idx) => (
            <StatMetric key={idx} {...s} />
          ))}
        </footer>
      </div>
    </main>
  );
}
