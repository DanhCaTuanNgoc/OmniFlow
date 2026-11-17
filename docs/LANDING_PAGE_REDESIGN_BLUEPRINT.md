# OmniFlow Landing Page — Bảng Thiết Kế May Đo
## Chuyển thể Portal Canary → OmniFlow: "The Zapier of Web3"
### Ngày tạo: 17/11/2026 | Phiên bản: 1.0

---

> **TÓM TẮT:**  
> Portal Canary KHÔNG dùng template — là landing page custom-built hoàn toàn, generated bởi Python script (`landing-port/gen.py`).  
> Styling = **Tailwind CSS v4** + **custom CSS thuần ~144KB** (design tokens, typography scale, animations).  
> Animation = **Vanilla JS** (`rAF` + `IntersectionObserver`) + **Framer Motion** (chỉ header).  
> Tài liệu này map 1:1 từng section Canary → OmniFlow, đánh giá: **GIỮ** / **SỬA** / **THAY MỚI**.

---

## MỤC LỤC

1. [Phân tích Tech Stack gốc (Portal Canary)](#1-phân-tích-tech-stack-gốc-portal-canary)
2. [Identity Shift: Canary → OmniFlow](#2-identity-shift-canary--omniflow)
3. [Design Tokens mới](#3-design-tokens-mới)
4. [Section Map tổng quan](#4-section-map-tổng-quan)
5. [Chi tiết từng Section](#5-chi-tiết-từng-section)
6. [Animation Specification](#6-animation-specification)
7. [File Structure](#7-file-structure)
8. [Phân pha triển khai](#8-phân-pha-triển-khai)
9. [Assets cần tạo mới](#9-assets-cần-tạo-mới)

---

# 1. Phân tích Tech Stack gốc (Portal Canary)

| Layer | Technology | Version | Ghi chú |
|-------|-----------|---------|---------|
| Framework | **Next.js** | 16.4.2 | App Router, React 19.3.1 |
| Styling chính | **Tailwind CSS** | v4 | PostCSS pipeline (`@tailwindcss/postcss`) |
| CSS Utilities | `clsx`, `tailwind-merge`, `class-variance-authority` | — | Merge/compose Tailwind classes |
| Animation | **Framer Motion** (`motion`) | 12.23.12 | Spring-based header animations |
| Animation (custom) | **Vanilla JS + rAF + IntersectionObserver** | — | `fx.ts`, `LandingRuntime.tsx` |
| Component library | **shadcn/ui** (Radix UI) | `new-york` style | Chỉ cho dashboard, **không dùng cho landing** |
| Icons | Phosphor Icons, Lucide React, inline SVG | — | Landing dùng inline SVG thuần |
| CSS Animations | **Custom CSS thuần** (`landing.css`) | — | 144KB+ compiled CSS |

### Kiến trúc Component Pattern

Mọi section landing đều có comment `// Generated from the landing markup by landing-port/gen.py`.

**Workflow thực tế:**
1. UI ban đầu được thiết kế/code ở đâu đó (HTML tĩnh hoặc design tool)
2. Script `landing-port/gen.py` parse markup nguồn → generate ra React TSX components
3. Mỗi component có cặp file: **Logic** (`*.tsx`) + **View** (`*View.tsx`)
4. Views nhận `Bind` và `Kids` functions để gắn dynamic behavior mà không sửa markup

### Hệ thống Animation Runtime

| Feature | Implementation |
|---------|---------------|
| Frame loop | `requestAnimationFrame` + `IntersectionObserver` — chỉ chạy khi element visible |
| Lazy loading | `LandingRuntime.tsx` — MutationObserver + IntersectionObserver cho `.lazy-image`, `.lazy-background-image` |
| Enter/Leave transitions | `usePresence()` hook tự viết — clone logic kiểu Framer Motion |
| Canvas rendering | `setupCanvas()` — DPR-aware 2D canvas cho charts/gauges |
| Visibility tracking | CSS class `.is-visible` toggle qua IntersectionObserver |

---

# 2. Identity Shift: Canary → OmniFlow

| Dimension | Portal Canary | OmniFlow |
|-----------|--------------|----------|
| **Tagline** | "Test, Diff and Ship your Portaldot Runtime" | **"The Zapier of Web3: No-Code Cross-Chain Automation"** |
| **Core metaphor** | Medical canary (diagnostics, checks, diffs) | **Flowing pipeline** (nodes, edges, automation streams) |
| **Hero visual** | Video of CLI terminal diffs | **Interactive mini-canvas** with animated nodes + photon pulse edges |
| **Target emotion** | "My runtime is safe" (relief, trust) | **"Set it and forget it"** (empowerment, automation magic) |
| **Color mood** | Deep space purple (`#151738`) + white | **Deep navy** (`#0A0E1A`) + **electric cyan** (`#00D4FF`) + **pulse green** (`#3CDF7D`) |
| **Primary font** | Plus Jakarta Sans | **Plus Jakarta Sans** (giữ — excellent for Web3) |

---

# 3. Design Tokens mới

```css
/* === OmniFlow Design Tokens === */
:root {
  /* Backgrounds */
  --omni-bg-deep:       #0A0E1A;    /* Page background */
  --omni-bg-card:       #111827;    /* Card surfaces */
  --omni-bg-ghost:      #1A1F2E;    /* Subtle card bg */
  --omni-bg-glass:      rgba(255, 255, 255, 0.04);

  /* Accents */
  --omni-cyan:          #00D4FF;    /* Primary accent — edges, CTAs */
  --omni-green:         #3CDF7D;    /* Success, active nodes */
  --omni-orange:        #F79942;    /* Warning, gas low */
  --omni-red:           #FF4D6A;    /* Error, flash crash */
  --omni-purple:        #8B5CF6;    /* Reactive Network brand */

  /* Text */
  --omni-text-loud:     rgba(255, 255, 255, 0.95);
  --omni-text-normal:   rgba(255, 255, 255, 0.72);
  --omni-text-muted:    rgba(255, 255, 255, 0.48);

  /* Strokes */
  --omni-stroke:        rgba(255, 255, 255, 0.08);
  --omni-stroke-active: rgba(0, 212, 255, 0.3);

  /* Gradients */
  --omni-gradient-hero: linear-gradient(135deg, #0A0E1A 0%, #0F172A 50%, #1E1B4B 100%);
  --omni-gradient-cta:  linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
}
```

---

# 4. Section Map tổng quan

| # | Canary Section | Action | OmniFlow Section | Lý do |
|---|---------------|--------|-------------------|-------|
| 1 | `HeaderBar` | ✏️ SỬA | `HeaderBar` | Đổi logo, nav items, CTA button |
| 2 | `PageBackground` | ✏️ SỬA | `PageBackground` | Đổi gradient colors, thêm animated grid |
| 3 | `Hero` | 🔄 THAY MỚI | `Hero` | Thay video terminal bằng interactive mini-canvas pipeline |
| 4 | `Surfaces` (Wall) | 🔄 THAY MỚI | `LiveMetrics` | Thay "Portaldot surfaces" bằng live blockchain stats |
| 5 | `AlsoAvailable` | 🔄 THAY MỚI | `HowItWorks` | 3-step "Design → Deploy → Forget" flow |
| 6 | `Features` | ✏️ SỬA | `Features` | Giữ layout grid 2-col, thay nội dung thành 10-Node Catalog |
| 7 | `GetStarted` (CTA) | 🔄 THAY MỚI | `CTA` | CTA branding OmniFlow |
| 8 | `Checks` | 🔄 THAY MỚI | `Security` | 4 defensive patterns (Callback Auth, Cooldown, Price Re-Val, Panic) |
| 9 | `Faq` | ✏️ SỬA | `Faq` | Giữ accordion, thay nội dung Q&A |
| 10 | `Simpler` | 🔄 THAY MỚI | `Templates` | 6 recipe template cards showcase |
| 11 | `Footer` | ✏️ SỬA | `Footer` | Đổi links, branding |

**Tổng kết:**
- ✅ GIỮ NGUYÊN: `fx.ts`, `bind.ts`, `LandingRuntime.tsx`, `spring.ts`, breakpoints, typography scale
- ✏️ SỬA (5 sections): Header, PageBackground, Features, Faq, Footer
- 🔄 THAY MỚI (6 sections): Hero, LiveMetrics, HowItWorks, Templates, Security, CTA

---

# 5. Chi tiết từng Section

---

## 5.1 `HeaderBar` — ✏️ SỬA

**Giữ lại từ Canary:** Skeleton layout, sticky behavior, spring animation, glassmorphism blur, mobile hamburger menu.

| Element | Canary | OmniFlow |
|---------|--------|----------|
| Logo | Portal Canary PNG | OmniFlow logo (flow icon + wordmark) |
| Nav items | Tools, Docs, Runs, Plan | **Studio**, **Templates**, **Docs**, **Pricing** |
| CTA button | "GitHub" + "Try it" | **"Launch App"** (gradient cyan→purple) + "GitHub" (ghost) |
| Panel dropdown | CLI + Dashboard + Compare tools | **Pipeline Studio**, **Template Library**, **Vault Manager** |
| Color | White/80 text on transparent | Giữ nguyên, đổi accent sang `--omni-cyan` |

---

## 5.2 `PageBackground` — ✏️ SỬA

**Giữ lại:** CSS gradient background structure, radial glow effects.

**Thay đổi:**
- Background gradient: `--omni-gradient-hero` (deep navy → indigo)
- Thêm animated grid pattern (subtle dot grid) gợi nhớ canvas/flow editor
- Particle hiệu ứng: Thay orbit circles bằng **floating connection dots** (Brownian motion chậm)

---

## 5.3 `Hero` — 🔄 THAY MỚI HOÀN TOÀN

> **Section quan trọng nhất** — quyết định ấn tượng đầu tiên với giám khảo hackathon.

### 5.3.1 Badge
```
[ ⚡ Powered by Reactive Omni · 1s Finality ]
```
- Giữ pill shape từ Canary (`rounded-full py-4 px-8 bg-white/8`)
- Icon: lightning bolt (giữ SVG từ Canary)
- Text: "Powered by Reactive Omni · 1s Finality"

### 5.3.2 Headline
```
Build Autonomous
⟨ mini-canvas-icon ⟩ Cross-Chain
Automations
```
- Font: `text-title-h1` (74px/84px/-1.11px) — **GIỮ NGUYÊN**
- Gradient text: `--omni-gradient-cta` (cyan → purple)
- Inline element: thay logo Canary bằng **animated mini flow icon** (3 nodes connected)

### 5.3.3 Subtitle
```
"Drag, drop, deploy. Your pipelines run 24/7 on Reactive Omni —
no code, no keepers, no sleep lost."
```
- Style: `text-body-large text-body-dark-loud` — **GIỮ NGUYÊN**

### 5.3.4 CTA Buttons
```
[ 🚀 Launch Studio ]   [ 📖 Read Docs ]
```
- Primary: `button-primary` nhưng gradient `--omni-gradient-cta`
- Secondary: `button-dark` — giữ nguyên

### 5.3.5 Hero Visual — ⭐ INTERACTIVE MINI-CANVAS

Thay video terminal diff của Canary bằng **animated pipeline mockup** chạy tự động:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐    ═══⚡═══►    ┌──────────┐    ═══⚡═══►    ┌──────────┐  │
│  │ 📡 Watch │                │ 🔍 Price │                │ 🔄 DEX   │  │
│  │ DEX Price│                │ Threshold│                │   Swap   │  │
│  │  [LIVE]  │                │ ≤ $1,800 │                │ ETH→USDC │  │
│  └──────────┘                └──────────┘                └──────────┘  │
│                                                                        │
│  ◀── Photon pulses flow along edges ──►                                │
│  Nodes glow green when "triggered"                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- **KHÔNG dùng @xyflow/react** (quá nặng cho landing page)
- Render bằng **pure SVG + CSS animations** (giống cách Canary dùng thuần CSS)
- 3 nodes: Trigger → Condition → Action (đúng Typed Port spec của OmniFlow)
- Edges: SVG `<path>` với CSS `stroke-dasharray` animation (photon pulse)
- Nodes cycle qua states: `idle` → `listening` → `evaluating` → `executing` → `cooldown` (5-state loop, 8 giây mỗi chu kỳ)
- State colors: `idle=#1A1F2E`, `listening=#0A0E1A+cyan-border`, `evaluating=#F79942-glow`, `executing=#3CDF7D-glow`, `cooldown=#8B5CF6-glow`

**3 Tabs bên trên (giữ cấu trúc HeroStage tabs từ Canary):**

| Tab | Animation scenario |
|-----|-------------------|
| **Stop-Loss** | Watch Price → Threshold ≤$1800 → DEX Swap ETH→USDC |
| **Whale Alert** | Watch Transfers → Balance >500 ETH → Webhook Notify |
| **Auto-Rebalance** | Periodic Cron 24h → Balance Check → DEX Swap 50/50 |

---

## 5.4 `LiveMetrics` — 🔄 THAY MỚI (thay thế Surfaces/Wall)

**Concept:** Thay "Live surfaces against Portaldot nodes" bằng **live blockchain metrics dashboard**.

### Layout: Strip ngang 4 cards

| Metric Card | Data Source | Animation |
|-------------|------------|-----------|
| **Reactive Omni** | `lasnaBlockHeight` via RPC | Block number counting up + "~1.04s" badge |
| **Base Sepolia** | `baseSepoliaBlockHeight` via RPC | Block number counting + "200ms" badge |
| **Active Pipelines** | Backend API / mock | Counter with spring animation |
| **Network Status** | Health check | Green pulse dot + "Healthy" / "Degraded" |

**Style:** Giữ `bg-body-light-bg-ghost rounded-24` card style từ Canary features.

**Headline:**
```
Every automation, powered by
⟨ ═══⚡═══ ⟩ 1-second finality
```

---

## 5.5 `HowItWorks` — 🔄 THAY MỚI (thay thế AlsoAvailable)

**Concept:** 3-step visual flow giải thích cách OmniFlow hoạt động.

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  1. DESIGN  │  ════►  │  2. DEPLOY  │  ════►  │  3. FORGET  │
│             │         │             │         │             │
│ Drag & drop │         │  1-Click    │         │  Runs 24/7  │
│ nodes on    │         │  compile &  │         │  on-chain   │
│ canvas      │         │  deploy RSC │         │  autonomous │
│             │         │             │         │             │
│ [Animation: │         │ [Animation: │         │ [Animation: │
│  Canvas     │         │  Contract   │         │  Pulse      │
│  building]  │         │  deploying] │         │  heartbeat] │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Animation per card:**
1. **Design:** Nodes dropping in one by one, edges connecting with spring physics
2. **Deploy:** Spinning gear → checkmark → contract address appearing
3. **Forget:** Steady heartbeat pulse (IntersectionObserver triggers CSS pulse)

---

## 5.6 `Features` — ✏️ SỬA (thay nội dung, giữ layout)

### Section Header
```
Badge:   [ Features ]
Title:   "The automation stack"
Subtitle: "10 precision-crafted nodes that cover every DeFi scenario —
           from flash crash protection to whale tracking."
```

### Feature Cards (2×2 grid, top)

| Card | Canary equivalent | OmniFlow content | Animation |
|------|------------------|-------------------|-----------|
| **Card 1** | "Speaks the chain" (BuildCards) | **"Watch Everything On-Chain"** — Watch DEX Price + Watch Transfers nodes | Animated price ticker counting down, flash red at threshold |
| **Card 2** | "Catch hazards" (Code magnifier) | **"Smart Conditions"** — Price Threshold + Logic Gate + Cooldown Guard | Logic gate diagram with AND/OR icons flipping states |
| **Card 3** | "Catch regressions" (SmokeChecks) | **"Execute Instantly"** — DEX Swap + Safe Sweep + Notify | Swap animation: ETH icon morphing into USDC icon |
| **Card 4** | "Upgrades with liveness" (AutoUpgrade) | **"Set It and Forget It"** — Pipeline running 24/7 | Heartbeat pulse + uptime counter `32d 14h 22m` |

### Feature Cards (2-column, bottom)

| Canary card | OmniFlow replacement |
|-------------|---------------------|
| Attestation | **"Non-Custodial Vault"** — Your keys, your funds, emergency withdraw anytime |
| Blast radius | **"Cross-Chain Reactive"** — Base Sepolia events trigger Lasna RSC in ~1 second |
| No install | **"No Code Required"** — Visual drag & drop generates Solidity automatically |
| Supply conserved | **"Gas Management"** — Monitor lREACT balance, 1-click refuel |

### Info Strip (6 items, bottom)

| Canary | OmniFlow |
|--------|----------|
| GitHub Action | **12 Real Scenarios** — From stop-loss to whale tracking |
| Exit codes | **Instant Finality** — CometBFT ~1s, no reorgs |
| Contract workflows | **Template Recipes** — 1-click deploy pre-built pipelines |
| Reproducible | **Cooldown Protection** — Anti-burst guard for 200ms Base blocks |
| Reports | **Activity Logs** — Every tx hash linked to Reactscan & Basescan |
| Never cries wolf | **Panic Button** — Emergency withdraw to cold wallet in 1 tx |

---

## 5.7 `Templates` — 🔄 THAY MỚI (thay thế Simpler)

**Concept:** Showcase 6 Recipe Templates với interactive cards.

```
Badge:    [ Template Library ]
Title:    "Start automating in 10 seconds"
Subtitle: "Pre-built recipes for the most common DeFi scenarios.
           Click, customize, deploy."
```

### 6 Recipe Cards (3×2 grid)

| Recipe | Icon | Description | Pipeline |
|--------|------|-------------|----------|
| 🛡️ Flash Crash Stop-Loss | Shield | Auto-sell ETH to USDC when price drops | Watch Price → Threshold → Swap |
| 📈 Take Profit Auto | Chart up | Lock in gains at target price | Watch Price → Threshold ≥ → Swap |
| 🐋 Whale Alert Tracker | Whale | Notify when whales move >500 ETH | Watch Transfers → Notify |
| 🔒 Anti-Drainer Sweep | Lock | Emergency sweep to cold wallet on hack | Watch Transfers → Safe Sweep |
| ⚖️ Auto Rebalance Daily | Scale | Keep 50/50 ETH/USDC ratio | Cron 24h → Balance Check → Swap |
| 💰 DCA Out Weekly | Cash | Take weekly profits when market is green | Cron 7d → Price Check → Swap |

**Style:** Giữ grid layout từ Canary. Mỗi card = `bg-body-light-bg-ghost rounded-24` + hover scale 1.02.
**Animation:** Trên hover, hiện mini pipeline diagram (3 nodes connected) bên trong card.

---

## 5.8 `Security` — 🔄 THAY MỚI (thay thế Checks)

```
Badge:    [ Security ]
Title:    "Your funds. Your rules. Always."
Subtitle: "Non-custodial vaults with 4 defensive patterns
           protecting every automation."
```

### 4 Security Cards

| Card | Title | Description | Visual |
|------|-------|-------------|--------|
| 1 | **Callback Proxy Auth** | 2-way verification prevents unauthorized contract calls | Lock icon → verified checkmark animation |
| 2 | **Cooldown Protection** | Anti-burst guard prevents duplicate swaps on 200ms blocks | Timer countdown with shield |
| 3 | **Price Re-Validation** | Re-checks pool reserves at execution time against MEV | Price chart with slippage band |
| 4 | **Panic Button** | Emergency withdraw all funds to your wallet in 1 transaction | Big red button with pulse glow |

---

## 5.9 `Faq` — ✏️ SỬA

**Giữ:** Accordion component structure, layout, animation.
**Thay:** Nội dung FAQ:

| Câu hỏi | Trả lời (tóm tắt) |
|---------|-------------------|
| "What happens when I close my browser?" | RSC runs 24/7 on Reactive Omni. Your browser is just the blueprint designer. |
| "Is my money safe in the ActionVault?" | 100% non-custodial. You're the sole owner. Emergency withdraw anytime. |
| "What is Reactive Omni?" | A CometBFT blockchain with ~1s finality that listens to events on other chains. |
| "How much does it cost?" | Only gas fees: ~1.0 lREACT to deploy + Base Sepolia callback gas. |
| "What if the price moves during execution?" | Live Price Re-Validation + minAmountOut protects against slippage and MEV. |
| "Can I track my automations?" | Activity Logs show every tx hash with links to Reactscan & Basescan. |

---

## 5.10 `CTA` — 🔄 THAY MỚI (thay thế GetStarted)

```
Badge:    [ Get Started ]
Title:    "Automate your DeFi. Sleep peacefully."
Subtitle: "Connect your wallet, pick a template,
           and deploy your first automation in under 60 seconds."

Buttons:  [ 🚀 Launch Studio ]   [ 📖 Documentation ]
```

**Background:** `--omni-gradient-hero` + subtle animated grid.
**Visual below CTA:** Animated pipeline demo (simpler version of Hero animation) on a loop.

---

## 5.11 `Footer` — ✏️ SỬA

| Element | OmniFlow value |
|---------|---------------|
| Logo | OmniFlow logo + "The Zapier of Web3" |
| Links col 1 | Product: Studio, Templates, Vault, Activity Logs |
| Links col 2 | Developers: Docs, GitHub, Smart Contracts, API Reference |
| Links col 3 | Community: Twitter/X, Discord, Telegram |
| Bottom | "Built for Reactive Omni Buildathon 2026" + Reactive Network logo |

---

# 6. Animation Specification

## 6.1 Photon Pulse Edge Animation

```css
@keyframes photon-pulse {
  0%   { stroke-dashoffset: 100%; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { stroke-dashoffset: 0%; opacity: 0; }
}

.edge-pulse {
  stroke: var(--omni-cyan);
  stroke-width: 2;
  stroke-dasharray: 8 4;
  animation: photon-pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 4px var(--omni-cyan));
}
```

## 6.2 Node State Glow

```css
@keyframes node-glow {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50%      { box-shadow: 0 0 20px 4px var(--glow-color); }
}

.node-idle      { --glow-color: transparent; }
.node-listening { --glow-color: var(--omni-cyan); border-color: var(--omni-cyan); }
.node-triggered { --glow-color: var(--omni-green); animation: node-glow 1s ease; }
.node-error     { --glow-color: var(--omni-red); }
```

## 6.3 Counter Animation (for LiveMetrics)

Dùng `fx.ts` framework từ Canary:
- `frameLoop()` ticks counter mỗi 2 giây
- Spring interpolation cho smooth number transitions
- `useVisibleOnce()` trigger khi scroll vào view

---

# 7. File Structure

```
frontend/src/components/landing/
├── Landing.tsx                    # ✏️ SỬA imports
├── LandingRuntime.tsx             # ✅ GIỮ NGUYÊN
├── landing.css                    # ✏️ SỬA design tokens + colors
├── bind.ts                        # ✅ GIỮ NGUYÊN
├── fx.ts                          # ✅ GIỮ NGUYÊN
├── data.ts                        # 🔄 THAY MỚI — OmniFlow data
│
├── sections/
│   ├── HeaderBar.tsx              # ✏️ SỬA branding + nav items
│   ├── PageBackground.tsx         # ✏️ SỬA colors + grid pattern
│   ├── Hero.tsx                   # 🔄 THAY MỚI
│   ├── LiveMetrics.tsx            # 🔄 THAY MỚI (replaces Surfaces)
│   ├── HowItWorks.tsx             # 🔄 THAY MỚI (replaces AlsoAvailable)
│   ├── Features.tsx               # ✏️ SỬA content, giữ layout
│   ├── Templates.tsx              # 🔄 THAY MỚI (replaces Simpler)
│   ├── Security.tsx               # 🔄 THAY MỚI (replaces Checks)
│   ├── Faq.tsx                    # ✏️ SỬA content
│   ├── CTA.tsx                    # 🔄 THAY MỚI (replaces GetStarted)
│   └── Footer.tsx                 # ✏️ SỬA branding
│
├── hero/
│   ├── PipelineMockup.tsx         # 🔄 MỚI — SVG mini-canvas animation
│   ├── PipelineMockupView.tsx     # 🔄 MỚI — static markup
│   └── scenarios.ts              # 🔄 MỚI — 3 tab scenarios data
│
├── features/
│   ├── NodeShowcase.tsx           # 🔄 MỚI — animated node cards
│   ├── PriceTicker.tsx            # 🔄 MỚI — price countdown widget
│   └── SwapAnimation.tsx          # 🔄 MỚI — ETH→USDC morph
│
├── metrics/
│   ├── BlockCounter.tsx           # 🔄 MỚI — live block height counter
│   └── NetworkStatus.tsx          # 🔄 MỚI — health indicator
│
├── wall/                          # 🗑️ XÓA (Canary-specific)
│   └── (remove all)
│
└── header/
    ├── Header.tsx                 # ✏️ SỬA nav items
    ├── HeaderPanel.tsx            # ✏️ SỬA dropdown content
    ├── HeaderView.tsx             # ✏️ SỬA branding
    └── spring.ts                  # ✅ GIỮ NGUYÊN
```

---

# 8. Phân pha triển khai

## Phase 1: Foundation (1-2 ngày)
- [ ] Đổi design tokens trong `landing.css` (colors, gradients)
- [ ] Update `HeaderBar` (logo, nav items, CTA button)
- [ ] Update `Footer` (links, branding)
- [ ] Update `PageBackground` (gradient colors)
- [ ] Update `Faq` content

## Phase 2: Hero (2-3 ngày)
- [ ] Build `PipelineMockup.tsx` — SVG mini-canvas với 3 nodes
- [ ] CSS photon pulse edge animation
- [ ] Node state cycling (5 states, 8s loop)
- [ ] 3 scenario tabs (Stop-Loss / Whale / Rebalance)
- [ ] Hero text, badge, CTA buttons

## Phase 3: Content Sections (2-3 ngày)
- [ ] Build `LiveMetrics` — 4 metric cards with block counters
- [ ] Build `HowItWorks` — 3-step flow visualization
- [ ] Update `Features` — 10-node catalog showcase with new animations
- [ ] Build `Templates` — 6 recipe cards grid

## Phase 4: Polish (1-2 ngày)
- [ ] Build `Security` — 4 defensive pattern cards
- [ ] Build `CTA` section with gradient background
- [ ] Mobile responsive testing (all breakpoints)
- [ ] Performance audit (lazy loading, IntersectionObserver)
- [ ] Remove all Canary-specific references and assets

---

# 9. Assets cần tạo mới

| Asset | Type | Description |
|-------|------|-------------|
| `omniflow-logo.svg` | SVG | Flow icon (3 connected nodes) + "OmniFlow" wordmark |
| `omniflow-logo-mark.svg` | SVG | Icon only (for header, favicon) |
| `node-icons/*.svg` | SVG set | 10 node type icons (Watch Price, Threshold, Swap, etc.) |
| `chain-logos/*.svg` | SVG set | Base Sepolia, Reactive Omni, Ethereum logos |
| `token-icons/*.svg` | SVG set | ETH, USDC, lREACT token icons |
| `hero-poster.jpg` | Image | Fallback poster for hero section |

> **Lưu ý:** Tất cả assets nên là SVG inline để tận dụng CSS animation và tránh network requests. Portal Canary dùng PNG cho nhiều decoration images — OmniFlow nên chuyển sang SVG để nhẹ hơn và dễ animate hơn.

---

# 10. Responsive Breakpoints (giữ nguyên từ Canary)

| Token | Width | Usage |
|-------|-------|-------|
| `sm` | 576px | Mobile landscape |
| `md` | 768px | Tablet — layout shift point |
| `lg` | 957px | Desktop nav shows |
| `sm-max:` | <576px | Mobile overrides |
| `md-max:` | <768px | Tablet overrides |

---

> **Tài liệu tham chiếu:**  
> - `PROJECT_BLUEPRINT.md` §5 (Visual Pipeline Studio) & §6.1 (Landing Page spec)  
> - `docs/REACTIVEFLOW_DETAILED_FRS.md` §3.1 (Landing Page functional spec)  
> - `docs/REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md` §1.2 (Personas & value proposition)  
> - `portalcanary/frontend/components/landing/` (source code gốc)
