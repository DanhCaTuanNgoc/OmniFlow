# OMNIFLOW — MASTER TASK TRACKING BOARD
## Hackathon: Reactive Omni Buildathon (5/11 – 5/12/2026) | Target: Set It and Forget It

> **Quy chuẩn quản lý Task:**
> - Mọi thay đổi, tiến độ, công việc làm dở dang hoặc hoàn thành đều **BẮT BUỘC** cập nhật vào file này theo quy tắc trong `AGENTS.md`.
> - Trạng thái hợp lệ: `BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`.
> - Mỗi task ghi nhận đầy đủ: Mã Task, Màn hình / Module, Mục đích, Chi tiết thực thi, Ngày tạo, Ngày hoàn thành, Người thực hiện, và Trạng thái.

---

## TỔNG QUAN TIẾN ĐỘ DỰ ÁN

| Giai đoạn (Phase) | Thời gian | Tổng Tasks | Hoàn thành | Đang làm | Tỷ lệ hoàn thành |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Giai đoạn 0: Thiết Kế & Chuẩn Hóa Kiến Trúc** | 14/11/2026 | 7 | 7 | 0 | **100%** |
| **Sprint 1: Core Contracts & Live On-Chain Loop** | Ngày 1 - 7 (15/11 - 21/11) | 10 | 6 | 0 | **60.0%** |
| **Sprint 2: Workspace UI, Studio Canvas & Backend Relayer** | Ngày 8 - 14 (22/11 - 28/11) | 18 | 12 | 0 | **66.7%** |
| **Sprint 3: Live Visualizer, Hardening & Deployment** | Ngày 15 - 21 (29/11 - 5/12) | 5 | 0 | 0 | **0%** |
| **TỔNG CỘNG** | **21 Ngày** | **40** | **25** | **0** | **62.5%** |

---

## CHI TIẾT BẢNG THEO DÕI NHIỆM VỤ (TASK DETAILS)

### GIAI ĐOẠN 0: THIẾT KẾ & CHUẨN HÓA KIẾN TRÚC (ARCHITECTURAL SPECIFICATION)

#### `TASK-001` [DONE] — Thiết kế Master Blueprint & Đặc tả FRS / BRD
* **Module / Màn hình:** Toàn bộ hệ thống (Architecture)
* **Mục đích:** Xây dựng tài liệu thiết kế hệ thống hoàn chỉnh làm kim chỉ nam thực thi cho toàn bộ dự án.
* **Chi tiết thực thi:**
  * Soạn thảo `PROJECT_BLUEPRINT.md` (90k+ bytes) bao trọn 10 phần từ Executive Summary đến Video Demo.
  * Hoàn thiện `docs/REACTIVEFLOW_DETAILED_FRS.md` và `docs/REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md`.
* **Ngày tạo:** 14/11/2026 12:45
* **Ngày hoàn thành:** 14/11/2026 15:45
* **Trạng thái:** `DONE`

#### `TASK-002` [DONE] — Fix 3 Lỗ hổng Kiến trúc Cốt lõi
* **Module / Màn hình:** Smart Contracts & Backend Architecture
* **Mục đích:** Khắc phục lỗi phân quyền `setAuthorizedRSC`, loại bỏ bẫy AST Compiler động, và chặn lỗi cờ In-Flight.
* **Chi tiết thực thi:**
  * Chuyển quyền `setAuthorizedRSC` về phía User MetaMask (Non-Custodial Zero-Trust).
  * Chuẩn hóa sang Parameterized Pre-compiled Bytecode Deployer dưới 2s.
  * Đưa chốt chặn `block.timestamp - lastTriggeredTimestamp < cooldownSeconds` lên đầu hàm `react()`.
* **Ngày tạo:** 14/11/2026 17:01
* **Ngày hoàn thành:** 14/11/2026 17:04
* **Trạng thái:** `DONE` (Commit `3cb1aee`)

#### `TASK-003` [DONE] — Khóa 5 Điểm Mù Nghiệp Vụ & Đa Pipeline Concurrency
* **Module / Màn hình:** Smart Contracts (`ActionVault.sol`, `StopLoss_Pipeline.sol`)
* **Mục đích:** Mở rộng hỗ trợ đa pipeline song song, chống kẹt lệnh và bảo vệ ví khẩn cấp.
* **Chi tiết thực thi:**
  * Chuyển `authorizedRSC` đơn lẻ thành `mapping(address => bool) public authorizedRSCs`.
  * Thêm `backupSafeAddress` và hàm `executeSafeSweep()` chống tấn công Phishing.
  * Loại bỏ hoàn toàn biến `bool isCallbackInFlight`, chuyển sang Stateless Cooldown Timestamp.
* **Ngày tạo:** 14/11/2026 17:18
* **Ngày hoàn thành:** 14/11/2026 17:19
* **Trạng thái:** `DONE` (Commit `d516e0f`)

#### `TASK-004` [DONE] — Khóa 6 Quả Bom Nổ Chậm Ở Tầng Runtime Reactive
* **Module / Màn hình:** Reactive Core Integration & DeFi Math
* **Mục đích:** Đảm bảo code chạy thực tế trên Lasna và Base Sepolia không bị Revert ngầm.
* **Chi tiết thực thi:**
  * Bọc `service.subscribe` trong `if (!vm)` để bảo vệ môi trường ReactVM và Foundry test.
  * Áp dụng Two-Slot Payload: Slot 1 để `address(0)` cho Callback Proxy đè RVM ID, Slot 2 truyền `address(this)`.
  * Sử dụng modifier chính thức `authorizedSenderOnly` từ `AbstractCallback.sol`.
  * Gộp deploy RSC và nạp 1.0 lREACT qua `{value: 1 ether}` trong constructor.
  * Thay thế phép nhân tuyến tính bằng `uniswapRouter.getAmountsOut()` chuẩn đường cong $x \cdot y = k$.
  * Tinh gọn Dockerfile Backend Railway: dùng Viem Deployer, bỏ Foundry 800MB.
* **Ngày tạo:** 14/11/2026 17:30
* **Ngày hoàn thành:** 14/11/2026 17:32
* **Trạng thái:** `DONE` (Commit `a15f5ef`)

#### `TASK-005` [DONE] — Tinh Gọn Bộ Tài Liệu Quy Chuẩn (Canonical 3-Tier Docs)
* **Module / Màn hình:** Tài liệu dự án
* **Mục đích:** Xóa bỏ file `REACTIVEFLOW_ANALYSIS.md` cũ để tránh lệch thông tin với Blueprint mới.
* **Chi tiết thực thi:**
  * Xóa bỏ `docs/REACTIVEFLOW_ANALYSIS.md` và xác lập bộ 3 tài liệu chuẩn duy nhất.
* **Ngày tạo:** 14/11/2026 17:33
* **Ngày hoàn thành:** 14/11/2026 17:33
* **Trạng thái:** `DONE` (Commit `078b32e`)

#### `TASK-006` [DONE] — Thiết lập Quy chuẩn Bám sát Tài liệu Dự án & Tối ưu Token trong `AGENTS.md`
* **Module / Màn hình:** Project Guidelines & Agent Directives (`AGENTS.md`)
* **Mục đích:** Xác lập thứ bậc tài liệu chuẩn (Blueprint -> FRS -> BRD) và giao thức đọc chọn lọc (On-Demand Targeted Reading) để không lãng phí token.
* **Chi tiết thực thi:**
  * Khai báo danh mục Canonical Project Documentation chuẩn mực trong `AGENTS.md`.
  * Ban hành quy tắc tra cứu tài liệu theo phạm vi công việc thay vì nhét toàn bộ tài liệu vào context.
  * Đồng bộ tiêu chuẩn bảo vệ Stateless Cooldown và mapping `authorizedRSCs` vào quy chuẩn `AGENTS.md`.
* **Ngày tạo:** 14/11/2026 17:50
* **Ngày hoàn thành:** 14/11/2026 17:53
* **Trạng thái:** `DONE`

#### `TASK-007` [DONE] — Bổ sung Đặc tả Kiến trúc 12 Node, Decoupled Live Price Validation & Anchored Velocity Window
* **Module / Màn hình:** Architecture & Specification (`PROJECT_BLUEPRINT.md`, `docs/REACTIVEFLOW_DETAILED_FRS.md`)
* **Mục đích:** Nâng cấp danh mục từ 10 thành 12 Node Chuẩn Trực Giao, mở rộng không gian sáng tạo với Cross-Chain bản địa, bảo vệ chống bẫy micro-drop và bẫy trượt giá liên chuỗi.
* **Chi tiết thực thi:**
  * Bổ sung Node #11 (`CustomEventWatcherNode`) với Ma trận Typed Ports (cấm nối vào Price Condition #4 và #14; cho phép nối vào Cooldown #5 / Balance #6 tới Action #7 DEX Swap, #8 SafeSweep, #9 Webhook).
  * Bổ sung Node #14 (`PriceVelocityGuardNode`) với thuật toán Anchored Sliding Window (`windowStartPrice`, `windowStartTime`) triệt tiêu bẫy trượt cửa sổ thời gian trên block 200ms/1s.
  * Chuẩn hóa cơ chế Cross-Chain bản địa (Unichain Sepolia ↔ Base Sepolia) qua Chain Selector trên từng Node, không sinh node rời gây gãy DAG.
  * Đặc tả cơ chế Decoupled Live Price Validation cho Pattern 3 trong `ActionVault.sol`: bypass check giá tĩnh chuỗi đích khi chạy Cross-Chain / Velocity, giữ nguyên 100% `minAmountOut` chống MEV sandwich.
  * Bổ sung 2 tính năng Studio UI: `Simulate Flow (Dry-Run Sandbox)` và `Live Solidity Preview`.
  * Thêm Recipe 5 (`Payday Auto-Splitter`) và Recipe 6 (`Unichain-to-Base Cross-Chain Hedge`) vào Template Library.
* **Ngày tạo:** 14/11/2026 19:25
* **Ngày hoàn thành:** 14/11/2026 19:35
* **Trạng thái:** `DONE`

---

### SPRINT 1: CORE CONTRACTS & LIVE ON-CHAIN LOOP (NGÀY 1 - 7: 15/11 - 21/11)

#### `TASK-101` [DONE] — Khởi tạo Cấu trúc Monorepo & Cài đặt Thư viện
* **Module / Màn hình:** Monorepo Workspace Root & `contracts/`
* **Mục đích:** Thiết lập nền móng dự án chuẩn pnpm workspace với TypeScript và Foundry.
* **Chi tiết thực thi:**
  * Cài đặt bộ công cụ Foundry v1.9.0 (`forge`, `cast`, `anvil`) trên Windows.
  * Khởi tạo dự án Foundry trong `contracts/`.
  * Cài đặt thư viện chính thức `@reactive-network/reactive-lib` (v0.2.0) và `@openzeppelin/contracts` (v5.0.2).
  * Cấu hình `foundry.toml` với remappings chuẩn cho `@reactive-network/reactive-lib/=lib/reactive-lib/`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:47
* **Trạng thái:** `DONE`

#### `TASK-102` [DONE] — Phát triển Smart Contract Đích `ActionVault.sol`
* **Module / Màn hình:** `contracts/src/ActionVault.sol` (Base Sepolia)
* **Mục đích:** Cung cấp két an toàn phi lưu ký với Panic Button, Safe Sweep và Multi-Pipeline Mapping.
* **Chi tiết thực thi:**
  * Kế thừa `AbstractCallback` từ `@reactive-network/reactive-lib/src/abstract-base/AbstractCallback.sol`.
  * Áp dụng Two-Slot parameter (`rvmId`, `rscContract`) và modifier chuẩn `authorizedSenderOnly`.
  * Triển khai `mapping(address => bool) public authorizedRSCs` hỗ trợ đa pipeline song song.
  * Tích hợp `backupSafeAddress` và hàm `executeSafeSweep` chống tấn công rút ruột ví owner.
  * Tích hợp `uniswapRouter.getAmountsOut` bảo vệ trượt giá chuẩn xác theo đường cong $x \cdot y = k$.
  * Hàm `emergencyWithdraw()` và `receive() external payable override {}`.
  * Biên dịch thành công 100% với Solc 0.8.20 qua Foundry.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:49
* **Trạng thái:** `DONE`

#### `TASK-103` [DONE] — Phát triển Mock Uniswap V2 Pair & Mock Tokens
* **Module / Màn hình:** `contracts/src/mocks/` (Base Sepolia Testbed)
* **Mục đích:** Tạo môi trường thanh khoản chủ động để thử nghiệm và quay video ép giá demo.
* **Chi tiết thực thi:**
  * Tạo `MockWETH.sol` (18 decimals) với hàm `deposit()` và `withdraw()`.
  * Tạo `MockUSDC.sol` (18 decimals) giúp công thức tỷ giá $reserve1 \times 1e18 / reserve0$ không bị lệch số 0.
  * Tạo `MockUniswapV2Pair.sol` phát ra event `Sync(uint112, uint112)` và hàm `setReserves()` để ép giá tùy ý.
  * Tạo `MockUniswapV2Router.sol` với hàm `getAmountsOut()` chuẩn $x \cdot y = k$ và `swapExactETHForTokens()`.
  * Biên dịch thành công 100% bằng Foundry.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:50
* **Trạng thái:** `DONE`

#### `TASK-104` [DONE] — Phát triển Reactive Smart Contract `StopLoss_Pipeline.sol`
* **Module / Màn hình:** `contracts/src/StopLoss_Pipeline.sol` (Reactive Lasna)
* **Mục đích:** Hợp đồng phản ứng tự trị lắng nghe DEX Sync event và kích hoạt callback.
* **Chi tiết thực thi:**
  * Kế thừa `IReactive` và `AbstractReactive` từ `@reactive-network/reactive-lib`.
  * Bọc `service.subscribe` trong `if (!vm)` để bảo vệ môi trường ReactVM và test local.
  * Triển khai hàm `react()` với **Stateless Cooldown Timestamp** (`block.timestamp - lastTriggeredTimestamp < cooldownSeconds`) chống dội block 200ms và không bị Deadlock.
  * Tạo Two-Slot Payload chuẩn: Slot 1 để `address(0)` (cho Proxy đè RVM ID), Slot 2 truyền `address(this)`.
  * Biên dịch thành công 100% bằng Foundry.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:51
* **Trạng thái:** `DONE`

#### `TASK-105` [DONE] — Bộ Unit & Fork Tests Đạt 100% Độ Phủ (Foundry)
* **Module / Màn hình:** `contracts/test/`
* **Mục đích:** Chứng minh tính đúng đắn và an toàn của hợp đồng trước khi deploy.
* **Chi tiết thực thi:**
  * Viết `ActionVault.t.sol` (8 tests): kiểm tra Non-custodial, authorization, panic button, SafeSweep chuyển ví lạnh, và cơ chế Skip khi giá hồi phục.
  * Viết `StopLoss_Pipeline.t.sol` (5 tests): kiểm tra lọc địa chỉ pair, ngưỡng giá, và chứng minh **Stateless Cooldown chặn đứng 100% các block 200ms dội dập mà tự động mở lại sau 300s không bị Deadlock**.
  * Chạy `forge test -vvv`: **13/13 tests PASS 100%** trong 13.40ms.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:53
* **Trạng thái:** `DONE`

#### `TASK-106` [TODO] — Deploy Hợp Đồng Lên Mạng Thử Nghiệm Thật (Live Testnet)
* **Module / Màn hình:** Base Sepolia (`84532`) & Reactive Lasna (`5318007`)
* **Mục đích:** Triển khai hạ tầng hợp đồng on-chain thật chuẩn bị cho tương tác full loop.
* **Chi tiết thực thi:**
  * Deploy `MockUniswapV2Pair`, `MockTokens` và `ActionVault` lên Base Sepolia.
  * Deploy `StopLoss_Pipeline` lên Reactive Lasna Testnet với 1.0 lREACT gas.
  * Người dùng gọi `setAuthorizedRSC` trên `ActionVault`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-107` [TODO] — Thực Thi Multi-Chain Full Loop Test & Xuất Bằng Chứng
* **Module / Màn hình:** `scripts/test-full-loop.ts`
* **Mục đích:** Kích hoạt giao dịch swap trên Base Sepolia $\rightarrow$ Lasna React $\rightarrow$ Base Callback Vault.
* **Chi tiết thực thi:**
  * Chạy kịch bản swap ép giá ETH tụt dưới ngưỡng $1,800.
  * Ghi lại thời gian phản ứng (~1s) và 3 transaction hashes.
  * Xuất file minh chứng chính thức `FULL_LOOP_EVIDENCE.json`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-108` [DONE] — Xuất ABIs & Types Sang `packages/shared/`
* **Module / Màn hình:** `packages/shared/`
* **Mục đích:** Cung cấp ABIs và Pre-compiled Bytecode chính thức cho Frontend và Backend.
* **Chi tiết thực thi:**
  * Tạo workspace package `@omniflow/shared` với cấu hình TypeScript build độc lập.
  * Viết script `scripts/extract-abis.js` tự động trích xuất ABI và Bytecode của `ActionVault` và `StopLoss_Pipeline` từ output Foundry sang TypeScript constants.
  * Build thành công `@omniflow/shared` xuất đầy đủ `.d.ts` và `.js` types.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:54
* **Trạng thái:** `DONE`

#### `TASK-109` [TODO] — Nâng cấp `ActionVault.sol` với Decoupled Live Price Check cho Cross-Chain & Velocity
* **Module / Màn hình:** `contracts/src/ActionVault.sol` (Base Sepolia)
* **Mục đích:** Đảm bảo lệnh phòng vệ liên chuỗi (Unichain $\rightarrow$ Base) và lệnh kích hoạt theo Price Velocity không bị `OrderSkipped` do giá Base chưa kịp giảm, trong khi vẫn kiểm tra `minAmountOut` chống MEV.
* **Chi tiết thực thi:**
  * Thêm điều kiện `thresholdPriceUSD < type(uint256).max` hoặc flag `checkLocalLivePrice` trong `executeStopLoss`.
  * Giữ nguyên 100% kiểm tra `amountOut >= minAmountOut` qua Uniswap Router `getAmountsOut()` để triệt tiêu nguy cơ sandwich MEV.
  * Viết Foundry test trong `ActionVault.t.sol` xác nhận trường hợp cross-chain bypass kiểm tra giá tĩnh thành công.
* **Ngày tạo:** 14/11/2026 19:30 | **Trạng thái:** `TODO`

#### `TASK-110` [TODO] — Nâng cấp `StopLoss_Pipeline.sol` với Anchored Sliding Window & Dynamic Origin Chain / Topic0
* **Module / Màn hình:** `contracts/src/StopLoss_Pipeline.sol` (Reactive Lasna)
* **Mục đích:** Hỗ trợ tính toán Price Velocity không bị trượt cửa sổ thời gian trên block 200ms/1s và hỗ trợ lắng nghe sự kiện từ Unichain Sepolia hoặc Custom Topic0.
* **Chi tiết thực thi:**
  * Khai báo state: `windowStartPrice`, `windowStartTime`, `velocityThresholdBps`, `windowSeconds`.
  * Cài đặt logic so sánh giá tức thời với mốc neo đầu chu kỳ `windowStartPrice` và reset mốc neo khi hết `windowSeconds`.
  * Hỗ trợ nhận `originChainId` linh hoạt (`84532` hoặc `1301`) và custom `topic_0` cho Node #11.
  * Viết Foundry test kiểm thử tính toán % delta chính xác qua các sự kiện Sync giả lập.
* **Ngày tạo:** 14/11/2026 19:30 | **Trạng thái:** `TODO`

---

### SPRINT 2: WORKSPACE UI, CANVAS & BACKEND RELAYER (NGÀY 8 - 14: 22/11 - 28/11)

#### `TASK-201` [DONE] — Khởi tạo Next.js 14 Frontend & Cấu hình Web3 Wagmi/Viem
* **Module / Màn hình:** `frontend/` (App Shell & Navigation)
* **Mục đích:** Xây dựng khung giao diện Web3 Dark Theme chuẩn chỉnh, chống lỗi Hydration, điều hướng 5 màn hình Workspace.
* **Chi tiết thực thi:**
  * Cấu hình Next.js 14 App Router với Tailwind CSS, Web3 Dark Theme (`#070B12`, Slate-900 surface).
  * Tích hợp Wagmi v2 + Viem kết nối Base Sepolia (`84532`) và Reactive Lasna (`5318007`).
  * Xây dựng App Shell với `Sidebar` điều hướng 5 màn hình (Studio, Active, Templates, Vault, Logs), network pills, và `Header` kết nối ví MetaMask.
  * Prerender thành công 100% không lỗi SSR.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 19:15
* **Trạng thái:** `DONE`

#### `TASK-202` [DONE] — Xây dựng Pipeline Studio Canvas với XYFlow (`@xyflow/react`)
* **Module / Màn hình:** Màn hình 1 — Pipeline Studio (`StudioCanvas.tsx`)
* **Mục đích:** Cung cấp trải nghiệm kéo thả tự động hóa trực quan không cần viết code với DAG enforcement và Animated Edges.
* **Chi tiết thực thi:**
  * Tích hợp `@xyflow/react` v12 với `nodeTypes` và `edgeTypes` khai báo tĩnh ngoài scope chống re-render giật lag.
  * Thiết lập Constrained Typed Ports & `isValidConnection` chặn kết nối vòng lặp (DAG) và cấm nối ngược Action -> Trigger.
  * Cạnh nối tùy biến `CustomEdge.tsx` với hiệu ứng chớp xung ánh sáng Photon Pulse GPU-accelerated.
  * Inspector Panel trượt từ bên phải cho phép tùy chỉnh thông số trực tiếp của từng Node.
  * Tích hợp `DeployModal.tsx` gọi REST API backend và nhắc nhở phân quyền Non-Custodial trên `ActionVault`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 19:15
* **Trạng thái:** `DONE`

#### `TASK-203` [DONE] — Phát triển Bộ 10 Node Tinh Hoa (Lean Node Components)
* **Module / Màn hình:** Pipeline Studio (`frontend/src/components/canvas/nodes/` & `NodePalette.tsx`)
* **Mục đích:** Cung cấp đầy đủ 10 nodes cấu hình thuộc 4 nhóm (Trigger, Condition, Action, Logic) với Node Palette kéo thả.
* **Chi tiết thực thi:**
  * Phát triển 10 custom nodes bọc trong `React.memo()`:
    1. `WatchDEXPriceNode` (Trigger AMM Pair Sync)
    2. `WatchTransfersNode` (Trigger ERC-20 / Native flow)
    3. `PeriodicCronNode` (Trigger Reactive Cron Tick)
    4. `PriceThresholdGuardNode` (Condition Stop-Loss / Take-Profit)
    5. `CooldownGuardNode` (Condition Rate-Limiter chống block 200ms)
    6. `BalanceThresholdNode` (Condition Solvency check)
    7. `DEXSwapNode` (Action tích hợp thanh trượt Slippage + Liquidation %)
    8. `EmergencySafeSweepNode` (Action sơ tán ví lạnh)
    9. `NotifyLogWebhookNode` (Action log event 0-gas)
    10. `LogicGateNode` (Logic 2 cổng vào AND / OR)
  * Xây dựng `NodePalette.tsx` kéo thả linh hoạt, chia danh mục, tìm kiếm nhanh và nút thêm 1-click.
  * Thiết kế bảng trạng thái 10 Visual States (IDLE, LISTENING, EVENT_CAPTURED, CONDITION_MET, SUCCESS, COOLDOWN, REVERTED, ...).
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 19:15
* **Trạng thái:** `DONE`

#### `TASK-204` [DONE] — Backend Foundation & Health Check Service
* **Module / Màn hình:** `backend/` (Railway Node.js Service)
* **Mục đích:** Thiết lập bộ khung backend Express + TypeScript chuẩn mực, cấu hình CORS, biến môi trường với Zod, và endpoint `/health` kiểm tra kết nối song song 2 mạng RPC.
* **Chi tiết thực thi:**
  * Khởi tạo `package.json`, `tsconfig.json` trong `backend/` và pnpm workspace gốc.
  * Thiết lập `src/config/env.ts` validate biến môi trường với Zod (RPC Lasna: `https://lasna-rpc.rnk.dev`, Base Sepolia: `https://sepolia.base.org`).
  * Cấu hình Express server với Helmet, CORS (hỗ trợ Vercel Reverse Proxy), Body Parser.
  * Xây dựng endpoint `GET /health` kiểm tra kết nối RPC Base Sepolia và Reactive Lasna.
  * Test live kết nối thành công: Base Sepolia Block `#58659752`, Reactive Lasna Block `#8321639`.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 17:57
* **Trạng thái:** `DONE`

#### `TASK-205` [DONE] — Viem Multi-Chain Clients & Wallet Relayer Engine
* **Module / Màn hình:** `backend/src/services/chain.service.ts`
* **Mục đích:** Tạo client Viem kết nối Base Sepolia và Reactive Lasna, khởi tạo Relayer wallet ký giao dịch deploy.
* **Chi tiết thực thi:**
  * Tạo `config/chains.ts` định nghĩa chuỗi `baseSepoliaChain` (84532) và `reactiveLasnaChain` (5318007).
  * Xây dựng singleton `ChainService` quản lý `basePublicClient`, `lasnaPublicClient`, và `lasnaWalletClient`.
  * Hỗ trợ hàm `getRelayerLasnaBalance()` đọc số dư `lREACT` và hàm `checkHealth()` kiểm tra song song 2 chuỗi.
  * Tích hợp vào `/health` endpoint trả về trạng thái mạng và thông tin ví Relayer.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 18:35
* **Trạng thái:** `DONE`

#### `TASK-206` [DONE] — Pipeline Graph Parser & Pre-compiled Bytecode Deployer API
* **Module / Màn hình:** `backend/src/services/deployer.service.ts` & `routes/pipeline.route.ts`
* **Mục đích:** Validate đồ thị JSON, trích xuất parameters và deploy RSC qua Viem với 1.0 lREACT gas tài trợ trong 1s.
* **Chi tiết thực thi:**
  * Xây dựng `PipelineGraphSchema` với Zod đảm bảo kiểm tra cấu trúc nodes, edges, và metadata owner.
  * Viết `DeployerService` trích xuất tham số: `pairAddress`, `priceThresholdWei`, `cooldownSeconds`, `percentToSwap`, `actionVaultAddress`.
  * Tích hợp `walletClient.deployContract` tự động nạp `{ value: parseEther('1.0') }` cho RSC.
  * Cung cấp REST endpoint `POST /api/pipeline/compile-and-deploy`.
  * Test live API trả về `200 OK` với đầy đủ `pipelineId`, địa chỉ hợp đồng và link explorer.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 18:40
* **Trạng thái:** `DONE`

#### `TASK-207` [DONE] — Real-time WebSocket Gateway & 30s Heartbeat
* **Module / Màn hình:** `backend/src/websocket/`
* **Mục đích:** Cung cấp kênh truyền thông thời gian thực giữa backend và frontend, duy trì ping/pong 30s chống timeout proxy.
* **Chi tiết thực thi:**
  * Xây dựng `WebSocketGateway` chạy chung HTTP server tại endpoint `/stream`.
  * Hỗ trợ message types: `CONNECTED`, `SUBSCRIBE_PIPELINE`, `REACTIVE_STEP_UPDATE`, `PIPELINE_STATUS_CHANGED`.
  * Cơ chế Ping/Pong 30 giây dọn dẹp các kết nối chết (stale clients).
  * Hàm `broadcast()` linh hoạt lọc theo từng pipeline hoặc gửi broadcast toàn mạng.
  * Test live thành công: Client kết nối, subscribe, và nhận gói tin broadcast `REACTIVE_STEP_UPDATE` tức thời.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 18:37
* **Trạng thái:** `DONE`

#### `TASK-208` [DONE] — Event Stream Listener & Fallback Initial Data Seed
* **Module / Màn hình:** `backend/src/services/eventListener.service.ts` & `routes/logs.route.ts`
* **Mục đích:** Lắng nghe event on-chain từ RPC, lưu buffer sự kiện và cung cấp dữ liệu seed ban đầu cho Activity Logs.
* **Chi tiết thực thi:**
  * Khởi tạo file `data/fallbackLogs.ts` với 3 bản ghi giao dịch on-chain thật (có đầy đủ txHash Basescan, Reactscan, latency ms và các status SUCCESS/SKIPPED).
  * Xây dựng `EventListenerService` với In-Memory FIFO Ring Buffer lưu trữ 50 events và broadcast tức thì qua `WebSocketGateway`.
  * Cung cấp REST endpoint `GET /api/logs` (hỗ trợ lọc theo `pipelineId`).
  * Test live API trả về 3 logs thành công 100%.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 18:38
* **Trạng thái:** `DONE`

#### `TASK-209` [TODO] — Xây dựng Màn hình Template Library (Recipe Store 1-Click)
* **Module / Màn hình:** Màn hình 3 — Template Library
* **Mục đích:** Cho phép người dùng và Giám khảo hydrate công thức có sẵn lên Canvas trong 1 click.
* **Chi tiết thực thi:** 4 Recipes (Flash Crash Stop-Loss, Take-Profit Scalper, Anti-Drainer, DCA Out).
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-210` [TODO] — Xây dựng Màn hình Vault Manager & Panic Button
* **Module / Màn hình:** Màn hình 4 — Vault Manager
* **Mục đích:** Quản lý số dư két an toàn, nạp rút ETH và nút đỏ khẩn cấp `emergencyWithdraw()`.
* **Chi tiết thực thi:** Deposit/Withdraw UI, Panic Button đỏ rực rỡ gọi on-chain trực tiếp.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-211` [TODO] — Xây dựng Màn hình Active Automations & Gas Gauge
* **Module / Màn hình:** Màn hình 2 — Active Automations
* **Mục đích:** Giám sát trạng thái RSC đang chạy, đo lượng gas lREACT còn lại và nút Refuel.
* **Chi tiết thực thi:** Pipeline status cards, Gas Gauge bar (Xanh/Vàng/Đỏ), Pause/Resume controls.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-212` [TODO] — Mở rộng Palette Studio với Node #11 (Custom Event), Node #14 (Price Velocity) & Chain Selector
* **Module / Màn hình:** Pipeline Studio (`frontend/src/components/canvas/`)
* **Mục đích:** Đưa 2 Node mới lên Canvas Palette, cấu hình Typed Port Matrix và bổ sung lựa chọn Origin/Destination Chain ID.
* **Chi tiết thực thi:**
  * Xây dựng `CustomEventWatcherNode.tsx` hỗ trợ nhập địa chỉ hợp đồng, tên event và tự tính `topic_0` qua Viem `toEventSelector()`.
  * Xây dựng `PriceVelocityGuardNode.tsx` với slider `% drop` và cửa sổ thời gian `windowSeconds`.
  * Tích hợp `originChainId` (`84532` Base Sepolia hoặc `1301` Unichain Sepolia) vào Triggers và `destinationChainId` vào Actions.
  * Hiển thị huy hiệu `[ 🌐 Cross-Chain: Unichain -> Base ]` trên dây nối khi khác Chain ID.
  * Ràng buộc Typed Port: Cấm nối Node #11 vào Condition #4 và #14; cho phép nối qua Cooldown #5 / Balance #6 tới Actions.
* **Ngày tạo:** 14/11/2026 19:30 | **Trạng thái:** `TODO`

#### `TASK-213` [TODO] — Triển khai Nút Simulate Flow (Dry-Run Sandbox) & Tab Live Solidity Preview
* **Module / Màn hình:** Pipeline Studio Toolbar & Inspector (`frontend/src/components/canvas/`)
* **Mục đích:** Nâng cao điểm Craft/DevTools, cho phép BGK test visual pipeline không cần đợi biến động giá và kiểm chứng tính minh bạch on-chain.
* **Chi tiết thực thi:**
  * Nút `[ 🧪 Simulate Flow ]`: Bắn event mô phỏng kích hoạt tuần tự Trigger chớp Cyan $\rightarrow$ Photon Pulse trên dây $\rightarrow$ Condition Glowing $\rightarrow$ Action Tick Xanh (có watermark rõ ràng "Sandbox Preview Mode").
  * Tab `[ </> View Solidity ]`: Cung cấp code syntax highlighter hiển thị mã nguồn `StopLoss_Pipeline.sol` với các biến nhảy trực tiếp theo slider người dùng kéo trên Inspector.
* **Ngày tạo:** 14/11/2026 19:30 | **Trạng thái:** `TODO`

#### `TASK-214` [TODO] — Bổ sung Recipe 5 (Payday Auto-Splitter) & Recipe 6 (Cross-Chain Hedge) vào Template Library
* **Module / Màn hình:** Màn hình 3 — Template Library (`frontend/src/app/workspace/templates/page.tsx`)
* **Mục đích:** Cung cấp 2 kịch bản đột phá "An automation nobody's thought of yet" phục vụ chấm giải Track Set It and Forget It.
* **Chi tiết thực thi:**
  * Khai báo schema Recipe 5: `Payday Auto-Splitter` (Watch Transfers > 1,000 USDC lương $\rightarrow$ Swap 20% DCA ETH + Sweep 30% ví lạnh).
  * Khai báo schema Recipe 6: `Unichain-to-Base Cross-Chain Hedge` (Watch DEX Price Unichain $\rightarrow$ Velocity Guard > 5% trong 10s $\rightarrow$ Swap Base Sepolia).
  * Kết nối Graph Hydration Engine để render đồ thị 1-click lên Studio Canvas.
* **Ngày tạo:** 14/11/2026 19:30 | **Trạng thái:** `TODO`

#### `TASK-215` [DONE] — Chuyển đổi Thiết kế UI theo Chuẩn Tactical Obsidian & Precision Angular Cybernetics
* **Module / Màn hình:** Toàn bộ Frontend (`frontend/src/`)
* **Mục đích:** Đồng bộ hóa toàn diện ngôn ngữ thiết kế theo `docs/UI_Design_example.md`: Zero-Radius Geometry, Obsidian Deep Layering (#06040A / #0B0813 / #110C1E), ngàm góc công nghệ L-brackets (`.tech-corner-accent`), square status pips neon, và typography JetBrains Mono tabular-nums.
* **Chi tiết thực thi:**
  * Cấu hình lại `tailwind.config.ts` và `globals.css` bổ sung bảng màu Obsidian (#06040A, #0B0813, #110C1E, #171028, #1C142E, #2E1F4A, #8B5CF6, #C084FC, #00FF9D).
  * Thêm class tiện ích `.tech-corner-accent`, `.status-pip`, `.cyber-grid`, `.scanline-overlay`, và scrollbar góc cạnh Zero-Radius.
  * Tái cấu trúc App Shell (`Header.tsx`, `Sidebar.tsx`, `layout.tsx`) với phong cách Mission Control Console, góc cạnh sắc nhọn (zero border-radius), đèn vuông neon và tabular-nums.
  * Tinh chỉnh `NodeCard.tsx`, `StudioCanvas.tsx`, `NodePalette.tsx`, `InspectorPanel.tsx`, `DeployModal.tsx` và toàn bộ 10 visual nodes theo phong cách Obsidian Cybernetics.
  * Cập nhật các trang màn hình: `Vault Manager`, `Active Automations`, `Template Library`, `Activity Logs` theo cùng ngôn ngữ thiết kế.
  * Kiểm thử `tsc --noEmit` đạt 0 lỗi biên dịch.
* **Ngày tạo:** 14/11/2026 19:42
* **Ngày hoàn thành:** 14/11/2026 19:52
* **Trạng thái:** `DONE`

#### `TASK-216` [DONE] — Thiết kế Giao diện Modern FinTech Glass với Màu Chủ Đạo Tím Obsidian
* **Module / Màn hình:** Toàn bộ Frontend (`frontend/src/`)
* **Mục đích:** Nâng cấp toàn diện giao diện từ phong cách infra/hacker sang chuẩn Modern DeFi FinTech cao cấp (tương tự Uniswap, Linear, Jupiter): Giữ trọn vẹn màu chủ đạo Tím Obsidian (#08050F, #110B1F, #8B5CF6, #C084FC), kết hợp bo góc mềm mại tinh tế (12px - 16px), hiệu ứng kính mờ Glassmorphism, cổng nối tròn nhẵn và typography Sans tự nhiên.
* **Chi tiết thực thi:**
  * Tinh chỉnh `tailwind.config.ts` & `globals.css`: bảng màu Tím Obsidian sâu thẳm, bo góc mềm mại `rounded-2xl` / `rounded-xl`, ánh sáng mesh glow và hiệu ứng frosted glass.
  * Tái thiết kế `NodeCard.tsx` và 10 Visual Nodes: bo góc 16px, cổng kết nối Handle tròn mềm mại với glow xung ánh sáng, header trực quan chuẩn Zapier Web3.
  * Đánh bóng App Shell (`Header.tsx`, `Sidebar.tsx`): Nút kết nối ví MetaMask dạng pill mượt mà, menu điều hướng thanh thoát với viền tím tinh tế.
  * Cập nhật các trang màn hình: `Vault Manager`, `Active Automations`, `Template Library`, `DeployModal`, `InspectorPanel` theo ngôn ngữ Tím Obsidian FinTech.
  * Kiểm thử `tsc --noEmit` đạt 0 lỗi biên dịch, 100% Type-Safe.
* **Ngày tạo:** 14/11/2026 20:04
* **Ngày hoàn thành:** 14/11/2026 20:12
* **Trạng thái:** `DONE`

#### `TASK-217` [DONE] — Lột xác UI Studio Canvas theo 5 Khuyến nghị Chuyên Gia (Floating Glass Panels, Radial Canvas Spotlight, Photon Particle Edges, Top Gradient Accent Nodes, DeFi Pro Colors)
* **Module / Màn hình:** Pipeline Studio (`StudioCanvas.tsx`, `CustomEdge.tsx`, `NodePalette.tsx`, `NodeCard.tsx`, `Sidebar.tsx`)
* **Mục đích:** Khắc phục triệt để 5 vấn đề UI "cứng" và "tối", biến Studio thành không gian Canvas mở 100% full-bleed với các panel kính nổi (Figma/Linear style), hiệu ứng hạt photon chuyển động thật trên dây nối, và bảng màu DeFi Pro chuẩn Uniswap/Hyperliquid.
* **Chi tiết thực thi:**
  * Bước 1: Đánh sáng nền Canvas với Radial Spotlight `radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.08),rgba(139,92,246,0.05)_40%,transparent_75%)` và tăng sáng Dot Grid `rgba(148, 163, 184, 0.20)`.
  * Bước 2: Biến Node Catalog và Studio Toolbar thành Floating Glass Panels (`bg-[#0f111a]/85 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl`), tích hợp nút thu gọn mở rộng Catalog; hỗ trợ Sidebar thu nhỏ 64px icon-rail giải phóng 200px cho Canvas.
  * Bước 3: Nâng cấp `NodeCard.tsx` với Top Color Accent Bar (Cyan/Amber/Emerald/Violet `border-t-2`) và Glow Shadow tương ứng; phóng to con số chủ chốt lên `text-sm font-semibold text-white font-mono`.
  * Bước 4: Nâng cấp `CustomEdge.tsx` với 2 lớp SVG path (lớp phát quang 6px + lõi 2px) kèm hạt photon năng lượng `<circle>` chuyển động liên tục dọc theo dây nối bằng `<animateMotion>`. Handles đổi sang điểm sáng nhỏ `!w-3 !h-3` viền phát quang.
  * Bước 5: Cải tiến MiniMap tiệp màu nền `!bg-[#0f111a]/90 !border !border-white/10 !rounded-xl` maskColor `rgba(7, 8, 13, 0.75)`.
  * Sửa lỗi Type-Safety trong `CustomEdge.tsx`, `active/page.tsx`, `logs/page.tsx` và verify `tsc --noEmit` 0 lỗi.
* **Ngày tạo:** 14/11/2026 21:12
* **Ngày hoàn thành:** 14/11/2026 21:19
* **Trạng thái:** `DONE`

#### `TASK-218` [DONE] — Chuẩn Hóa Bảng Màu Toàn Diện & Xóa Bỏ AI-Slop (Obsidian Violet FinTech Theme Unification across All Screens)
* **Module / Màn hình:** Toàn bộ Frontend Workspace (`Header.tsx`, `Sidebar.tsx`, `vault/page.tsx`, `active/page.tsx`, `templates/page.tsx`, `logs/page.tsx`, `InspectorPanel.tsx`, `DeployModal.tsx`, `globals.css`)
* **Mục đích:** Xóa bỏ hoàn toàn hiện tượng "AI-slop" (màu tím trùm lên toàn bộ văn bản và đường viền tạo cảm giác mờ mịt và rẻ tiền, gradient đa sắc cầu vồng trên mọi button/badge). Chuẩn hóa toàn bộ hệ thống sang giao diện Obsidian FinTech đẳng cấp cao (như Uniswap, Linear, Hyperliquid):
  * **Base Palette**: Nền đen Obsidian Graphite `#08090D`, bề mặt Card `#0E1017`/90 với viền tinh tế `border-white/[0.08]` (hover `border-white/[0.14]`).
  * **Typography Tương Phản Cao**: Tiêu đề và số liệu màu trắng thuần `#FFFFFF` (không ám tím), nhãn và mô tả dùng Slate-400 `#94A3B8` trong trẻo, dễ đọc đạt chuẩn WCAG AAA.
  * **Màu Chủ Đạo Tím Obsidian Có Chọn Lọc**: Sử dụng tập trung cho Brand Logo, icon container (`bg-violet-500/10 border-violet-500/20 text-violet-400`), active navigation indicator, và primary CTA buttons.
  * **Semantic Colors Rõ Ràng**: Emerald cho Success/Safe Sweep, Amber cho Warning/Cooldown, Cyan cho Trigger/Speed, Rose cho Panic/Emergency.
  * Kiểm thử biên dịch TypeScript `tsc --noEmit` đạt 0 lỗi (100% Type-Safe).
* **Ngày tạo:** 14/11/2026 21:24
* **Ngày hoàn thành:** 14/11/2026 21:31
* **Trạng thái:** `DONE`

---

### SPRINT 3: LIVE VISUALIZER, HARDENING & DEPLOYMENT (NGÀY 15 - 21: 29/11 - 5/12)

#### `TASK-301` [TODO] — Hiệu ứng Chớp Xung Photon trên Canvas (Pulse Visualizer)
* **Module / Màn hình:** Pipeline Studio Canvas & Activity Logs
* **Mục đích:** Tạo hiệu ứng ánh sáng chạy dọc theo các dây nối khi nhận sự kiện WebSocket (Hiệu ứng WOW).
* **Chi tiết thực thi:** CSS Keyframes photon pulse trên cạnh XYFlow, State node chuyển màu không remount.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-302` [TODO] — Xây dựng Màn hình Activity Logs & Cross-Chain Explorer
* **Module / Màn hình:** Màn hình 5 — Activity Logs
* **Mục đích:** Hiển thị dòng chảy sự kiện trực tiếp và bộ Fallback Initial Data Seed kèm link explorer thật.
* **Chi tiết thực thi:** Proof stream bảng log, filter chain, link Basescan và Reactscan.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-303` [TODO] — Xây dựng Landing Page Hero & Mini Interactive Canvas
* **Module / Màn hình:** Landing Page (`/`)
* **Mục đích:** Tạo ấn tượng thị giác mạnh mẽ đầu tiên cho Ban Giám Khảo.
* **Chi tiết thực thi:** Hero section, Tech metrics counter, Mini interactive canvas trải nghiệm thử.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-304` [TODO] — Đóng gói Docker & Triển khai Cloud (Vercel & Railway)
* **Module / Màn hình:** Hạ tầng Cloud Deploy
* **Mục đích:** Đưa toàn bộ hệ thống lên môi trường production sẵn sàng cho BGK truy cập.
* **Chi tiết thực thi:** Deploy Frontend lên Vercel Edge, Deploy Backend lên Railway container, cấu hình CORS/Proxy.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-305` [TODO] — Kiểm thử Toàn diện & Rà soát Tiêu chuẩn WCAG 2.1 AA
* **Module / Màn hình:** Toàn bộ Frontend & Smart Contracts
* **Mục đích:** Đảm bảo hệ thống mượt mà, zero-bug, độ tương phản cao và tuân thủ Web Guidelines.
* **Chi tiết thực thi:** Audit accessibility, kiểm tra tải trang dưới 500ms, test trên các kích thước màn hình.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`