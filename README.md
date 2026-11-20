# ⚡ OmniFlow
> **The Zapier of Web3: No-Code Cross-Chain Automation Powered by Reactive Omni**

[![Hackathon](https://img.shields.io/badge/Hackathon-Reactive%20Omni%20Buildathon-blue)](https://dev.reactive.network/)
[![Track](https://img.shields.io/badge/Track-Set%20It%20and%20Forget%20It-green)](#)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)
[![Networks](https://img.shields.io/badge/Chains-Base%20Sepolia%20%7C%20Reactive%20Lasna-orange)](#)

---

## 📌 Overview

**OmniFlow** is a decentralized, non-custodial visual automation studio that enables any Web3 user to construct event-driven cross-chain workflows without writing a single line of Solidity code.

Powered by **Reactive Omni's ~1-second CometBFT consensus** and **Base Sepolia's 200ms Denim block time**, OmniFlow continuously monitors on-chain events and executes automated financial policies (Stop-Loss, Take-Profit, Wallet Drain Protection, and Portfolio Rebalancing) 24/7/365 at consensus speed.

---

## 🏗️ Architecture & Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT WORKSPACE (Next.js 14)                   │
│   - Visual Node Canvas (@xyflow/react) with Typed Port DAG Grammar     │
│   - Real-time Cross-Chain Event Visualizer (60 FPS Photon Pulses)      │
│   - 1-Click Recipe Preset Store (Flash Crash, Drainer Defense)         │
│   - Non-Custodial ActionVault & Emergency Panic Button                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Export Pipeline JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               COMPILER & RELAYER WORKER (Node.js + Foundry)            │
│   - Dynamic Solidity Template Hydration & Bytecode Compilation         │
│   - Automated Deployment to Reactive Omni Lasna Testnet                │
│   - Relayer Gas Sponsorship (lREACT) & ActionVault Authorization       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Deployed Contracts
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MULTI-CHAIN ON-CHAIN ENGINE                    │
│                                                                        │
│   ORIGIN CHAIN (Base Sepolia - 200ms)    REACTIVE OMNI (Lasna - ~1s)   │
│   ┌───────────────────────────────┐      ┌───────────────────────────┐ │
│   │ Uniswap V2 Pair (WETH/USDC)   │      │ StopLoss_Pipeline.sol     │ │
│   │ emits Sync(reserve0, reserve1)│─────>│ - In-Flight Burst Guard   │ │
│   └───────────────────────────────┘      │ - Cooldown Rate-Limiter   │ │
│                                          │ - Emits Callback (~1s)    │ │
│   DESTINATION CHAIN (Base Sepolia)       │ - vmOnly react() logic    │ │
│   ┌───────────────────────────────┐      └─────────────┬─────────────┘ │
│   │ ActionVault.sol (Non-Custodial│                    │ Relayed via   │
│   │ - AbstractCallback Verifier   │<───────────────────┘ CallbackProxy │
│   │ - Live Price Re-Validation    │                                    │
│   │ - Executes Swap -> USDC to User                                   │
│   │ - Panic Button: Emergency Exit│                                    │
│   └───────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Core Defensive Patterns

1. **Callback Proxy Authentication:** Destination `ActionVault` verifies `msg.sender == callbackProxy` and `rscCaller == authorizedRSC`.
2. **In-Flight Callback Protection:** RSC locks a `isCallbackInFlight` guard to prevent burst storms across Base Sepolia's rapid 200ms blocks.
3. **Live Price Re-Validation:** Destination execution re-checks live pool reserves at execution time to protect against flash rebounds and MEV sandwich attacks (`minAmountOut`).
4. **Non-Custodial Panic Button:** User retains absolute ownership and can trigger `emergencyWithdraw()` unconditionally in 1 click.

---

## 📂 Repository Structure (Monorepo)

```
omniflow/
├── contracts/               # Foundry Smart Contracts (ActionVault & RSC Pipelines)
│   ├── src/                 # ActionVault.sol & StopLoss_Pipeline.sol
│   ├── test/                # Unit, Fuzzing & Fork test suites
│   ├── script/              # Deployment scripts for Base & Lasna
│   └── foundry.toml         # Foundry configuration
├── frontend/                # Next.js 14 App Router (Deployed on Vercel)
│   ├── src/app/             # Landing page & Workspace multi-screen
│   ├── src/components/      # Studio Canvas, Palette, Inspector, Vault Manager
│   └── src/hooks/           # Reactive WebSocket & Wagmi integrations
├── backend/                 # Node.js 20 LTS + Foundry Worker (Deployed on Railway)
│   ├── src/server.ts        # Express REST API + WebSocket Server
│   ├── src/services/        # Compiler, Relayer & WebSocket services
│   └── Dockerfile           # Multi-stage build with Foundry (forge & cast)
├── packages/
│   └── shared/              # Shared types, schemas & contract ABIs
├── docs/                    # Business specifications & hackathon briefs
├── AGENTS.md                # AI Agent behavior guidelines & standards
└── PROJECT_BLUEPRINT.md     # Single Source of Truth architectural blueprint
```

---

## 🚀 Quickstart

### Prerequisites
* [Foundry](https://getfoundry.sh/) (`forge`, `cast`)
* [Node.js](https://nodejs.org/) v20+ & [pnpm](https://pnpm.io/) v9+

### 1. Smart Contracts
```bash
cd contracts
forge install
forge test -vvv
```

### 2. Frontend & Backend
```bash
# From workspace root
pnpm install
pnpm dev
```

---

## 📑 Documentation

* Master Architecture: [PROJECT_BLUEPRINT.md](PROJECT_BLUEPRINT.md)
* Agent & Workflow Standards: [AGENTS.md](AGENTS.md)
* Technical Specifications: [docs/REACTIVEFLOW_DETAILED_FRS.md](docs/REACTIVEFLOW_DETAILED_FRS.md)

## Reactive Omni Buildathon

OmniFlow's Set It and Forget It demo is a personal stop-loss. Once configured, the Lasna reactive contract monitors a Base Sepolia pool and calls the owner's Vault through the official callback proxy. The verified run used a deployed test pool and transferred 1.394409773455864503 test tokens to the Vault owner after swapping 0.001 ETH.

- [FULL_LOOP_EVIDENCE.json](FULL_LOOP_EVIDENCE.json) lists the historical demo deployment under `demo`, additional verified runs under `fullLoops`, and cooldown checks under `cooldowns`.
- Watch the 53-second [stop-loss demo](docs/omniflow-reactive-demo.mp4).
- Follow the same run on the explorers from the [Base Sepolia Sync](https://sepolia.basescan.org/tx/0xbcc9358892705f831b7733cf47c6a707b2b017a6d3a60e5c018821e6713ed31a) through the [Lasna callback request](https://lasna.reactscan.net/tx/0xf66b1f9a183811bc9a857027e42a7c3aa8d8f13cef2c6c3156508752a7ffe0eb) to the [Base Sepolia settlement](https://sepolia.basescan.org/tx/0x6683e71dfc3fb75e1b103985e79a027a8087217c2e23077d26897584d177d052).
- Replay the receipt verification without sending a transaction. Run this from the repository root after installing dependencies.

```bash
pnpm --filter backend exec tsx ../scripts/test-full-loop.ts --verify-existing \
  0xbcc9358892705f831b7733cf47c6a707b2b017a6d3a60e5c018821e6713ed31a \
  0xf66b1f9a183811bc9a857027e42a7c3aa8d8f13cef2c6c3156508752a7ffe0eb \
  0x6683e71dfc3fb75e1b103985e79a027a8087217c2e23077d26897584d177d052
```

---

## ⚖️ License
[MIT License](LICENSE). Built for the Reactive Omni Buildathon (2026).
