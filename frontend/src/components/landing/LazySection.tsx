"use client";

import React, { useState, useEffect, useRef } from "react";

interface LazySectionProps {
  render?: () => React.ReactNode;
  children?: React.ReactNode;
  minHeight?: string;
  className?: string;
  label?: string;
}

export default function LazySection({
  render,
  children,
  minHeight = "520px",
  className = "",
  label = "SECTION",
}: LazySectionProps) {
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    // Strict scroll-trigger: only fires when the element enters 60px inside the visible viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -60px 0px",
        threshold: 0.05,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`motion-lazy-section ${className}`}
      style={{
        minHeight: inView ? "auto" : minHeight,
        height: inView ? "auto" : minHeight,
      }}
    >
      {inView ? (
        <div className="motion-section-reveal">
          {render ? render() : children}
        </div>
      ) : (
        <div
          className="motion-skeleton-placeholder"
          style={{ height: minHeight, minHeight }}
          aria-hidden="true"
        >
          <div className="skeleton-ambient-pulse">
            <span className="skeleton-radar-dot" />
            <span className="skeleton-label">
              [ WAITING_SCROLL // {label} ]
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
