# Agent Behavior & Project Guidelines — OmniFlow

## 1. Project Overview & Scope
- **Project**: OmniFlow ("The Zapier of Web3: No-Code Cross-Chain Automation Powered by Reactive Omni")
- **Hackathon**: Reactive Omni Buildathon (Nov 5 – Dec 5, 2026 | Deadline: ~21 days | Prize Pool: $5,500 in REACT)
- **Target Track**: Set It and Forget It ($2,000 First Place + $250 Runner-up)
- **Target Networks**:
  - Origin / Destination: Base Sepolia (Chain ID: 84532, 200ms block time via Denim upgrade)
  - Reactive Core: Reactive Omni Lasna Testnet (Chain ID: 5318007, ~1s block time, CometBFT consensus)
- **Core Stack (Monorepo)**:
  - Smart Contracts (`contracts/`): Solidity ^0.8.20, Foundry (forge, cast), @reactive-network/reactive-lib
  - Backend Service (`backend/`): Node.js 20 LTS, TypeScript, Express REST API, WebSocket Server (ws), Foundry Runner, Docker Multi-stage deployed on Railway
  - Frontend (`frontend/`): Next.js 14 (App Router), TypeScript, Tailwind CSS, @xyflow/react, Wagmi / Viem, deployed on Vercel
  - Shared Library (`packages/shared/`): Common types, JSON schemas, Foundry ABIs
- **Canonical Project Documentation (Single Source of Truth)**:
  - **Master Architecture Blueprint**: `PROJECT_BLUEPRINT.md` (System topology, smart contract interfaces, end-to-end full loop verification, security invariants).
  - **Functional Requirements Specification (FRS)**: `docs/REACTIVEFLOW_DETAILED_FRS.md` (Screen-by-screen UX, 10 visual nodes, WebSocket event schemas, API contracts, error states).
  - **Business Requirements & Scope (BRD)**: `docs/REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md` (Target personas, value proposition, hackathon track alignment, user journeys).
  - **Hackathon Track & Rules**: `docs/hackathon_details_Reactive.md` (Reactive Buildathon track rules, judging criteria, deadline).

---

## 2. Skills Integration & Usage

The workspace is equipped with the full suite of specialized skills under `.agents/skills/`:

### 🎨 Impeccable UI Skill (`.agents/skills/impeccable/`)
Use whenever designing, refining, or styling the Next.js frontend, Studio Canvas, or Workspace screens:
- Adhere to `craft-floor.md`: Contrast >= 4.5:1, tight grouping, type tracking -0.02em to -0.04em, tabular-nums for live metrics.
- Ban ghost cards and generic AI-slop decorations.
- Maintain custom Web3 dark theme, stylish scrollbars, and photon pulse animations on canvas edges.

### 📋 SpecKit Engineering Workflow (`.agents/skills/speckit-*/`)
Use for structured, production-grade feature development:
- `speckit-plan`: Create architectural plans before major feature implementation.
- `speckit-specify`: Define schemas and acceptance criteria.
- `speckit-tasks`: Break down tasks into atomic steps.
- `speckit-implement`: Execute code strictly according to specifications.

### ⚡ Reactive Contracts Skill (`.agents/skills/reactive-contracts/`)
Mandatory when writing, modifying, or testing smart contracts in `contracts/`:
- Implement `IReactive` and `AbstractReactive` for RSCs on Lasna Testnet.
- Implement `AbstractCallback` for `ActionVault.sol` on Base Sepolia.
- Enforce the 4 Core Defensive Patterns: Callback Proxy Authentication, Stateless Cooldown Timestamp Protection (against multi-callback storms across 200ms blocks), Live Price Re-Validation, and Dual-Way Event Mirroring.
- Always include non-custodial `emergencyWithdraw()` (Panic Button) and `executeSafeSweep()` in `ActionVault`.
- Test thoroughly with Foundry (`forge test -vvv`) before any deployment script.

### 🕸️ XYFlow Canvas Engine Skill (`.agents/skills/xyflow-canvas/`)
Use for building the visual drag-and-drop Pipeline Studio in `frontend/`:
- Enforce Constrained Typed Ports: Trigger (out only) -> Condition (in/out) -> Action (in only). Reject cyclic graphs (DAG enforcement).
- Implement the 10-Node Lean Orthogonal Catalog.
- Animate photon pulses on edges using hardware-accelerated CSS keyframes upon WebSocket event delivery without triggering React component remounts.
- Hydrate presets from the Recipe Store into active canvas graphs.

### 🚂 Railway & Container Deployment Skill (`.agents/skills/railway-deploy/`)
Use when working on backend deployment, Docker containerization, or server infrastructure:
- Maintain multi-stage Dockerfile with Foundry toolchain (`forge` and `cast`) installed.
- Ensure WebSocket server implements a 30-second ping/pong heartbeat to prevent cloud proxy idle disconnects.
- Monitor `/health` check endpoint connectivity to both Base Sepolia and Lasna RPCs.

### ▲ Vercel Interface & React Performance Skills (`.agents/skills/web-design-guidelines/`, `vercel-react-best-practices/`, `vercel-composition-patterns/`)
- Ensure all Canvas and Web3 components in `frontend/` use explicit `'use client'` to prevent SSR hydration mismatches.
- Audit UI code against Web Interface Guidelines (WCAG 2.1 AA a11y, focus rings, explicit transitions, tabular-nums).
- Keep `nodeTypes` and `edgeTypes` defined outside component render functions to prevent layout thrashing during live WebSocket streaming.

### 🧪 On-Chain Testing & Verification Skill (`.agents/skills/onchain-test-verify/`)
Mandatory whenever testing, verifying data bindings, or running integration suites:
- **Zero-Mock Policy**: Ban any silent mock/fallback dummy data in `catch` blocks. If an RPC call fails, explicitly show error or disconnected states.
- **3-Tier Testing Execution**:
  1. Unit & Fork Tests in Foundry: `cd contracts && forge test -vvv`.
  2. Multi-chain Full Loop Test: Execute `scripts/test-full-loop.ts` to trigger Origin Swap -> Omni react() -> Callback -> Vault Execution.
  3. UI Live Assertion: Ensure all balances and tx links point to real Lasna and Base Sepolia block explorers.
- **Evidence Output**: Always generate `FULL_LOOP_EVIDENCE.json` with the 3 verifiable transaction hashes required by Reactive Buildathon judges.

### 🚀 Auto-Commit Workflow (`.agents/skills/auto-commit/`)
- Automatically stage changed files and generate standard Conventional Commits after tasks are completed and verified.
- **Mandatory Policy**: The Agent MUST automatically commit all verified changes at the end of every code edit task. The Agent must NEVER run `git push` — pushing is strictly left to the user.

## Prohibited Skills
- **Graphify**: Prohibited to prevent token bloat and irrelevant Python AST crawling.
- **Playwright MCP Interactive Loops**: Prohibited to avoid exhausting weekly model token allowances. Use script-based execution (`node tests/e2e/...`) when E2E testing is explicitly requested.

---

## 3. Engineering & Coding Standards
- **Canonical Documentation Adherence (Zero Deviation)**:
  - All smart contracts, backend services, canvas nodes, and frontend workflows MUST strictly implement the designs in `PROJECT_BLUEPRINT.md` and `docs/`. Never introduce conflicting patterns or ad-hoc architecture.
  - Hierarchy of authority in case of specification discrepancies:
    1. `PROJECT_BLUEPRINT.md` (Technical Architecture, Smart Contracts, Security Invariants & Monorepo Topology).
    2. `docs/REACTIVEFLOW_DETAILED_FRS.md` (Functional UI/UX, 10-Node Specs, WebSocket Payloads & API Contracts).
    3. `docs/REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md` & `docs/hackathon_details_Reactive.md` (Business Logic & Hackathon Track Invariants).
- **Token-Efficient Doc Consultation (Targeted Reading Only)**:
  - Do NOT dump or scan entire doc files into working memory indiscriminately.
  - Read targeted sections or line ranges via `read_file` only when actively designing, implementing, or auditing that specific component (e.g. read Node Catalog in FRS when building Studio Canvas, read Vault spec in Blueprint when coding `ActionVault.sol`).
- **No Mock / Fake Shortcuts (Fail-Fast)**: Never implement silent mock/fallback data for on-chain RPC calls. Masking fetch failures behind dummy data obscures real bugs. Surface real disconnected or error states explicitly.
- **Strict Callback Proxy Authorization**: On Base Sepolia, `msg.sender` must be verified as the official Reactive Callback Proxy, and `rscCaller` must match `authorizedRSCs[rscCaller] == true`.
- **Stateless Cooldown Protection**: RSCs must use a `block.timestamp - lastTriggeredTimestamp < cooldownSeconds` guard at the very start of `react()` to prevent multi-callback storms across Base Sepolia's rapid 200ms blocks.
- **Live Price Re-Validation**: Destination execution must re-check pool reserves at execution time to protect against flash rebounds and MEV sandwich attacks (`minAmountOut`).
- **Non-Custodial Guarantee**: `ActionVault` must always grant `owner` immediate, unconditional access to `emergencyWithdraw()` and `executeSafeSweep()`.
- **Gas Lifecycle Awareness**: Always account for RSC `lREACT` gas balances and support refuel capabilities.
- **Zero AI Slop & No Emojis in Source Code**: No emojis in contract variable names, schemas, or tests. Keep code clean and production-ready.

---

## 4. Verification & Commit Hygiene
- **Pre-commit Verification**:
  - Contracts: `cd contracts && forge test -vvv` (must pass 100%).
  - Frontend: `pnpm --filter frontend build` (must compile with zero TypeScript/lint errors).
  - Backend: `pnpm --filter backend build` (must pass TypeScript compilation).
- **Auto-Commit Execution**:
  - Stage modified files cleanly: `git add <specific paths>`.
  - Create conventional commit: `git commit -m "<type>(<scope>): <summary>"`.
  - Scopes: `(contracts)`, `(studio)`, `(canvas)`, `(vault)`, `(relayer)`, `(deploy)`, `(infra)`, `(tasks)`.
  - Output commit hash and summary for user review.
  - **NEVER execute `git push`**.

---

## 5. Strict Task Tracking Protocol (`TASKS.md`)
- **Mandatory Policy on Task State**:
  - File `TASKS.md` is the official central progress tracking ledger of the OmniFlow project.
  - **Dynamic Task Logging (No Issue Left Behind)**: Trong bất kỳ session làm việc nào, nếu:
    - Được người dùng yêu cầu hoặc đề xuất làm một tính năng/công việc mới (Task A) $\rightarrow$ **NGAY LẬP TỨC** ghi nhận Task mới vào `TASKS.md` (status: `TODO` hoặc `IN_PROGRESS`).
    - Phát hiện lỗi ngầm, bug runtime, hay điểm nghẽn ở bất kỳ function/module nào (Function B) $\rightarrow$ **NGAY LẬP TỨC** ghi nhận task fix lỗi (Bugfix Task) vào `TASKS.md` kèm mô tả chi tiết lỗi và phạm vi ảnh hưởng.
    - Tuyệt đối không để tồn tại bất kỳ công việc hoặc lỗi phát sinh nào mà không được tracking trong `TASKS.md`!
  - **Before starting a task**: Mark the task status as `IN_PROGRESS` in `TASKS.md`.
  - **Upon finishing a task**: Update the task status to `DONE`, fill in the completion timestamp (`Ngày hoàn thành`), and record any relevant commit hashes or outputs.
  - **If a task is paused, unfinished, or blocked**: You MUST update its current progress, notes on what was completed, and remaining items into `TASKS.md` (status: `IN_PROGRESS` or `BLOCKED`). Never leave progress untracked across context turns!
  - Always recalculate and update the **Progress Summary Table** at the top of `TASKS.md`.
  - **Strict Scope Prohibition**: NEVER add video demo recording or final hackathon submission tasks to `TASKS.md` (these are deferred indefinitely until future explicit user instruction).
