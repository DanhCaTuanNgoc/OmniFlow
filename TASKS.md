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
| **Giai đoạn 0: Thiết Kế & Chuẩn Hóa Kiến Trúc** | 14/11/2026 | 6 | 6 | 0 | **100%** |
| **Sprint 1: Core Contracts & Live On-Chain Loop** | Ngày 1 - 7 (15/11 - 21/11) | 8 | 0 | 0 | **0%** |
| **Sprint 2: Workspace UI, Studio Canvas & Backend Relayer** | Ngày 8 - 14 (22/11 - 28/11) | 11 | 3 | 0 | **27.3%** |
| **Sprint 3: Live Visualizer, Hardening & Deployment** | Ngày 15 - 21 (29/11 - 5/12) | 5 | 0 | 0 | **0%** |
| **TỔNG CỘNG** | **21 Ngày** | **30** | **9** | **0** | **30.0%** |

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

---

### SPRINT 1: CORE CONTRACTS & LIVE ON-CHAIN LOOP (NGÀY 1 - 7: 15/11 - 21/11)

#### `TASK-101` [TODO] — Khởi tạo Cấu trúc Monorepo & Cài đặt Thư viện
* **Module / Màn hình:** Monorepo Workspace Root
* **Mục đích:** Thiết lập nền móng dự án chuẩn pnpm workspace với TypeScript và Foundry.
* **Chi tiết thực thi:**
  * Tạo cấu trúc `contracts/`, `frontend/`, `backend/`, `packages/shared/`.
  * Cấu hình `pnpm-workspace.yaml`, `package.json` gốc, và các file `tsconfig.json`.
  * Khởi tạo dự án Foundry trong `contracts/` và cài đặt `@reactive-network/reactive-lib`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-102` [TODO] — Phát triển Smart Contract Đích `ActionVault.sol`
* **Module / Màn hình:** `contracts/src/ActionVault.sol` (Base Sepolia)
* **Mục đích:** Cung cấp két an toàn phi lưu ký với Panic Button, Safe Sweep và Multi-Pipeline Mapping.
* **Chi tiết thực thi:**
  * Kế thừa `AbstractCallback` với địa chỉ Callback Proxy Base Sepolia: `0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6`.
  * Triển khai hàm `executeStopLoss`, `executeSafeSweep`, `emergencyWithdraw`.
  * Tích hợp `getAmountsOut` bảo vệ trượt giá.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-103` [TODO] — Phát triển Mock Uniswap V2 Pair & Mock Tokens
* **Module / Màn hình:** `contracts/src/mocks/` (Base Sepolia Testbed)
* **Mục đích:** Tạo môi trường thanh khoản chủ động để thử nghiệm và quay video ép giá demo.
* **Chi tiết thực thi:**
  * Tạo `MockWETH.sol` (18 decimals) và `MockUSDC.sol` (18 decimals).
  * Tạo `MockUniswapV2Pair.sol` và `MockUniswapV2Router.sol`.
  * Script mint token và nạp thanh khoản ban đầu.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-104` [TODO] — Phát triển Reactive Smart Contract `StopLoss_Pipeline.sol`
* **Module / Màn hình:** `contracts/src/StopLoss_Pipeline.sol` (Reactive Lasna)
* **Mục đích:** Hợp đồng phản ứng tự trị lắng nghe DEX Sync event và kích hoạt callback.
* **Chi tiết thực thi:**
  * Kế thừa `IReactive` và `AbstractReactive`.
  * Kiểm tra `if (!vm)` đăng ký `service.subscribe` trong constructor `payable`.
  * Hàm `react()` với Stateless Cooldown Timestamp Guard và Two-Slot Payload.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

#### `TASK-105` [TODO] — Bộ Unit & Fork Tests Đạt 100% Độ Phủ (Foundry)
* **Module / Màn hình:** `contracts/test/`
* **Mục đích:** Chứng minh tính đúng đắn và an toàn của hợp đồng trước khi deploy.
* **Chi tiết thực thi:**
  * Viết `ActionVault.t.sol` kiểm tra Non-custodial, authorization, panic button.
  * Viết `StopLoss_Pipeline.t.sol` kiểm tra logic giá, cooldown 200ms guard.
  * Chạy `forge test -vvv` đảm bảo 100% tests pass.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

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

#### `TASK-108` [TODO] — Xuất ABIs & Types Sang `packages/shared/`
* **Module / Màn hình:** `packages/shared/`
* **Mục đích:** Cung cấp ABIs và Pre-compiled Bytecode chính thức cho Frontend và Backend.
* **Chi tiết thực thi:**
  * Trích xuất ABI/Bytecode của `ActionVault` và `StopLoss_Pipeline`.
  * Khởi tạo file export TypeScript trong `packages/shared/src/index.ts`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** --
* **Trạng thái:** `TODO`

---

### SPRINT 2: WORKSPACE UI, CANVAS & BACKEND RELAYER (NGÀY 8 - 14: 22/11 - 28/11)

#### `TASK-201` [TODO] — Khởi tạo Next.js 14 Frontend & Cấu hình Web3 Wagmi/Viem
* **Module / Màn hình:** `frontend/` (App Shell)
* **Mục đích:** Xây dựng khung giao diện Web3 Dark Theme chuẩn chỉnh, chống lỗi Hydration.
* **Chi tiết thực thi:** Next.js 14 App Router, Tailwind CSS, Wagmi Provider, RainbowKit/AppKit.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-202` [TODO] — Xây dựng Pipeline Studio Canvas với XYFlow (`@xyflow/react`)
* **Module / Màn hình:** Màn hình 1 — Pipeline Studio (`StudioCanvas.tsx`)
* **Mục đích:** Cung cấp trải nghiệm kéo thả tự động hóa trực quan không cần viết code.
* **Chi tiết thực thi:** DAG graph enforcement, Constrained Typed Ports, custom nodes và edge styles.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

#### `TASK-203` [TODO] — Phát triển Bộ 10 Node Tinh Hoa (Lean Node Components)
* **Module / Màn hình:** Pipeline Studio (`frontend/src/components/canvas/nodes/`)
* **Mục đích:** Cung cấp đầy đủ 10 nodes cấu hình thuộc 4 nhóm (Trigger, Condition, Action, Logic).
* **Chi tiết thực thi:** 3 Triggers, 3 Conditions, 3 Actions, 1 Logic Gate Node.
* **Ngày tạo:** 14/11/2026 17:35 | **Trạng thái:** `TODO`

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

#### `TASK-206` [TODO] — Pipeline Graph Parser & Pre-compiled Bytecode Deployer API
* **Module / Màn hình:** `backend/src/services/deployer.service.ts` & `routes/pipeline.route.ts`
* **Mục đích:** Validate đồ thị JSON, trích xuất parameters và deploy RSC qua Viem với 1.0 lREACT gas tài trợ trong 1s.
* **Chi tiết thực thi:**
  * Zod Schema validation cho Graph JSON (DAG không chu trình).
  * Hàm deploy RSC sử dụng `walletClient.deployContract` nạp sẵn `{ value: parseEther('1.0') }`.
  * Endpoint REST API: `POST /api/pipeline/compile-and-deploy`.
* **Ngày tạo:** 14/11/2026 17:52 | **Trạng thái:** `TODO`

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

#### `TASK-208` [TODO] — Event Stream Listener & Fallback Initial Data Seed
* **Module / Màn hình:** `backend/src/services/eventListener.service.ts`
* **Mục đích:** Lắng nghe event on-chain từ RPC, lưu buffer sự kiện và cung cấp dữ liệu seed ban đầu cho Activity Logs.
* **Chi tiết thực thi:**
  * Bắt event `Sync`, `StopLossExecuted`, `SafeSwept`.
  * In-Memory Ring Buffer lưu 50 events gần nhất.
  * Fallback Data Seed với 3–5 bản ghi giao dịch thật cho Activity Logs khi container khởi động lại.
* **Ngày tạo:** 14/11/2026 17:52 | **Trạng thái:** `TODO`

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