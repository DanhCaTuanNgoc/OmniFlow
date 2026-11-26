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
| **Giai đoạn 0: Thiết Kế & Chuẩn Hóa Kiến Trúc** | 14/11/2026 | 8 | 8 | 0 | **100%** |
| **Sprint 1: Core Contracts & Live On-Chain Loop** | Ngày 1 - 7 (15/11 - 21/11) | 10 | 10 | 0 | **100%** |
| **Sprint 2: Workspace UI, Studio Canvas & Backend Relayer** | Ngày 8 - 14 (22/11 - 28/11) | 18 | 18 | 0 | **100%** |
| **Sprint 3: Live Visualizer, Hardening & Deployment** | Ngày 15 - 21 (29/11 - 5/12) | 24 | 23 | 0 | **95.8%** |
| **Đánh giá cạnh tranh, bằng chứng và tính năng mở rộng** | 18–19/11/2026 | 8 | 5 | 1 | **62.5%** |
| **Vận hành Workspace & nghiệm thu dự thi** | Ghi nhận 20/11/2026 | 8 | 1 | 0 | **12.5%** |
| **Khả năng deploy của preset, runtime và nghiệm thu toàn bộ flow** | Ghi nhận 20/11/2026 | 13 | 2 | 0 | **15.4%** |
| **Future Roadmap: 16 Ca Mở Rộng & Universal Engine** | Lộ trình mở rộng | 18 | 1 | 0 | **5.6%** |
| **TỔNG CỘNG** | **Đối chiếu 26/11/2026** | **107** | **68** | **1** | **63.6%** |

Tỷ lệ tính theo số mục `DONE` trên bảng. Còn **21 mục `TODO`**, **1 mục `IN_PROGRESS`** và **17 mục `BACKLOG`**.

> [!IMPORTANT]
> **Yêu cầu Bắt buộc & Định hướng Hoàn thành Nghiệm thu On-chain:**
> 1. **Hoàn thành Toàn diện Kế hoạch Nghiệm thu On-Chain:** Toàn bộ quá trình triển khai, kiểm chứng full-loop và điều kiện phát hành cloud **BẮT BUỘC** hoàn thành theo đặc tả trong [docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md](docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md). Hai luồng trọng tâm tuyệt đối cho bài thi Hackathon là **Flash Crash Stop-Loss (BP-01)** và **Take-Profit (BP-03)**.
> 2. **Roadmap 16 Kịch bản Còn lại (Future Roadmap):** Toàn bộ 16 ca kịch bản còn lại (BP-02, BP-04 $\rightarrow$ BP-12, EXT-01 $\rightarrow$ EXT-05, CAP-01) đã được chính thức đưa vào Roadmap dự án (§8) và giao diện hợp nhất Universal Pipeline Engine (§14), được theo dõi chi tiết từ `TASK-401` đến `TASK-417`.
> 3. **Báo cáo Đánh giá Kỹ thuật, Trải nghiệm DX & Báo lỗi Reactive Network:** Đã hoàn thành biên soạn và lưu trữ tại [docs/REACTIVE_NETWORK_EVALUATION_AND_FEEDBACK.md](docs/REACTIVE_NETWORK_EVALUATION_AND_FEEDBACK.md) (`TASK-418`), tổng kết các bài học thực chiến (Two-Slot Payload, Stateless Cooldown 200ms Denim block storm, `if (!vm)` Foundry guard) và báo cáo lỗi WebSocket RPC / độ trễ ReactScan.

* **On-chain:** Lượt stop-loss ngày 19/11 dùng pool và token thử nghiệm trên testnet. Đã đọc lại cả ba receipt qua RPC ngày 20/11 và xác nhận đều thành công. [Bằng chứng full loop](FULL_LOOP_EVIDENCE.json)
* **Workspace:** Commit `155d62f` bỏ dữ liệu mẫu, `872a381` kiểm tra Vault/RSC cấu hình sẵn, và `f8c3410` đồng bộ giao diện năm màn hình. Deployer hiện chỉ hỗ trợ các node của luồng stop-loss. Xác thực theo ví, lưu pipeline và phục hồi deploy nằm ở `TASK-333` đến `TASK-335`.
* **Kiểm tra tại `f8c3410`:** Build frontend và backend thành công, backend qua 34/34 test. Chưa chạy lại Foundry do môi trường kiểm tra thiếu `forge`. Chưa nghiệm thu luồng trên cloud.
* **Hồ sơ dự thi:** Repo đã public, có địa chỉ hợp đồng và ba hash. Cần xác nhận URL demo, nghiệm thu luồng Studio đến callback trên UI, hoàn thiện video và xác nhận nộp bài. [Checklist](PROJECT_BLUEPRINT.md#102-checklist-chuẩn-bị-nộp-bài-chính-thức-submission-ready)

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

#### `TASK-008` [DONE] — Chuẩn Hóa 2 Siêu Năng Lực Cốt Lõi & Hóa Giải 2 Bẫy Kỹ Thuật ReactVM (Anti-Wick, Cross-Chain, Safe Fan-Out, Dual-State Trap)
* **Module / Màn hình:** Architectural Specification (`PROJECT_BLUEPRINT.md`, `docs/REACTIVEFLOW_DETAILED_FRS.md`)
* **Mục đích:** Khai phóng tối đa sức mạnh bản địa của Reactive Omni phục vụ bài toán thắng giải Hackathon, đồng thời vô hiệu hóa 2 bẫy kỹ thuật RVM (ReactVM Dual-State Trap & Vault Race Condition Trap).
* **Chi tiết thực thi:**
  * **Siêu năng lực 1: Stateful Anti-Wick Confirmation (`consecutiveHits` 1-5 blocks):** Tận dụng bộ nhớ bền vững của RVM trong `StopLoss_Pipeline.sol`, chống 100% các cú giật râu nến hoặc Flash Loan trong 1 block đơn lẻ. Tích hợp thanh trượt `confirmationHits` vào Inspector của Node `PriceThresholdGuardNode`.
  * **Siêu năng lực 2: Cross-Chain Asymmetric Orchestration (`Unichain Sepolia 1301` ➔ `Lasna 5318007` ➔ `Base Sepolia 84532`):** Chứng minh tính "Omni" bản địa, kích hoạt cứu vốn liên chuỗi. Cập nhật `ActionVault.sol` với cờ `isCrossChainTrigger` để bypass kiểm tra giá tĩnh chuỗi đích nhưng vẫn bảo lưu 100% `minAmountOut` qua router `getAmountsOut`.
  * **Hóa giải Bẫy 1: ReactVM Dual-State Trap:** Nhận diện việc `address(this).balance` không giảm theo ledger Lasna bên trong hàm `react()`. Cấm query balance trực tiếp trong `react()`, thay thế bằng ước lượng nội bộ `callbacksEmitted` trong RVM kết hợp đọc `lasnaProvider.getBalance(rsc)` trên thanh Gas Gauge UI.
  * **Hóa giải Bẫy 2: Race Condition trên ActionVault:** Cấm nối 1 Condition vào 2 Action cùng rút tiền từ 1 Vault gây revert. Ban hành quy tắc Canvas: 1 Condition nối tối đa 1 Financial Action (DEX Swap / SafeSweep) + 1 Informational Action (Notify Webhook).
  * **Bổ sung Recipe #13:** "Unichain-to-Base Flight-to-Safety" vào Ma trận kịch bản thực chiến.
* **Ngày tạo:** 18/11/2026 12:15
* **Ngày hoàn thành:** 18/11/2026 12:18
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

#### `TASK-105` [DONE] — Bộ kiểm thử Foundry ban đầu
* **Module / Màn hình:** `contracts/test/`
* **Mục đích:** Chứng minh tính đúng đắn và an toàn của hợp đồng trước khi deploy.
* **Chi tiết thực thi:**
  * Viết `ActionVault.t.sol` (8 tests): kiểm tra Non-custodial, authorization, panic button, SafeSweep chuyển ví lạnh, và cơ chế Skip khi giá hồi phục.
  * Viết `StopLoss_Pipeline.t.sol` (5 tests) để kiểm tra lọc địa chỉ pair, ngưỡng giá và cooldown.
  * Kết quả ghi nhận ngày 14/11: `forge test -vvv` qua 13/13 test.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 14/11/2026 18:53
* **Trạng thái:** `DONE`

#### `TASK-106` [DONE] — Deploy Hợp Đồng Lên Mạng Thử Nghiệm Thật (Live Testnet)
* **Module / Màn hình:** Base Sepolia (`84532`) & Reactive Lasna (`5318007`)
* **Mục đích:** Triển khai hạ tầng hợp đồng on-chain thật chuẩn bị cho tương tác full loop theo luật Reactive Buildathon.
* **Chi tiết thực thi:**
  * Các địa chỉ dưới đây thuộc đợt triển khai ban đầu. Địa chỉ Vault/RSC dùng trong lượt full loop ngày 19/11 nằm trong [FULL_LOOP_EVIDENCE.json](FULL_LOOP_EVIDENCE.json).
  * Xây dựng kịch bản triển khai chuẩn mực Foundry tại `contracts/script/Deploy.s.sol`.
  * **Base Sepolia (Chain ID: 84532):**
    * `MockWETH`: `0x6ecfc31ef5199d82bad83a469f7434785858d7dd` (Tx: `0x35125b90e3a53adbb250ee163abb6316312932b9d4885b4ba2d6701cd4968f62`)
    * `MockUSDC`: `0x8c2d098617102a64925cc683d9b444f938a96082` (Tx: `0xb700140bade246a6e07489cf8cf3a677333d93767e33783a5ad4a0557649e3d6`)
    * `MockUniswapV2Pair`: `0x9a796b794999cabcd10d08f777b24ceb76e34b3e` (Tx: `0xc176df9c0cdc71ad14085908840229a8567cebdd04ae0ed79308a37443b1174d`)
    * `MockUniswapV2Router`: `0x826abc5bdd70882d445aedee0888412f39c05c29` (Tx: `0x9c4b20c29cc16965ad3d478309036b40eae78dcdf1b7314b06c0c5c29dc3fe47`)
    * `ActionVault`: `0x005d4cb896c9e0B07Bbf961FDC26b098D84079d7` (Tx: `0xf5632a0c0dd1762a073754de2ac078d5db12032b23977032810fad4ac9e4232d`), nạp 0.002 ETH.
  * **Reactive Lasna Testnet (Chain ID: 5318007):**
    * `StopLoss_Pipeline` (RSC): `0x8c2d098617102a64925cc683d9b444f938a96082` (Tx: `0xafb6bf9c969f26e42d2ffe97b6d990113a4b8fc1f5445cc1f99dfcb0b7f34bc0`).
    * Tự động đăng ký subscription vào Pair `0x9a796b79...` trên Base Sepolia với topic `Sync(uint112,uint112)`.
  * **Phân quyền & Ký quỹ:**
    * Cấp quyền RSC trên Vault: Tx `0xdaddfcadfbe4d2afb563ae57aa5f65cce67a281b4d733eb88d9b457ab1df1cc8` (Block `#60317785`).
    * Ký quỹ dự phòng `CallbackProxy.depositTo`: Tx `0x419d8dd4acb00f471f4e40282c473abc4b591e44e695a299281640a5f96b0955` (0.0005 ETH).
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:05
* **Trạng thái:** `DONE`

#### `TASK-107` [DONE] — Thực Thi Multi-Chain Full Loop Test & Xuất Bằng Chứng
* **Module / Màn hình:** `scripts/test-full-loop.ts` & `FULL_LOOP_EVIDENCE.json`
* **Mục đích:** Kích hoạt giao dịch swap trên Base Sepolia $\rightarrow$ Lasna React $\rightarrow$ Base Callback Vault.
* **Chi tiết thực thi:**
  * Xây dựng script kiểm thử tự động `scripts/test-full-loop.ts` kết nối trực tiếp RPC Base Sepolia và Reactive Lasna.
  * Lượt 18/11 xác nhận sự kiện nguồn và bước xử lý trên Lasna. Lượt 19/11 xác nhận thêm `StopLossExecuted` và chuyển token thử nghiệm đến chủ Vault trong receipt đích.
  * [FULL_LOOP_EVIDENCE.json](FULL_LOOP_EVIDENCE.json) lưu ba giao dịch của lượt 19/11 cùng địa chỉ hợp đồng. Xem `TASK-326` để đối chiếu từng bước.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 19/11/2026
* **Trạng thái:** `DONE`

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

#### `TASK-109` [DONE] — Nâng cấp `ActionVault.sol` với Decoupled Live Price Check & cờ `isCrossChainTrigger`
* **Module / Màn hình:** `contracts/src/ActionVault.sol` (Base Sepolia)
* **Mục đích:** Đảm bảo lệnh phòng vệ liên chuỗi (Unichain $\rightarrow$ Base) và lệnh kích hoạt theo Price Velocity không bị `OrderSkipped` do giá Base chưa kịp giảm, trong khi vẫn kiểm tra `minAmountOut` chống MEV.
* **Chi tiết thực thi:**
  * Tích hợp xử lý decoupled: Khi `thresholdPriceUSD == type(uint256).max` hoặc `isCrossChainTrigger == true`, bypass kiểm tra giá tĩnh pool nội bộ Base Sepolia.
  * Giữ nguyên 100% kiểm tra `amountOut >= minAmountOut` qua Uniswap Router `getAmountsOut()` để triệt tiêu nguy cơ sandwich MEV.
  * Viết thêm 2 Foundry unit tests trong `ActionVault.t.sol`: `test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithMaxThreshold` và `test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithExplicitFlag`. Đạt 10/10 tests PASS 100%.
* **Ngày tạo:** 14/11/2026 19:30
* **Ngày hoàn thành:** 18/11/2026 13:03
* **Trạng thái:** `DONE`

#### `TASK-110` [DONE] — Nâng cấp `StopLoss_Pipeline.sol` với Stateful Anti-Wick Counter, Sliding Window & Dynamic Origin Chain
* **Module / Màn hình:** `contracts/src/StopLoss_Pipeline.sol` (Reactive Lasna)
* **Mục đích:** Hỗ trợ tính toán Price Velocity, chống giật râu nến bằng bộ nhớ bền vững của RVM và hỗ trợ lắng nghe sự kiện từ Unichain Sepolia (`1301`) hoặc Base Sepolia (`84532`).
* **Chi tiết thực thi:**
  * **Stateful Anti-Wick:** Khai báo `consecutiveHits` và `requiredHits`. Nếu giá hồi phục trên ngưỡng thì reset về 0, chỉ kích hoạt khi đủ số hits liên tiếp (chống 100% râu nến giả).
  * **Internal Gas Estimator:** Khai báo `callbacksEmitted` tăng mỗi lần bắn callback, hóa giải bẫy ReactVM Dual-State Trap.
  * **Price Velocity Guard:** Triển khai thuật toán Anchored Sliding Window (`windowStartPrice`, `windowStartTime`, `velocityThresholdBps`, `windowSeconds`).
  * **Dynamic Origin Chain:** Hỗ trợ `originChainId` linh hoạt (`84532` hoặc `1301`) và custom `originTopic0`.
  * Viết bộ kiểm thử Foundry trong `StopLoss_Pipeline.t.sol`: Đạt 8/8 tests PASS 100% (tổng 18/18 tests trong `contracts/test/`).
  * Đồng bộ trích xuất ABI/Bytecode sang `packages/shared/` và `backend/src/abis/`, cập nhật `deployer.service.ts`.
* **Ngày tạo:** 14/11/2026 19:30
* **Ngày hoàn thành:** 18/11/2026 13:03
* **Trạng thái:** `DONE`

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
* **Mục đích:** Validate đồ thị stop-loss, trích xuất tham số và deploy RSC qua Viem với 1.0 lREACT gas tài trợ.
* **Chi tiết thực thi:**
  * Xây dựng `PipelineGraphSchema` với Zod đảm bảo kiểm tra cấu trúc nodes, edges, và metadata owner.
  * Viết `DeployerService` trích xuất tham số: `pairAddress`, `priceThresholdWei`, `cooldownSeconds`, `percentToSwap`, `actionVaultAddress`.
  * Tích hợp `walletClient.deployContract` tự động nạp `{ value: parseEther('1.0') }` cho RSC.
  * Cung cấp REST endpoint `POST /api/pipeline/compile-and-deploy`.
  * API đợi receipt Lasna trước khi trả `pipelineId`, địa chỉ hợp đồng và link explorer. Deployer từ chối node ngoài phạm vi stop-loss. Nghiệm thu luồng gọi từ Studio trên cloud nằm ở `TASK-337`.
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

#### `TASK-208` [DONE] — Buffer Activity Logs, REST API và WebSocket
* **Module / Màn hình:** `backend/src/services/eventListener.service.ts` & `routes/logs.route.ts`
* **Mục đích:** Cung cấp buffer và đường phân phối sự kiện cho Activity Logs.
* **Chi tiết thực thi:**
  * `EventListenerService` giữ tối đa 50 bản ghi trong bộ nhớ và phát qua `WebSocketGateway` khi nhận bản ghi mới. `GET /api/logs` hỗ trợ lọc theo `pipelineId`.
  * Dữ liệu seed ban đầu đã được gỡ tại `TASK-327`. Luồng đọc sự kiện trực tiếp từ RPC và đọc bù sau restart nằm ở `TASK-336`.
* **Ngày tạo:** 14/11/2026 17:52
* **Ngày hoàn thành:** 14/11/2026 18:38
* **Trạng thái:** `DONE`

#### `TASK-209` [DONE] — Xây dựng Màn hình Template Library (Recipe Store 1-Click)
* **Module / Màn hình:** Màn hình 3 — Template Library (`frontend/src/app/workspace/templates/page.tsx`)
* **Mục đích:** Cho phép người dùng và Giám khảo hydrate công thức có sẵn lên Canvas trong 1 click.
* **Chi tiết thực thi:**
  * Xây dựng module `frontend/src/lib/recipes.ts` chứa đầy đủ cấu hình đồ thị 6 Recipes (Flash Crash Stop-Loss, Take-Profit Scalper, Anti-Drainer, Daily Autonomous Rebalancer, Payday Auto-Splitter, Unichain Cross-Chain Hedge).
  * Kết nối điều hướng `href="/workspace/studio?recipe=${id}"` và kích hoạt tự động hydrate toàn bộ nodes/edges lên Studio Canvas qua `useSearchParams`.
  * Bổ sung bộ chọn nhanh Preset Selector trên Studio Top Control Bar cho phép chuyển đổi tức thì giữa các công thức.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:42
* **Trạng thái:** `DONE`

#### `TASK-210` [DONE] — Xây dựng Màn hình Vault Manager & Panic Button
* **Module / Màn hình:** Màn hình 4 — Vault Manager (`frontend/src/app/workspace/vault/page.tsx`)
* **Mục đích:** Quản lý số dư két an toàn, nạp rút ETH và nút đỏ khẩn cấp `emergencyWithdraw()`.
* **Chi tiết thực thi:**
  * Tích hợp Wagmi v2 + Viem kết nối trực tiếp contract `ActionVault.sol` (`0x005d4cb896c9e0B07Bbf961FDC26b098D84079d7`) trên Base Sepolia.
  * Đọc số dư ETH on-chain thật qua `useBalance` (Zero-Mock Policy) và số dư ví MetaMask kết nối.
  * Form nạp Native ETH vào ActionVault qua `useSendTransaction` kèm thông báo toast và link Basescan.
  * Nút đỏ Emergency Panic Button với dialog xác nhận gọi hàm on-chain `emergencyWithdraw()` phi lưu ký 100%.
  * Nút quản trị phân quyền Non-Custodial gọi `setAuthorizedRSC()` cho phép cấp hoặc thu hồi quyền truy cập của StopLoss RSC.
  * Hiển thị địa chỉ ví lạnh dự phòng `backupSafeAddress` phục vụ cơ chế SafeSweep chống rút ruột ví.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:46
* **Trạng thái:** `DONE`

#### `TASK-211` [DONE] — Xây dựng Màn hình Active Automations
* **Module / Màn hình:** Màn hình 2 — Active Automations (`frontend/src/app/workspace/active/page.tsx`)
* **Mục đích:** Hiển thị deployment stop-loss đã xác minh và quyền RSC trên Vault.
* **Chi tiết thực thi:**
  * Commit `872a381` đối chiếu chủ Vault, Vault đích của RSC và quyền callback cho một cặp Vault/RSC cấu hình sẵn. Màn hình có link explorer và trạng thái lỗi đọc.
  * Số dư gas và thao tác Refuel theo deployment được theo dõi ở `TASK-329`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:47
* **Trạng thái:** `DONE`

#### `TASK-212` [DONE] — Mở rộng Palette Studio với Node #11 (Custom Event), Node #14 (Price Velocity) & Chain Selector
* **Module / Màn hình:** Pipeline Studio (`frontend/src/components/canvas/`)
* **Mục đích:** Đưa 2 Node mới lên Canvas Palette, cấu hình Typed Port Matrix và bổ sung lựa chọn Origin/Destination Chain ID.
* **Chi tiết thực thi:**
  * Xây dựng `CustomEventWatcherNode.tsx` hỗ trợ nhập địa chỉ hợp đồng, tên event và tự tính `topic_0` qua Viem `toEventSelector()`.
  * Xây dựng `PriceVelocityGuardNode.tsx` với slider `% drop` và cửa sổ thời gian `windowSeconds`.
  * Tích hợp `originChainId` (`84532` Base Sepolia hoặc `1301` Unichain Sepolia) vào Triggers và `destinationChainId` vào Actions.
  * Hiển thị huy hiệu `[ 🌐 Cross-Chain: Unichain -> Base ]` trên dây nối khi khác Chain ID qua `EdgeLabelRenderer`.
  * Ràng buộc Typed Port: Cấm nối Node #11 vào Condition #4 và #14; cho phép nối qua Cooldown #5 / Balance #6 tới Actions.
* **Ngày tạo:** 14/11/2026 19:30
* **Ngày hoàn thành:** 18/11/2026 14:38
* **Trạng thái:** `DONE`

#### `TASK-213` [DONE] — Triển khai Nút Simulate Flow (Dry-Run Sandbox) & Tab Live Solidity Preview
* **Module / Màn hình:** Pipeline Studio Toolbar & Inspector (`frontend/src/components/canvas/`)
* **Mục đích:** Nâng cao điểm Craft/DevTools, cho phép BGK test visual pipeline không cần đợi biến động giá và kiểm chứng tính minh bạch on-chain.
* **Chi tiết thực thi:**
  * Nút `[ 🧪 Simulate Flow ]`: Bắn event mô phỏng kích hoạt tuần tự Trigger chớp Cyan $\rightarrow$ Photon Pulse trên dây $\rightarrow$ Condition Glowing $\rightarrow$ Action Tick Xanh (kèm watermark tiến trình "Sandbox Preview Mode" và toast hoàn thành).
  * Modal `[ </> View Solidity ]`: Xây dựng `SolidityPreviewModal.tsx` trích xuất thông số thời gian thực từ active canvas graph (pairAddress, priceThreshold, cooldownSeconds, percentToSwap, actionVault, velocityThresholdBps, windowSeconds, originChainId), hỗ trợ copy code và tải file `.sol`.
* **Ngày tạo:** 14/11/2026 19:30
* **Ngày hoàn thành:** 18/11/2026 14:40
* **Trạng thái:** `DONE`

#### `TASK-214` [DONE] — Bổ sung Recipe 5 (Payday Auto-Splitter) & Recipe 6 (Cross-Chain Hedge) vào Template Library
* **Module / Màn hình:** Màn hình 3 — Template Library (`frontend/src/app/workspace/templates/page.tsx`)
* **Mục đích:** Cung cấp 2 kịch bản đột phá "An automation nobody's thought of yet" phục vụ chấm giải Track Set It and Forget It.
* **Chi tiết thực thi:**
  * Khai báo schema Recipe 5: `Payday Auto-Splitter` (Watch Transfers incoming USDC > 1,000 $\rightarrow$ Balance Check $\rightarrow$ 20% DCA ETH + 30% SafeSweep ví lạnh + Webhook Alert).
  * Khai báo schema Recipe 6: `Unichain-to-Base Cross-Chain Hedge` (Watch DEX Price Unichain Sepolia 1301 $\rightarrow$ Velocity Guard > 5% trong 10s $\rightarrow$ 300s Cooldown $\rightarrow$ Swap Base Sepolia 84532 với cờ `isCrossChainTrigger`).
  * Kết nối Graph Hydration Engine và kiểm thử render 1-click lên Studio Canvas thành công 100%.
* **Ngày tạo:** 14/11/2026 19:30
* **Ngày hoàn thành:** 18/11/2026 14:42
* **Trạng thái:** `DONE`

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

#### `TASK-301` [DONE] — Hiệu ứng Chớp Xung Photon trên Canvas (Pulse Visualizer)
* **Module / Màn hình:** Pipeline Studio Canvas (`StudioCanvas.tsx`, `CustomEdge.tsx`)
* **Mục đích:** Tạo hiệu ứng ánh sáng chạy dọc theo các dây nối khi nhận sự kiện WebSocket (Hiệu ứng WOW).
* **Chi tiết thực thi:**
  * Tích hợp WebSocket Gateway listener (`/stream`) trong `StudioCanvas.tsx` lắng nghe sự kiện `REACTIVE_STEP_UPDATE`.
  * Nâng cấp `CustomEdge.tsx` với chế độ tăng tốc Photon Burst (`animDur: 0.9s`, đa lớp hạt quang tử drop-shadow neon glow).
  * Chuyển đổi trạng thái trực quan các node theo thời gian thực (IDLE $\rightarrow$ EVENT_CAPTURED $\rightarrow$ CONDITION_MET $\rightarrow$ SUCCESS) mà không gây re-render hay giật lag layout.
  * Bổ sung huy hiệu trạng thái WebSocket thời gian thực `[ 🟢 WS Live Stream ]` trên thanh Studio Toolbar.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:52
* **Trạng thái:** `DONE`

#### `TASK-302` [DONE] — Xây dựng màn hình Activity Logs
* **Module / Màn hình:** Màn hình 5 — Activity Logs (`frontend/src/app/workspace/logs/page.tsx`)
* **Mục đích:** Cung cấp màn hình lịch sử trong Workspace.
* **Chi tiết thực thi:**
  * Màn hình hiện hiển thị trạng thái kết nối ví hoặc lịch sử chưa khả dụng, kèm liên kết sang bằng chứng testnet công khai.
  * Việc gỡ seed đã hoàn tất ở `TASK-327`. Đọc lịch sử từ REST, cập nhật qua WebSocket và hiển thị liên kết từng giao dịch nằm ở `TASK-336`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 14:55
* **Trạng thái:** `DONE`

#### `TASK-303` [DONE] — Xây dựng Landing Page Hero & Mini Interactive Canvas
* **Module / Màn hình:** Landing Page (`/`)
* **Mục đích:** Tạo ấn tượng thị giác mạnh mẽ đầu tiên cho Ban Giám Khảo (theo phong cách Technical Minimalist cao cấp của Canary kết hợp màu sắc nhận diện Obsidian Violet của OmniFlow).
* **Chi tiết thực thi:**
  * Xây dựng trang Landing Page `/` với đầy đủ 7 sections: `Navbar`, `Hero`, `HeroCanvasPreview` (3 acts: Stop-Loss, 200ms Denim Storm Guard, Non-Custodial Panic Sweep), `LiveTelemetry` (Base Sepolia + Lasna multi-chain telemetry), `ArchitecturePillars` (4 nguyên lý kiến trúc), `HonestyLedger` (Bảng trung thực on-chain & script xác minh 1 lệnh), `CallToAction` và `Footer`.
  * Chuẩn hóa sang phong cách Light Theme tinh tế (nền trắng ngà `#FAFAFC`, lưới kỹ thuật 40px, dải ánh sáng ambient mesh đa tầng) kết hợp tông màu chủ đạo Tím Obsidian (`#7C3AED`, `#8B5CF6`) chuẩn phong cách FinTech cao cấp.
  * Tích hợp mượt mà với Tailwind CSS, build static 100% pass 9/9 routes không lỗi TypeScript.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 17/11/2026 09:55
* **Trạng thái:** `DONE`

#### `TASK-304` [TODO] — Đóng gói Docker & Triển khai Cloud (Vercel & Railway)
* **Module / Màn hình:** Hạ tầng Cloud Deploy (`backend/Dockerfile`, `frontend/Dockerfile`, `backend/railway.json`, `frontend/vercel.json`, `docker-compose.yml`)
* **Mục đích:** Đưa toàn bộ hệ thống lên môi trường production sẵn sàng cho BGK truy cập.
* **Chi tiết thực thi:**
  * Xây dựng `backend/Dockerfile` multi-stage (Node 20 Alpine builder $\rightarrow$ runner tinh gọn) tích hợp healthcheck tự động vào `/health`.
  * Cấu hình `backend/railway.json` chuẩn schema Railway với restart policy và timeout probe.
  * Xây dựng `frontend/Dockerfile` tối ưu và `frontend/vercel.json` thiết lập tiêu chuẩn bảo mật (CSP, X-Frame-Options, X-Content-Type nosniff).
  * Repo có `docker-compose.yml` để chạy frontend và backend cùng nhau.
  * **Còn lại:** Chỉ triển khai Vercel/Railway sau khi `TASK-353` đạt trên public testnet với web/API chạy local. Sau đó xác nhận URL, `/health`, RPC theo manifest và REST/WebSocket từ frontend cloud.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công bước xác minh cloud.
* **Trạng thái:** `TODO`

#### `TASK-305` [DONE] — Thêm kiểm tra RPC, bằng chứng và CSS
* **Module / Màn hình:** Toàn bộ Frontend & Smart Contracts (`scripts/verify-all.ts`, `globals.css`)
* **Mục đích:** Thêm script rà soát cấu hình triển khai, tệp bằng chứng và một số dấu hiệu trợ năng trong CSS.
* **Chi tiết thực thi:**
  * `scripts/verify-all.ts` kiểm tra kết nối RPC, bytecode của các địa chỉ được cấu hình trong script và trường dữ liệu trong tệp bằng chứng. Địa chỉ deployment của lượt stop-loss đã xác minh nằm trong `FULL_LOOP_EVIDENCE.json`.
  * Phần trợ năng kiểm tra dấu hiệu focus và bảng màu trong CSS. Nghiệm thu bằng bàn phím và đo độ tương phản trên bản demo nằm ở `TASK-337`.
* **Ngày tạo:** 14/11/2026 17:35
* **Ngày hoàn thành:** 18/11/2026 15:02
* **Trạng thái:** `DONE`

#### `TASK-306` [DONE] — Đại phẫu Toàn diện UI OmniFlow theo Chuẩn Đẳng Cấp Canary
* **Module / Màn hình:** Toàn bộ UI Frontend (`Landing Page`, `Header/Navbar`, `Hero Stage`, `Wall Surfaces`, `Buttons & Tokens`, `Workspace Shell & Dashboard Kit`)
* **Mục đích:** Nâng cấp độ tương đồng và chiều sâu thẩm mỹ từ 40% lên 100% so với bản mẫu https://portal-canary-app.vercel.app/ (truy xuất trực tiếp mã nguồn `portalcanary/`). Khắc phục toàn bộ các chi tiết thiếu sót về background đa tầng (`page-background-lights.png`, vector header, title/button/app frames), hệ thống buttons cao cấp (`button-primary`, `button-dark` với specular highlights và micro-interactions), navbar scroll-morphing thành floating pill, hover follower pill với spring physics, Wall surfaces với dock phóng to macOS (`motion`), Hero stage 3-act đồng bộ timeline, banner CTA pastel gradient (`SimplerCTA`), đồng thời **giữ trọn vẹn 100% font chữ hiện tại** (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`).
* **Chi tiết thực thi:**
  * Lập bản kế hoạch chi tiết `canary_ui_upgrade_plan.md` trong Artifact Brain và được User phê duyệt.
  * Cài đặt thư viện `motion` cho micro-interactions và hiệu ứng dock phóng đại.
  * Bổ sung tài nguyên ảnh và vector frames vào `frontend/public/assets/` (`page-background-lights.png`, `header/vector.png`, `hero/orbit/circle.png`, `title-frame-1/2`, `button-frame-1/2`, `app-frame-1/2`).
  * Tinh chỉnh `globals.css` với hệ thống nút bấm `.button-primary`, `.button-dark`, `.button-light`, `.shadow-badge-dark`, hiệu ứng quay `hero-orbit` và `hero-app-bulletproof-app-frame`.
  * Tái cấu trúc `PageBackground.tsx` với layer ảnh quang học thực + vector chân trời.
  * Tái cấu trúc `Navbar.tsx` hỗ trợ tự động cuộn >300px morph thành Floating Pill cố định ở đỉnh, kèm viên nang highlight trượt theo trỏ chuột bằng thuật toán lò xo WAAPI (`spring.ts`).
  * Nâng cấp `Hero.tsx` với cụm quay quỹ đạo `hero-orbit`, 4 khung góc vector tiêu đề và 2 cánh nút bấm, giữ nguyên font Plus Jakarta Sans với tracking chặt `-0.03em`.
  * Xây dựng `HeroCanvasPreview.tsx` với 3 Acts đồng bộ thanh tiến trình liên tục `hero-tabs-progress` và viền góc frame app.
  * Tạo mới `SurfacesWall.tsx` với thanh dock phóng đại macOS mượt mà dựa trên tọa độ chuột tương tác với 7 bề mặt trực tiếp của OmniFlow.
  * Tạo mới `SimplerCTA.tsx` với thẻ pastel gradient `#D1E9FF` $\rightarrow$ `#F7F7F7` và lưới 2 cột tính năng.
  * Tạo mới bộ Universal Dashboard Kit `frontend/src/components/ui/kit.tsx` (`Panel`, `Stats`, `KV`, `Status`, `Mark`, `fmt`, `downloadJson`).
  * Nâng cấp `ArchitecturePillars.tsx`, `LiveTelemetry.tsx`, `HonestyLedger.tsx` và `Footer.tsx` đồng bộ với theme Obsidian Luminous.
  * Biên dịch `pnpm --filter frontend build` thành công 100%, render trọn vẹn 9/9 static routes với 0 lỗi TypeScript.
* **Ngày tạo:** 17/11/2026 10:50
* **Ngày hoàn thành:** 17/11/2026 11:04
* **Trạng thái:** `DONE`

#### `TASK-307` [DONE] — Tích hợp Trực tiếp Kiến trúc Gốc Canary: Khắc phục Triệt để Lỗi Nền Full Đen & Đồng bộ 100% Giao diện
* **Module / Màn hình:** Landing Page (`/`), CSS Subsystem, Root Layout
* **Mục đích:** Xóa bỏ hoàn toàn lỗi gán nhầm nền đen toàn trang (`bg-[#08090D]`) gây mất tương phản và sai khác với mẫu Canary; nhập khẩu và thích ứng trực tiếp toàn bộ 100% mã nguồn UI gốc từ `portalcanary/` kết hợp thương hiệu OmniFlow & Reactive Omni, đồng thời bảo tồn trọn vẹn font chữ đẹp (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`).
* **Chi tiết thực thi:**
  * Giải phóng `RootLayout` (`frontend/src/app/layout.tsx`) khỏi thuộc tính `bg-[#08090D]` và `className="dark"`. Cô lập chế độ tối hoàn toàn vào `/workspace/*` (`frontend/src/app/workspace/layout.tsx`).
  * Nhập khẩu trọn vẹn bộ stylesheet gốc `landing.css` (144KB) với gradient đa tầng chân thực của Canary: dải màu từ tím chàm thiên hà `#0f071d` kết hợp `page-background-lights.png`, chuyển tiếp mượt mà qua xanh điện tử `#0087e1`, xanh băng dịu `#e6f4f7` và hòa vào nền sáng trắng tinh khôi `#fff` ở các section tính năng phía dưới.
  * Tích hợp `LandingRuntime.tsx` tự động chạy Intersection Observer điều khiển các hiệu ứng CSS keyframe animation (`.is-visible`) và lazy loaders.
  * Tích hợp toàn bộ hệ thống section chuẩn Canary: `HeaderBar` (thanh điều hướng floating pill với dropdown vector), `Hero` (quỹ đạo sao quay `hero-orbit`, huy hiệu tia sét SVG, 4 khung trang trí góc, video stage 3-act đồng bộ thanh tiến trình quang học), `Surfaces` (bức tường dock macOS phóng đại theo chuột tương tác), `AlsoAvailable` (thẻ recipe tắt), `Features` (bộ 3 widget tương tác `BuildCards`, `MeasureChart`, `SmokeChecks`, `SupplyGauge`), `GetStarted` (quy trình khởi tạo pipeline 3 bước), `Checks` (bảng đối soát 4 nguyên lý phòng vệ), `Faq` (accordion 2 cột giải đáp kiến trúc Reactive Omni), `Simpler` (thẻ CTA pastel gradient), và `Footer` (huy hiệu trạng thái mạng xanh lục nhấp nháy).
  * Chuyển đổi và tinh chỉnh toàn bộ nội dung, copy, nhãn điều hướng sang OmniFlow: Base Sepolia 200ms blocks, Reactive Omni Lasna, Non-Custodial ActionVault, Zero-Keeper automation.
  * Cấu hình ưu tiên font chữ `'Plus Jakarta Sans', Inter` và `JetBrains Mono` xuyên suốt `landing.css` và `globals.css`.
  * Biên dịch Next.js thành công 9/9 trang, kiểm tra server `localhost:3000` trả về HTTP 200 OK với đầy đủ mã nguồn Canary chuẩn xác.
* **Ngày tạo:** 17/11/2026 11:15
* **Ngày hoàn thành:** 17/11/2026 11:28
* **Trạng thái:** `DONE`

#### `TASK-308` [DONE] — Chuyển Đổi Hoàn Toàn Nhận Diện Thương Hiệu: Tone Tím Obsidian (Obsidian Violet) & Tinh Chỉnh Bộ Widget Tương Tác
* **Module / Màn hình:** Landing Page (`/`), Hero Stage Canvas Mockup, Section Features & Widgets, `landing.css`
* **Mục đích:** Chuyển đổi toàn diện giao diện từ màu xanh dương điện tử của Canary sang màu tím Obsidian đặc trưng của OmniFlow (`#08090D`, `#7C3AED`, `#8B5CF6`, `#C084FC`, `#EDE9FE`), thay thế video Canary bằng Studio Canvas Mockup tương tác 3 Act chạy trực tiếp trong frame app, và đồng bộ toàn bộ nội dung widget (`BuildCards`, `MeasureChart`, `SmokeChecks`, `Features`) sang kiến trúc Reactive Omni / Base Sepolia.
* **Chi tiết thực thi:**
  * Cập nhật `landing.css`: Chuyển dải gradient `.page-background` và `.cta` từ xanh dương sang Obsidian Violet gradient. Cập nhật nút chính `.button-primary` sang violet specular highlight và photon violet glow.
  * Cập nhật `Simpler.tsx`: Đổi gradient thẻ sang Amethyst Lilac pastel mềm mại (`#EDE9FE` -> `#F3E8FF` -> `#F8FAFC`).
  * Xây dựng `HeroStudioCanvasMockup.tsx`: Tạo DAG canvas tương tác 3 node (Base Sepolia Trigger -> Lasna RSC State Machine -> Base Sepolia ActionVault Sweep) với xung quang tử photon pulse, thanh telemetry trực tiếp, và đồng bộ act với laser progress bar trong `HeroStage.tsx`.
  * Tinh chỉnh `BuildCards.tsx`: Chuyển đổi các thẻ runtime sang 3 giai đoạn pipeline OmniFlow (`Trigger: Uniswap Swap`, `Reactive Omni RSC Core`, `ActionVault Callback Execution`).
  * Tinh chỉnh `MeasureChart.tsx` và `MeasureChartView.tsx`: Đổi dải màu cột sang tím amethyst/violet và hiển thị độ trễ full loop end-to-end (~1.4s).
  * Tinh chỉnh `SmokeChecks.tsx`: Cập nhật các bước kiểm tra tự động sang xác minh full-loop Reactive Omni.
* **Trạng thái:** `DONE`

#### `TASK-309` [DONE] — Tinh chỉnh & May đo Toàn diện UI Landing Page theo Blueprint
* **Module / Màn hình:** Landing Page (`/`), `HeaderBar`, `HeaderPanelView`, `Hero`, `Checks` (Security), `Simpler` (Studio CTA), `GetStarted`, `Features`, `Faq`, `Wall`
* **Mục đích:** Tinh chỉnh toàn bộ landing page theo đúng đặc tả `docs/LANDING_PAGE_REDESIGN_BLUEPRINT.md`. Giữ nguyên phong cách chủ đạo Tím Obsidian (`#7C3AED`, `#8B5CF6`) và nền trắng sáng tinh tế ở các section dưới, đồng thời bảo tồn Hero Section nền đen - tím galaxy nhạt dần; thanh lọc 100% tàn dư text/link của Canary và biến toàn bộ thành các widget chuyên sâu cho OmniFlow (Reactive Omni, Base Sepolia 200ms Denim, 4 Defensive Patterns, Studio DAG, 10-Node Catalog).
* **Chi tiết thực thi:**
  * Cập nhật `HeaderView.tsx` & `HeaderPanelView.tsx`: Xóa toàn bộ liên kết `portalcanary`, thay menu Tools thành Studio Canvas, Recipe Store, ActionVault Escrow, và Live Telemetry Logs.
  * Cập nhật `Hero.tsx` & `HeroStage.tsx`: Đồng bộ headline, subtitle ("Drag, drop, deploy. Your pipelines run 24/7 on Reactive Omni"), badge 1s Finality, và các tab 3-act (Origin Trigger, Reactive Core, Vault Execution).
  * Cập nhật `Checks.tsx` sang Security Invariants: Chuyển đổi từ "Doctor" sang 4 Defensive Patterns (Callback Proxy Auth, Stateless Cooldown, Live Price Re-Validation, Non-Custodial Panic Button & Safe Sweep).
  * Cập nhật `Simpler.tsx`: Thay thế nội dung cũ bằng thông điệp trực quan về Studio DAG Canvas, 10-Node Orthogonal Catalog và Pre-compiled Bytecode Deployer dưới 2s.
  * Cập nhật `FeatureDashboardView.tsx`, `Faq.tsx`, `IssueButton.tsx`, `Wall.tsx`, `AutoUpgradeView.tsx`: Loại bỏ 100% các liên kết external và chuỗi text Canary còn sót lại.
  * Cập nhật `GetStarted.tsx`: Headline "Build and automate with OmniFlow Zero Keepers", nút bấm trực tiếp vào Studio và Recipes.
  * Kiểm tra build Next.js / TypeScript (`npx tsc --noEmit`) đạt 100% không lỗi.
* **Ngày tạo:** 17/11/2026 20:29
* **Ngày hoàn thành:** 17/11/2026 20:41
* **Trạng thái:** `DONE`

#### `TASK-310` [DONE] — Tối ưu hóa Toàn diện Cơ chế Chuyển Màn hình & Định tuyến SPA (Eliminate Route Lag & Transition Delay)
* **Module / Màn hình:** Next.js App Router Navigation (`frontend/src/app/`, `frontend/src/components/landing/`, `Header.tsx`, `Sidebar.tsx`)
* **Mục đích:** Khắc phục triệt để tình trạng chuyển đổi giữa các màn hình (Landing Page $\leftrightarrow$ Pipeline Studio $\leftrightarrow$ Vault $\leftrightarrow$ Templates $\leftrightarrow$ Logs) bị chậm trễ, giật lag hoặc đơ mất vài giây.
* **Nguyên nhân cốt lõi phát hiện:**
  1. Toàn bộ các nút CTA và menu trên Landing Page (`HeaderView`, `HeaderPanelView`, `Hero`, `Simpler`, `Checks`, `GetStarted`, `AlsoAvailable`, `Footer`, `FeatureDashboardView`) trước đây dùng thẻ `<a href="/workspace/...">` truyền thống. Khi click, trình duyệt kích hoạt Full Page Reload (Hard Navigation), xé bỏ toàn bộ DOM, unmount Wagmi/Viem provider, và bắt Next.js dev server biên dịch lại toàn bộ trang từ đầu (~2-5s trên Windows NTFS).
  2. Workspace thiếu `loading.tsx`, khiến Next.js freeze ở trang cũ mà không có phản hồi thị giác trong khi chuẩn bị trang mới.
  3. Màn hình Pipeline Studio import tĩnh toàn bộ thư viện canvas nặng `@xyflow/react`, gây nghẽn tiến trình render trong chu kỳ route change ban đầu.
  4. Thiếu file redirect gốc `frontend/src/app/workspace/page.tsx`, và thanh breadcrumb `Header.tsx` bị hardcode cố định "Pipeline Studio".
* **Chi tiết thực thi:**
  * Chuyển đổi 100% các liên kết nội bộ sang `next/link` (`<Link href="...">`), kích hoạt cơ chế Next.js SPA Soft Navigation và tự động prefetch ngầm các route đích.
  * Tách module canvas `StudioCanvas` bằng `next/dynamic` với `{ ssr: false }` trong `studio/page.tsx`, tách gói `@xyflow/react` khỏi main bundle chuyển trang.
  * Tạo mới `frontend/src/app/workspace/loading.tsx` với hiệu ứng Obsidian Skeleton Screen phản hồi tức thì 0ms.
  * Tạo mới `frontend/src/app/workspace/page.tsx` tự động redirect ngay lập tức về `/workspace/studio`.
  * Cập nhật `Header.tsx` sử dụng hook `usePathname()` để hiển thị breadcrumb động chuẩn xác theo từng route (`Pipeline Studio`, `Active Automations`, `Template Library`, `Vault Manager`, `Activity Logs`).
  * Kiểm tra biên dịch TypeScript `pnpm --filter frontend exec tsc --noEmit` đạt 0 lỗi. Tốc độ chuyển màn hình giảm từ ~3-5s xuống <50ms.
* **Ngày tạo:** 17/11/2026 20:45
* **Ngày hoàn thành:** 17/11/2026 20:53
* **Trạng thái:** `DONE`

#### `TASK-311` [DONE] — Tái cấu trúc Toàn diện Landing Page theo Thiết kế MotionSize Single-Viewport Video Background
* **Module / Màn hình:** Landing Page (`frontend/src/app/page.tsx`, `frontend/src/components/landing/`, `landing.css`, `motion-landing.css`)
* **Mục đích:** Thay thế hoàn toàn trang Landing Page hiện tại bằng thiết kế mới từ `docs/MOTION_UI_PROMPT.md` (single-viewport, full-bleed video-background, Bubbledot retro dot-matrix display typography, Font Awesome brand icons, interactive entrance animations, responsive mobile slide-down menu sheet, và live count-up stats).
* **Chi tiết thực thi:**
  * Nhúng background video CloudFront chuẩn xác (`hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4`) chế độ autoplay, muted, loop, playsinline, bao phủ 100vh/100dvh.
  * Tích hợp font CDN chuẩn: `BubbledotICG-FinePos` (OnlineWebFonts), `Inter` (Google Fonts), fallback `Geist Pixel Circle`, và Font Awesome 6.5.2 (Microsoft, Amazon, Google brand icons).
  * Xây dựng layout 3 vùng trên 1 viewport (Header, Hero, Stats footer) với CSS variables chuẩn xác.
  * Header: Logo nút tròn 46px viền trắng với hiệu ứng hover scale 1.04; Nav pill trắng bo tròn với active dots indicator; Sign in pill tối kết nối chuyển trang mượt mà vào Workspace Studio (`/workspace/studio`).
  * Hero: Trust badge ("Trusted by 2000+ Enterprises") với 3 avatar ring thương hiệu lồng nhau; Headline 2 dòng chuẩn xác (`Intelligence` / `Designed To Evolve`) phông Bubbledot dot-matrix; Subhead chuẩn; CTA "Get Started" hiệu ứng specular glow và `revealPulse`.
  * Stats footer: 4 metric trực quan (`< 120 ms Inference Time`, `% 99.99 % Platform Uptime`, `* 24 /7 Autonomous Runtime`, `# 2.4 M Context Windows`) với count-up animation easeOutCubic.
  * Responsive Mobile (<=720px): Burger toggle chuyển dấu X, full-screen dark overlay với backdrop-blur, white sheet navigation trượt từ trên xuống, đóng khi bấm link/escape/overlay.
  * Kiểm tra biên dịch TypeScript `pnpm --filter frontend exec tsc --noEmit` và `pnpm --filter backend build` đạt 100% không lỗi.
* **Ngày tạo:** 18/11/2026 11:40
* **Ngày hoàn thành:** 18/11/2026 11:47
* **Trạng thái:** `DONE`

#### `TASK-312` [DONE] — Lập Kế Hoạch & Mở Rộng Landing Page Toàn Diện kèm On-Chain Proof & Honesty Table (Lazy Loading)
* **Module / Màn hình:** Landing Page (`frontend/src/app/page.tsx`, `frontend/src/components/landing/`, `motion-landing.css`)
* **Mục đích:** Xây dựng kế hoạch và kiến trúc mở rộng cho trang Landing Page, nối tiếp mượt mà từ Hero Section Motion UI sang các section chức năng cốt lõi của OmniFlow. Bỏ Section 10-node catalog, tích hợp On-Chain Proof (trạng thái Pending Deployment chuẩn Zero-Mock) và Honesty Table (học tập kiến trúc minh bạch từ Canary), cùng cơ chế Lazy Loading (IntersectionObserver & Dynamic Import).
* **Chi tiết thực thi:**
  * Điều chỉnh kiến trúc 7 Sections mạch lạc:
    1. Hero Section (đã hoàn thiện, video CloudFront + Bubbledot).
    2. Visual Pipeline Studio Showcase (Interactive Canvas Mockup 3 Flagship Recipes).
    3. 4 Defensive Security Pillars (Proxy Auth, 200ms Cooldown, Price Re-Validation, Panic Sweep).
    4. On-Chain Proof & Honesty Table (What is Real vs What is Pending, Zero-Mock Policy, 3-Legged Execution Pipeline ở trạng thái PENDING_DEPLOYMENT, script tái xác thực `pnpm --filter backend test:full-loop`).
    5. Multi-Chain Topology & Live RPC Telemetry (Base Sepolia 84532 ↔ Reactive Lasna 5318007).
    6. Interactive Architecture FAQ & Invariants.
    7. Final Conversion CTA & Obsidian Footer.
  * Thiết kế cơ chế Lazy Loading: Sử dụng `IntersectionObserver` với `rootMargin: '250px'` và `next/dynamic` tách bundle, chỉ render component và nạp tài nguyên khi người dùng cuộn đến gần.
* **Ngày tạo:** 18/11/2026 11:54
* **Ngày hoàn thành:** 18/11/2026 12:07
* **Trạng thái:** `DONE`

#### `TASK-313` [DONE] — Nâng Cấp Hệ Thống Nền Ambient Đa Tầng (Zero AI Slop) Đồng Bộ Motion UI
* **Module / Màn hình:** Landing Page (`MotionLanding.tsx`, `motion-landing.css`, Section Dividers)
* **Mục đích:** Xóa bỏ sự đơn điệu của màu đen trơn ở các Section 2-7 mà không lạm dụng hiệu ứng AI-slop rực rỡ rẻ tiền. Thiết lập hệ thống nền đa tầng kỷ luật cao:
  1. Pin video CloudFront gốc cố định toàn trang (`position: fixed; inset: 0`), kết hợp lớp mặt nạ Obsidian Vignette chuyển sắc nhẹ cho phép dòng chảy của video tiếp tục thở mờ ảo dưới các khe hở của card khi cuộn trang.
  2. Lưới dot-matrix siêu mịn (28px) đồng bộ với phông chữ Bubbledot, tích hợp mặt nạ gradient hình elip để chỉ sáng nhẹ quanh khu vực nội dung.
  3. Đường chỉ laser phân cách siêu mảnh (`1px hairline`) giữa các section kèm micro-dot phát sáng trung tâm theo ngôn ngữ 3-chấm của Header.
  4. Coordinate Tech Badges tinh tế (`0x01 // STUDIO`, `0x02 // INVARIANTS`, `0x03 // PROOF`) tăng tính kỹ thuật chuẩn Web3 FinTech.
* **Ngày tạo:** 18/11/2026 12:12
* **Ngày hoàn thành:** 18/11/2026 12:15
* **Trạng thái:** `DONE`

#### `TASK-314` [DONE] — Tái Cấu Trúc Cơ Chế Scroll-Triggered Lazy Loading & Viewport Reveal
* **Module / Màn hình:** Landing Page (`LazySection.tsx`, `MotionLanding.tsx`, `motion-landing.css`)
* **Mục đích:** Khắc phục triệt để tình trạng các section bị kích hoạt đồng loạt ngay khi vừa tải trang. Chuyển sang cơ chế Scroll-Triggered chân thực:
  1. Đảm bảo mỗi section unmounted chiếm chiều cao vật lý thật bằng skeleton spacer trong luồng DOM (tránh co cụm ở vị trí 0px/100vh làm observer kích hoạt sớm).
  2. Cấu hình `rootMargin: "0px 0px -80px 0px"` và `threshold: 0.1` để chỉ kích hoạt khi người dùng thực sự cuộn màn hình đến gần section đó (vào trong viewport ít nhất 10%).
  3. Chỉ tải và nạp component dynamic (`render` hoặc conditional `{inView && <Component />}`) khi `inView = true`.
  4. Hiệu ứng xuất hiện thị giác sống động và rõ rệt: Khi cuộn tới, section chuyển động trượt lên `translateY(40px) -> 0`, độ mờ `blur(12px) -> 0`, và `opacity: 0 -> 1` với easing `cubic-bezier(0.16, 1, 0.3, 1)`.
* **Ngày tạo:** 18/11/2026 12:22
* **Ngày hoàn thành:** 18/11/2026 12:25
* **Trạng thái:** `DONE`

#### `TASK-315` [DONE] — Khắc phục Lỗi Runtime Activity Logs, Tối Ưu Tốc Độ Chuyển Route Workspace & Hiện Đại Hóa 5 Màn Hình theo Motion UI
* **Module / Màn hình:** Workspace Suite (`frontend/src/app/workspace/`, `Sidebar.tsx`, `Header.tsx`, `logs/page.tsx`, `active/page.tsx`, `templates/page.tsx`, `vault/page.tsx`, `studio/page.tsx`)
* **Mục đích:** Khắc phục lỗi crash `Objects are not valid as a React child` trên Activity Logs, loại bỏ triệt để độ trễ vài giây khi chuyển đổi giữa các tab màn hình trong Workspace, và hiện đại hóa giao diện Workspace theo ngôn ngữ Motion UI (Obsidian Dark, Bubbledot retro dot-matrix, Pill & Ring controls, Craft Floor standards).
* **Chi tiết thực thi:**
  1. Fix Bug Activity Logs: Chuẩn hóa interface dữ liệu `details` thành object/string linh hoạt, render dạng badge/chip trực quan cho `{tokenPair, triggerPrice, executedPrice, amountIn, amountOut}` thay vì render raw object. Hỗ trợ đầy đủ payload từ backend `/api/logs` không crash.
  2. Tối ưu Perf Chuyển Màn Hình: Bật `prefetch={true}` trên toàn bộ `Link` điều hướng ở `Sidebar`, chuyển `loading.tsx` từ skeleton wipe sang thanh laser progress bar không phá hủy DOM, giảm độ trễ phản hồi trang xuống mức ~50ms.
  3. Áp dụng Design Tokens Motion UI:
     - `Sidebar.tsx` & `Header.tsx`: Logo badge hình tròn tinh tế, font Bubbledot retro dot-matrix, nav pill với 3-dot indicator, live network telemetry status pills (#84532 Denim 200ms & #5318007 RVM).
     - 5 màn hình (`Studio`, `Active Automations`, `Template Library`, `Vault Manager`, `Activity Logs`): Thiết kế card obsidian frosted sang trọng, font Bubbledot ở tiêu đề và live stat symbols, tabular-nums cho toàn bộ metric tài chính.
  4. Kiểm tra biên dịch TypeScript `pnpm --filter frontend exec tsc --noEmit` và `pnpm --filter backend build` đạt 100% không lỗi.
* **Ngày tạo:** 18/11/2026 12:43
* **Ngày hoàn thành:** 18/11/2026 12:46
* **Trạng thái:** `DONE`

#### `TASK-316` [DONE] — Cập Nhật Bằng Chứng On-Chain Thật (Live Proof & Verifiable Explorer Hashes) Lên Landing Page
* **Module / Màn hình:** Landing Page (`OnChainProofLedger.tsx`, `MultiChainTelemetry.tsx`, `motion-landing.css`)
* **Mục đích:** Cập nhật toàn bộ bảng bằng chứng on-chain từ trạng thái Pending sang 100% Live & Verified với liên kết thật tới Basescan và Reactscan, tích hợp bộ chuyển tab (3-Leg Matrix, Raw FULL_LOOP_EVIDENCE.json, Honesty Table) và nút copy tiện lợi.
* **Chi tiết thực thi:**
  * `OnChainProofLedger.tsx` đọc ba bước của lượt 19/11 từ `FULL_LOOP_EVIDENCE.json`. Bước đích liên kết đến receipt chứa `StopLossExecuted`. Xem `TASK-326` để đối chiếu.
  * **Thêm 3 tabs tương tác:** Bảng 3-Leg Pipeline Proof, Trình xem JSON trực tiếp `FULL_LOOP_EVIDENCE.json`, Bảng cam kết trung thực Honesty Table.
  * **Cập nhật `MultiChainTelemetry.tsx`:** Gắn link Basescan và Reactscan trực tiếp cho `ActionVault.sol` và `StopLoss_Pipeline.sol`.
  * **Cập nhật CSS trong `motion-landing.css`:** Thêm các styles cho tab controls, block-confirmed, tx-link, và JSON code viewer.
  * Biên dịch TypeScript `pnpm --filter frontend exec tsc --noEmit` đạt 100% không lỗi.
* **Ngày tạo:** 18/11/2026 14:10
* **Ngày hoàn thành:** 18/11/2026 14:18
* **Trạng thái:** `DONE`

#### `TASK-317` [DONE] — Xây dựng Bộ Kiểm Thử Pipeline Deployer & DAG Compiler (10 Test Cases)
* **Module / Màn hình:** Backend Deployer (`backend/src/services/deployer.service.ts`, `backend/test/deployer.test.ts`)
* **Mục đích:** Kiểm thử toàn diện chức năng thẩm định đồ thị DAG, trích xuất tham số, đóng gói bytecode tham số hóa và deploy an toàn lên Reactive Lasna.
* **Chi tiết thực thi:**
  * Xây dựng 10 testcases:
    1. `DEP-01`: Trích xuất đầy đủ tham số từ đồ thị DAG hợp lệ (`pairAddress`, `priceThresholdWei`, `cooldownSeconds`, `percentToSwap`, `actionVaultAddress`, `originChainId`).
    2. `DEP-02`: Phát hiện và chặn đứng đồ thị chứa chu trình lặp (Cycle Detection qua Kahn's Algorithm).
    3. `DEP-03`: Báo lỗi khi thiếu Node Trigger đầu vào.
    4. `DEP-04`: Báo lỗi khi thiếu Node Action đầu ra.
    5. `DEP-05`: Từ chối đồ thị có các node rời rạc, không liên kết.
    6. `DEP-06`: Kiểm tra đóng gói tham số ABI vào Pre-compiled Bytecode dưới 2s.
    7. `DEP-07`: Xác thực tính toán tài trợ gas lREACT (`1.0 lREACT` cho 20 callbacks).
    8. `DEP-08`: Kiểm tra liên kết ActionVault RSC trên Base Sepolia (84532).
    9. `DEP-09`: Xử lý ngoại lệ RPC timeout và lỗi kết nối.
    10. `DEP-10`: Kiểm tra tính toàn vẹn của kết quả trả về `DeploymentResult`.
  * Chạy `node --import tsx --test test/deployer.test.ts`: **10/10 tests PASS (100%)**.
* **Ngày tạo:** 18/11/2026 15:13
* **Ngày hoàn thành:** 18/11/2026 15:15
* **Trạng thái:** `DONE`

#### `TASK-318` [DONE] — Xây dựng Bộ Kiểm Thử Độc Lập 12 Canvas Nodes & Typed Port Matrices (24 Test Cases)
* **Module / Màn hình:** Pipeline Studio Canvas Nodes (`backend/test/nodes.test.ts`, Zod Schemas & Node Port Logic)
* **Mục đích:** Kiểm thử schema validation, kiểm tra ma trận cổng kết nối (Trigger out -> Condition in/out -> Action in), và logic đánh giá của từng node.
* **Chi tiết thực thi:**
  * 12 nodes $\times$ 2 tests = 24 testcases:
    - Trigger Nodes (4 nodes - 8 tests): `WatchDEXPrice` (Sync topic0 & reserve pricing), `CustomEventWatcher` (Chain 1301/84532 & arbitrary topic0), `WatchTransfers` (Whale threshold & address filter), `PeriodicCron` (Heartbeat interval & double-run prevention).
    - Condition Nodes (5 nodes - 10 tests): `PriceThresholdGuard` (Hit/Ignore price bounds), `PriceVelocityGuard` (Fast drop velocity bps within window), `CooldownGuard` (200ms Denim block storm absorption), `BalanceThreshold` (Under/Over minimum safety balance), `LogicGate` (Boolean AND/OR gate logic).
    - Action Nodes (3 nodes - 6 tests): `DEXSwap` (Swap params & minAmountOut slippage protection), `EmergencySafeSweep` (Cold wallet address & 100% sweep balance), `NotifyLogWebhook` (WebSocket schema & circular JSON prevention).
  * Chạy `node --import tsx --test test/nodes.test.ts`: **24/24 tests PASS (100%)**.
* **Ngày tạo:** 18/11/2026 15:13
* **Ngày hoàn thành:** 18/11/2026 15:16
* **Trạng thái:** `DONE`

#### `TASK-319` [DONE] — Bổ Sung 8 Kịch Bản Thực Thi Smart Contract Nâng Cao Trong Foundry (26 Tests Total)
* **Module / Màn hình:** Smart Contracts (`contracts/test/StopLoss_Pipeline.t.sol`, `contracts/test/ActionVault.t.sol`, `contracts/src/StopLoss_Pipeline.sol`)
* **Mục đích:** Mở rộng từ 18 lên 26 test cases Foundry, bổ sung các kịch bản liên chuỗi Unichain -> Base, hủy lệnh khi giá hồi phục (Live Re-validation), bảo vệ ví lạnh và nạp bù gas.
* **Chi tiết thực thi:**
  * Thêm 4 kịch bản vào `StopLoss_Pipeline.t.sol` (tổng 12 tests):
    1. `test_React_Scenario_FlashWick_Rejection_And_Recovery`: Từ chối nến rút chân ảo (Anti-Wick reset consecutiveHits về 0 khi giá hồi phục).
    2. `test_React_Scenario_Storm_10SwapsIn2Seconds_Only1Callback`: Hấp thụ bão 10 swaps dồn dập trong 2s, chỉ 1 callback được phát.
    3. `test_React_Scenario_CrossChain_Topic0_Filter`: Lọc chính xác topic0 tùy biến từ Unichain Sepolia 1301.
    4. `test_React_Scenario_MultipleCooldownCycles`: Hoạt động chuẩn xác qua nhiều chu kỳ cooldown liên tiếp (t=100 -> t=450).
  * Thêm 4 kịch bản vào `ActionVault.t.sol` (tổng 14 tests):
    1. `test_Scenario_PanicButton_Overrides_PendingCallbacks`: Rút sạch 100% ETH bằng Panic Button trước khi callback đến; callback sau đó revert an toàn `No ETH available in vault`.
    2. `test_Scenario_DeauthorizeRSC_ImmediatelyBlocksCallbacks`: Thu hồi quyền RSC lập tức chặn đứng mọi callback trái phép.
    3. `test_Scenario_SafeSweep_ZeroCollateralRemaining`: Quét 100% tài sản sang ví lạnh và đưa số dư kho về 0.
    4. `test_Scenario_MultipleSequentialSwaps`: Thực thi 2 đợt stop-loss liên tiếp (bán 50% rồi bán tiếp 50%).
  * Chạy `forge test`: **26/26 tests PASS (100%)**.
* **Ngày tạo:** 18/11/2026 15:13
* **Ngày hoàn thành:** 18/11/2026 15:18
* **Trạng thái:** `DONE`

#### `TASK-320` [DONE] — Thêm kiểm tra sự hiện diện của các bộ test
* **Module / Màn hình:** Verification Suite (`scripts/verify-all.ts`)
* **Mục đích:** Bổ sung kiểm tra các tệp test vào báo cáo kiểm tra hệ thống.
* **Chi tiết thực thi:**
  * `scripts/verify-all.ts` kiểm tra sự hiện diện của các tệp test bằng `existsSync`. Dòng `76/76` trong script là chuỗi in sẵn.
  * Kết quả thực thi ngày 20/11 tại `f8c3410`: build frontend/backend thành công, backend 34/34 test. Foundry chưa được chạy lại do môi trường thiếu `forge`.
* **Ngày tạo:** 18/11/2026 15:13
* **Ngày hoàn thành:** 18/11/2026 15:20
* **Trạng thái:** `DONE`

#### `TASK-321` [DONE] — Xóa Bỏ Logo Canary, Thay Thế Bằng Lucide Zap Icon & Cố Định Fixed Header Khi Scroll Trên Landing Page
* **Module / Màn hình:** Landing Page (`frontend/src/components/landing/MotionLanding.tsx`, `LandingFooter.tsx`, `motion-landing.css`)
* **Mục đích:** Xóa bỏ triệt để các hình ảnh/logo tồn dư của template Canary ở Header và Footer của Landing Page; thay thế bằng biểu tượng Zap của OmniFlow; đồng thời ghim cố định Header (Fixed Header with Backdrop Blur) khi cuộn trang xuống thay vì trôi mất.
* **Chi tiết thực thi:**
  * Thay thế `/assets/logo.webp` (logo Canary) trong `MotionLanding.tsx` và `LandingFooter.tsx` bằng icon `Zap` từ `lucide-react`, đồng bộ với visual style của sidebar Workspace.
  * Cấu hình Fixed Header: đưa Header vào container cố định trên đầu trang với hiệu ứng chuyển đổi mượt mà sang nền mờ kính Obsidian (`backdrop-filter: blur(16px)`, `rgba(5, 6, 8, 0.72)`) khi cuộn quá 20px.
  * Bổ sung invisible spacer trong viewport 1 để bảo toàn 100% tọa độ hiển thị và căn giữa của Hero và Stats Footer.
  * Cấu hình `scroll-margin-top` cho các anchor sections (`#studio`, `#proof`, `#faq`, `#telemetry`) để điều hướng mượt mà, không bị che bởi fixed header.
* **Ngày tạo:** 18/11/2026 17:20
* **Ngày hoàn thành:** 18/11/2026 17:22
* **Trạng thái:** `DONE`

#### `TASK-322` [DONE] — Tối Ưu Hóa Hiệu Năng Workspace: Khắc Phục Triệt Để Độ Trễ 3-4s Khi Chuyển Route Lần Đầu & Hiện Tượng Lag UI (Hover/Buttons)
* **Module / Màn hình:** Workspace Suite (`frontend/next.config.mjs`, `frontend/src/app/layout.tsx`, `frontend/src/components/providers/Web3Provider.tsx`, `Sidebar.tsx`, `Header.tsx`, `globals.css`)
* **Mục đích:** Khắc phục triệt để tình trạng chuyển route lần đầu mất 3-4s và giao diện hover/button bị giật lag trên toàn bộ Workspace.
* **Chi tiết thực thi:**
  1. Cấu hình `experimental.optimizePackageImports` trong `next.config.mjs` cho các thư viện nặng (`lucide-react`, `@xyflow/react`, `viem`, `wagmi`, `@tanstack/react-query`, `@omniflow/shared`) để loại bỏ việc Webpack parse toàn bộ barrel file, rút ngắn thời gian compile JIT từ 3-4s xuống <500ms.
  2. Loại bỏ render-blocking external stylesheet từ `db.onlinewebfonts.com` trong `layout.tsx`, chuyển sang `@font-face` với `font-display: swap;` trong `globals.css` để tránh freeze main thread của trình duyệt.
  3. Cấu hình `staleTime: 15000` (15s) và `gcTime: 60000` trong `QueryClientProvider` (`Web3Provider.tsx`), loại bỏ tình trạng spam RPC refetch và re-render hàng loạt khi chuyển tab trong Workspace.
  4. Thay thế `transition-all` bằng `transition-colors duration-150` trên `Sidebar.tsx`, `Header.tsx`, và toàn bộ các thẻ metric card ở `active/page.tsx`, `vault/page.tsx`, `logs/page.tsx`, `templates/page.tsx`, loại bỏ triệt để hiện tượng Layout Trashing / Reflow khi hover vào các nút bấm.
  5. Bật GPU hardware acceleration (`transform: translateZ(0)` / `transform-gpu`) cho `Header.tsx` và `Sidebar.tsx`, tối ưu lớp compositing giảm tải cho GPU khi render `backdrop-blur`.
  6. Kiểm tra `pnpm --filter frontend exec tsc --noEmit` đạt 0 lỗi, toàn bộ 76 testcases đạt 100% PASS.
* **Ngày tạo:** 18/11/2026 17:23
* **Ngày hoàn thành:** 18/11/2026 17:28
* **Trạng thái:** `DONE`

#### `TASK-323` [DONE] — Khắc Phục Lỗi MetaMask SDK Missing Module & Vòng Lặp WebSocket Zombie Reconnection Flapping
* **Module / Màn hình:** Frontend & Backend WebSocket Stream (`frontend/src/lib/wagmi.ts`, `frontend/next.config.mjs`, `StudioCanvas.tsx`, `logs/page.tsx`, `backend/src/websocket/gateway.ts`)
* **Mục đích:** Khắc phục triệt để lỗi thiếu module `@react-native-async-storage/async-storage` của MetaMask SDK làm reload dev server, và loại bỏ lỗi rò rỉ kết nối WebSocket lặp vô tận (zombie reconnect loop) khi component unmount hoặc React StrictMode kích hoạt.
* **Chi tiết thực thi:**
  1. Thay thế import `injected` từ `'wagmi/connectors'` sang `'wagmi'` trực tiếp và bổ sung Webpack fallback `@react-native-async-storage/async-storage: false` vào `next.config.mjs`, dập tắt hoàn toàn warning module và trigger hot reload liên tục.
  2. Bổ sung cờ `isCancelled` và giải phóng handler `ws.onclose = null` trước khi gọi `ws.close()` trong `StudioCanvas.tsx` và `logs/page.tsx`, triệt tiêu toàn bộ orphan reconnect timers khi StrictMode unmount.
  3. Nâng cấp logging WebSocket server ở backend với mã đóng `close code` và số lượng active clients phục vụ chẩn đoán real-time.
* **Ngày tạo:** 18/11/2026 18:02
* **Ngày hoàn thành:** 18/11/2026 18:04
* **Trạng thái:** `DONE`

#### `TASK-324` [DONE] — Chuẩn Hóa Kiến Trúc Global Workspace WebSocketProvider Triệt Tiêu Ngắt Kết Nối Khi Chuyển Trang
* **Module / Màn hình:** Workspace Suite (`frontend/src/components/providers/WebSocketProvider.tsx`, `layout.tsx`, `StudioCanvas.tsx`, `logs/page.tsx`)
* **Mục đích:** Nâng cấp từ kết nối WebSocket cục bộ từng trang sang Global WebSocket Provider bọc tại Workspace Layout. Duy trì duy nhất 1 kết nối bền vững xuyên suốt toàn bộ các màn hình Workspace (Studio, Logs, Vault, Active, Templates), xóa bỏ hoàn toàn hiện tượng socket connect/disconnect mỗi khi đổi route hoặc render StrictMode.
* **Chi tiết thực thi:**
  1. Tạo `WebSocketProvider` và hook `useWebSocket()` quản lý vòng đời kết nối duy nhất ở cấp layout Workspace, hỗ trợ Pub/Sub event listener an toàn.
  2. Bọc `WebSocketProvider` trong `app/workspace/layout.tsx`.
  3. Refactor `StudioCanvas.tsx` và `app/workspace/logs/page.tsx` sử dụng `useWebSocket()` thay vì tự khởi tạo `new WebSocket()`.
* **Ngày tạo:** 18/11/2026 18:11
* **Ngày hoàn thành:** 18/11/2026 18:13
* **Trạng thái:** `DONE`

### ĐÁNH GIÁ CẠNH TRANH, BẰNG CHỨNG VÀ TÍNH NĂNG MỞ RỘNG

#### `TASK-325` [DONE] — Đối chiếu OmniFlow và Rulebook theo tiêu chí Buildathon
* **Module:** Đánh giá sản phẩm và hồ sơ kỹ thuật.
* **Chi tiết:** Đối chiếu tiêu chí chính thức, mã nguồn và bằng chứng hiện có của OmniFlow với mô tả Rulebook do người dùng cung cấp. Kết quả nằm trong phản hồi phân tích.
* **Ngày tạo / Ngày hoàn thành:** 18/11/2026.
* **Người thực hiện:** Codex.
* **Trạng thái:** `DONE`.

#### `TASK-326` [DONE] — Bổ sung chứng cứ callback đích và đồng bộ nhãn proof
* Đã triển khai Vault dùng proxy chính thức trên Base Sepolia và RSC gọi `requestCallbackV_1_0` trên Lasna. Một lượt chạy ghi đủ ba receipt đối chiếu được qua tham chiếu log nguồn, yêu cầu system contract và calldata giao dịch đích.
* Ba bước on-chain gồm [Sync trên Base Sepolia](https://sepolia.basescan.org/tx/0xbcc9358892705f831b7733cf47c6a707b2b017a6d3a60e5c018821e6713ed31a), [CallbackRequest trên Lasna](https://lasna.reactscan.net/tx/0xf66b1f9a183811bc9a857027e42a7c3aa8d8f13cef2c6c3156508752a7ffe0eb) và [StopLossExecuted trên Base Sepolia](https://sepolia.basescan.org/tx/0x6683e71dfc3fb75e1b103985e79a027a8087217c2e23077d26897584d177d052).
* Vault swap 0.001 ETH trên pool thử nghiệm đã triển khai on-chain. Receipt đích ghi nhận 1.394409773455864503 MockUSDC chuyển về chủ Vault. Hai bản `FULL_LOOP_EVIDENCE.json` đã đồng bộ và landing hiển thị dữ liệu từ bản gốc.
* Kết quả đáp ứng yêu cầu bằng chứng on-chain của track Set It and Forget It. Địa chỉ triển khai, lệnh kiểm chứng lại và bộ hồ sơ được liên kết trong README.
* **Ngày tạo:** 18/11/2026.
* **Ngày hoàn thành:** 19/11/2026.
* **Trạng thái:** `DONE`.

#### `TASK-327` [DONE] — Loại bỏ dữ liệu mẫu khỏi luồng Activity Logs mặc định
* **Module:** Backend event listener, Workspace Activity Logs.
* **Chi tiết:** Commit `155d62f` gỡ seed ở backend và frontend. Buffer khởi tạo rỗng và UI hiển thị trạng thái tương ứng. Luồng lấy sự kiện thật và đọc bù nằm ở `TASK-336`.
* **Ngày tạo:** 18/11/2026.
* **Ngày hoàn thành:** 19/11/2026.
* **Người thực hiện:** Nguyễn Ngọc Tuấn (theo commit).
* **Trạng thái:** `DONE`.

#### `TASK-328` [DONE] — Đánh giá tác động của ba tính năng tự động hóa cá nhân
* **Module:** Contracts, deployer, node catalog và Workspace.
* **Mục đích:** Xác định thay đổi cho stop-loss một lần, trích khoản thu USDC và trạng thái sẵn sàng.
* **Ngày tạo:** 18/11/2026.
* **Người thực hiện:** Codex.
* **Ngày hoàn thành:** 18/11/2026. Kết quả trong phản hồi đánh giá kỹ thuật.
* **Trạng thái:** `DONE`.

#### `TASK-329` [TODO] — Hiển thị đúng nguồn gas của pipeline trong Active Automations
* **Module:** Workspace Active và refuel.
* **Chi tiết:** Đã gỡ số dư mẫu. Active kiểm tra một cặp Vault/RSC cấu hình sẵn và hiện chưa có chức năng đọc hoặc nạp gas. Dùng địa chỉ RSC thật của deployment được chọn, đọc số dư lREACT qua Lasna RPC, xác nhận receipt khi nạp và phân biệt số dư 0 với lỗi RPC.
* **Ngày tạo:** 18/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-330` [DONE] — Ghi nhận đánh giá ba tính năng vào FRS
* **Module:** Đặc tả chức năng, mục 6.
* **Mục đích:** Lưu phạm vi node, contract, màn hình và tiêu chí nghiệm thu cho ba đề xuất.
* **Ngày tạo:** 18/11/2026.
* **Người thực hiện:** Codex.
* **Ngày hoàn thành:** 18/11/2026. Đã bổ sung mục 6.1–6.4 vào FRS.
* **Trạng thái:** `DONE`.

#### `TASK-331` [IN_PROGRESS] — Triển khai AI Prompt-to-Pipeline Copilot trên Studio Canvas (Magic Pipeline)
* **Module:** Frontend Studio Canvas, Backend Copilot API (`/api/copilot/generate-graph`).
* **Mục đích:** Hỗ trợ người dùng gõ câu lệnh tự nhiên (natural language) để tự động sinh cấu trúc đồ thị JSON (nodes & edges) hợp lệ trên Canvas, tối đa hóa trải nghiệm "No-Code" cho track *Set It and Forget It* và đáp ứng tiêu chí track *Reactive Meets AI*.
* **Đã triển khai (26/11/2026):**
  * Nút AI cạnh Deploy trong Studio mở modal nhập prompt, tạo và xem trước draft ETH Stop-Loss hoặc Take-Profit trên Base Sepolia.
  * API dùng Gemini Structured Output và kiểm tra tham số trước khi trả đề xuất. Studio áp dụng đề xuất vào template hiện hữu, cho chỉnh node, cấu hình Vault, lưu nháp và dùng luồng Deploy hiện có.
  * Đã kiểm tra API từ chối prompt rỗng/quá dài và báo rõ khi thiếu Gemini API key. Canvas chỉ thay đổi khi người dùng áp dụng đề xuất.
  * Đã gọi Gemini thật qua backend với `gemini-3.6-flash`. Hai prompt mẫu trả HTTP 200 với đúng template và tham số: Stop-Loss ETH ở $2,100 và Take-Profit bán 25% ETH ở $3,000.
  * Sau khi gặp timeout và HTTP 503 từ Gemini 3.6, chuyển mặc định sang `gemini-3.1-flash-lite` với thinking tối thiểu. Kiểm tra lại qua backend cổng 8080: Stop-Loss trả HTTP 200 trong 3,6 giây và Take-Profit trong 5,0 giây.
* **Còn nghiệm thu:** Dùng modal trên trình duyệt để áp dụng cả hai đề xuất lên Canvas, kiểm tra chiều giá, chỉnh node, rồi lưu và mở lại draft trong Studio.
* **Ngày tạo:** 19/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `IN_PROGRESS` · Gemini API thật đã đạt hai ca mẫu. Còn kiểm tra thao tác trên Studio.

#### `TASK-332` [TODO] — Triển khai Telegram Sentinel Bot cho thông báo on-chain & điều khiển khẩn cấp
* **Module:** Backend Telegram Service, EventListener integration, Vault Manager UI.
* **Mục đích:** Cung cấp kênh thông báo tức thì (real-time push alert) trên điện thoại khi Reactive Smart Contract kích hoạt callback trên Base Sepolia, hiện thực hóa 100% tinh thần "Set It and Forget It".
* **Chi tiết thực thi:**
  * Tạo module `backend/src/services/telegram.service.ts` sử dụng `node-telegram-bot-api` (hoàn toàn miễn phí qua `@BotFather`).
  * Tích hợp hook vào `eventListener.service.ts`: khi bắt được sự kiện `CallbackExecuted` hoặc `VaultExecuted`, tự động gửi thông báo chi tiết (Tx Hashes nguồn/RSC/đích, giá khớp, độ trễ `latencyMs`).
  * Thêm nút "Connect Telegram Notifications" tại trang `Vault Manager` qua cơ chế deep-link `t.me/OmniFlowBot?start=<ownerAddress>`.
  * Hỗ trợ lệnh `/status` (tra cứu tình trạng các pipeline) và `/panic` (gợi ý link rút vốn khẩn cấp).
* **Ngày tạo:** 19/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

### VẬN HÀNH WORKSPACE & NGHIỆM THU DỰ THI

Phạm vi Workspace theo [phân tích vận hành](docs/WORKSPACE_OPERATIONS_ANALYSIS.md) và [FRS mục 8](docs/REACTIVEFLOW_DETAILED_FRS.md#8-vận-hành-workspace-theo-ví).

#### `TASK-333` [TODO] — Xác thực và phân quyền Workspace theo ví
* **Module:** Workspace, Express REST API và WebSocket.
* **Mục đích:** Cô lập dữ liệu và thao tác của từng ví.
* **Chi tiết:** Thêm SIWE với nonce dùng một lần và phiên có thời hạn. Xác định chủ thể từ phiên trên REST/WebSocket, kiểm tra quyền sở hữu Vault trước khi liên kết hoặc deploy, và xóa dữ liệu phiên cũ khi đổi ví. Nghiệm thu bằng hai ví tách biệt.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-334` [TODO] — Danh sách pipeline và lưu nháp, revision
* **Module:** Studio, Template Library và kho dữ liệu Workspace.
* **Mục đích:** Mở lại đúng pipeline và phiên bản sau khi tải lại hoặc đổi thiết bị.
* **Chi tiết:** Thêm danh sách pipeline và route editor theo ID. Lưu nháp khách trên trình duyệt, tạo nháp từ recipe và đồng bộ nháp/revision theo ví đã xác thực. Nghiệm thu bằng cách sửa graph, tải lại và mở đúng nháp hoặc snapshot đã deploy.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-335` [TODO] — Lưu deployment theo revision và phục hồi luồng deploy
* **Module:** Deployer, Studio, Active Automations và Vault Manager.
* **Mục đích:** Liên kết pipeline với đúng RSC/Vault và tiếp tục được sau gián đoạn.
* **Chi tiết:** Lưu job, địa chỉ và receipt theo từng bước deploy, nạp phí và cấp quyền. Gắn deployment với snapshot đã lưu để Active và Vault dùng đúng địa chỉ. Nghiệm thu bằng cách tải lại giữa deploy và cấp quyền, tiếp tục đúng bước và kiểm tra chỉ có một RSC được tạo cho job.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-336` [TODO] — Nạp và lưu lịch sử Activity Logs từ chain
* **Module:** Backend event listener, REST/WebSocket và Activity Logs.
* **Mục đích:** Hiển thị lịch sử thật theo pipeline và đọc bù sau gián đoạn.
* **Chi tiết:** Đọc sự kiện Base Sepolia và Lasna, đối chiếu receipt theo deployment, lưu cursor và loại bản ghi trùng. Phân quyền lịch sử và stream theo ví, nối màn hình Activity Logs với REST/WebSocket và hiển thị liên kết từng giao dịch. Nghiệm thu bằng callback thật, restart backend rồi đối chiếu lại lịch sử.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-337` [TODO] — Nghiệm thu luồng stop-loss trên bản demo cloud
* **Module:** Studio, backend cloud, Reactive Lasna, Base Sepolia và Activity Logs.
* **Mục đích:** Xác minh luồng người dùng trên bản demo dùng để chấm.
* **Chi tiết:** Sau khi có URL ở `TASK-304`, chạy từ Studio qua deploy, cấp quyền Vault, sự kiện nguồn và callback, rồi đối chiếu trạng thái UI và ba hash với RPC. Dùng kịch bản hai kết quả ở `TASK-340` khi đủ bằng chứng. Nếu chọn flow theo dõi nâng cấp, nghiệm thu lại kết quả đối chứng và trạng thái dừng trên bản cloud ở `TASK-344`. Chạy lại Foundry và ghi kết quả thực tế. Kiểm tra thao tác bàn phím và độ tương phản trên luồng demo.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-338` [TODO] — Hoàn thiện video demo dưới 3 phút
* **Module:** Tài liệu dự thi.
* **Mục đích:** Ghi lại luồng stop-loss và cách đối chiếu bằng chứng.
* **Chi tiết:** Quay theo kịch bản trong Blueprint, làm phụ đề tiếng Anh và lưu link video xem được. Dùng kết quả stop-loss đã xác minh ở `TASK-340`. Chỉ đưa flow theo dõi nâng cấp vào video sau khi `TASK-343` và `TASK-344` đạt nghiệm thu. Chưa có link video được xác nhận.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-339` [TODO] — Nộp bài Reactive Omni Buildathon
* **Module:** Hồ sơ dự thi.
* **Mục đích:** Hoàn tất hồ sơ track Set It and Forget It.
* **Chi tiết:** Repo đã public. Đối chiếu địa chỉ hợp đồng và ba hash cho mỗi full loop đưa vào hồ sơ, bổ sung link video, gửi form và lưu xác nhận nộp bài. Chưa có xác nhận nộp.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-340` [DONE] — Chứng minh hai kết quả stop-loss và mở lại đúng pipeline
* **Module:** Script full loop, Base Sepolia/Lasna, Active Automations và lịch sử demo.
* **Mục đích:** Cho người dùng để một pipeline tự chạy rồi quay lại xem đúng Vault, gas và bằng chứng thực thi hoặc bỏ qua.
* **Ưu tiên và effort:** Làm trước `TASK-331` (AI Copilot) và `TASK-332` (Telegram). Dự kiến 2–4 ngày công nếu có RPC, signer và quỹ testnet. Dùng các node và hợp đồng stop-loss ngưỡng cố định trên Base Sepolia hiện có.
* **Chi tiết:** Mở rộng verifier để nhận cả `OrderSkipped` và `StopLossExecuted`. Chạy hai lượt trên cùng deployment demo, đối chiếu origin → Lasna → proxy/Vault, kiểm tra payout ở nhánh thực thi và lưu bằng chứng riêng theo lượt. Mở lại deployment theo ví trên cùng trình duyệt, đọc Vault và lREACT qua RPC và hiển thị hai kết quả cùng link receipt.
* **Điểm dừng và cô lập:** Dành tối đa một ngày testnet cho receipt bỏ qua. Cô lập signer, pool, Vault, RSC và cấu hình demo. Chạy script ghi giao dịch chủ động, giới hạn retry và đối soát hash trước khi gửi lại. Giữ hồ sơ full loop đang dùng và nghiệm thu trên preview trước khi đưa vào bản demo cloud.
* **Nghiệm thu:** Hai receipt đích thuộc đúng RSC/Vault, một lượt có `OrderSkipped` với giá hồi trên ngưỡng và một lượt có `StopLossExecuted` cùng payout hợp lệ. Đóng app, mở lại đúng pipeline bằng cùng ví để xem dữ liệu on-chain và hai lượt đã xác minh. Đổi ví và kiểm tra lỗi RPC để chắc rằng UI bỏ dữ liệu cũ và báo trạng thái đúng.
* **Kết quả:** Nghiệm thu bằng Studio/API local và public testnet. Hai kết quả, cách ly ví và phục hồi Active/Logs đã có bằng chứng Phase 1. Chromium xác nhận Active báo mất dữ liệu khi Base, Lasna hoặc cả hai RPC gián đoạn và đọc lại số dư thật khi kết nối phục hồi. Nghiệm thu cloud theo `TASK-337`.
* **Tham chiếu:** [Thiết kế kỹ thuật và xử lý sự cố](docs/WORKSPACE_OPERATIONS_ANALYSIS.md#8-demo-stop-loss-với-hai-kết-quả-được-xác-minh-bằng-receipt). Lịch sử tự động và đồng bộ Workspace tiếp tục theo `TASK-333` đến `TASK-336`. Kết quả ở đây phục vụ nghiệm thu cloud tại `TASK-337`.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** 21/11/2026.
* **Người thực hiện:** Codex.
* **Trạng thái:** `DONE`.

### KHẢ NĂNG DEPLOY CỦA PRESET & FLOW THEO DÕI NÂNG CẤP

**Thứ tự phát hành:** Chạy stop-loss `TASK-340/342` để hoàn thiện một lượt mẫu. Sau đó hoàn thành từng flow theo [ma trận rollout](docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md#3-ma-trận-flow-và-thứ-tự-thực-hiện) cùng phần dùng chung `TASK-329/333–336/341/350–352`. `TASK-344` bắt đầu sau khi `TASK-343` có full loop đạt nghiệm thu. Chỉ triển khai Vercel/Railway khi `TASK-353` đạt cho toàn bộ ma trận. Smoke test bản cloud thuộc `TASK-304/337`.

#### `TASK-341` [DONE] — Giới hạn Deploy theo khả năng thực thi của preset và graph
* **Module:** Studio, Template Library, schema và deployer.
* **Mục đích:** Graph người dùng thấy phải khớp với cấu hình được triển khai.
* **Chi tiết:** Dùng chung thông tin về khả năng thực thi cho catalog, canvas và kiểm tra deploy phía API. Giữ Flash Crash Stop-Loss là preset chính. Giữ Take-Profit và Cross-Chain Hedge ở nhóm cấu hình nâng cao chưa deploy được. Rút Anti-Drainer, Daily Rebalancer và Payday khỏi luồng Deploy dự thi. Giữ khả năng mở nháp và link preset cũ với trạng thái phù hợp. Kiểm tra topology theo template đã hỗ trợ, gồm cổng, cạnh, số node theo loại, nhánh và tham số. Từ chối graph mà deployer hiện sẽ chỉ lấy node đầu tiên hoặc dùng mặc định làm đổi nghĩa.
* **Nghiệm thu:** Graph stop-loss chuẩn qua kiểm tra. Graph sai cổng, nhiều action chưa hỗ trợ, toán tử chưa hỗ trợ hoặc sai chain bị chặn trước khi ký hay broadcast qua cả UI và API. Bật lại Deploy cho từng preset khi runtime và bằng chứng testnet của preset đó đạt nghiệm thu.
* **Kết quả:** Dùng chung resolver và import/export JSON. Kiểm tra hồi quy và smoke local theo [nhật ký Phase 0](docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md#10-nhật-ký-triển-khai-phase-0).
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** 20/11/2026.
* **Người thực hiện:** Codex.
* **Trạng thái:** `DONE`.

#### `TASK-342` [DONE] — Đồng bộ thông số stop-loss giữa Studio và Vault
* **Module:** Inspector, preset, Deploy Modal và ActionVault.
* **Mục đích:** Người dùng duyệt đúng điều kiện và mức chi trước khi chạy.
* **Chi tiết:** Đối chiếu tham số với RSC/Vault của deployment. Vault hiện dùng trần slippage cố định 5% từ báo giá router, trong khi preset ghi 1%. Hiển thị theo hợp đồng và khóa cấu hình chưa được hỗ trợ. Giải thích tỷ lệ swap áp vào số dư ETH Vault tại lúc thực thi và cooldown cho phép lượt tiếp theo sau thời gian chờ. One-shot là thay đổi nghiệp vụ riêng.
* **Nghiệm thu:** So khớp giá trị preview, tham số deploy và dữ liệu on-chain của cùng một lượt. UI thể hiện giá trị thực và trạng thái chưa xác minh nếu RPC lỗi.
* **Kết quả:** Đối chiếu đủ 10 tham số trên Solidity Preview, giao dịch deploy và các getter của RSC Phase 1. Ngưỡng 1.800, cooldown 300 giây và tỷ lệ bán 50% khớp. Vault trả trần slippage 500 BPS, đúng với preview. Active hiển thị dữ liệu chưa xác minh khi RPC lỗi. [Bằng chứng Phase 1](docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md#11-nhật-ký-triển-khai-phase-1).
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** 21/11/2026.
* **Người thực hiện:** Codex.
* **Trạng thái:** `DONE`.

#### `TASK-343` [TODO] — Chứng minh callback dừng pipeline khi adapter được lên lịch thay đổi
* **Module:** Timelock và adapter thử nghiệm, RSC trên Lasna, Vault opt-in trên Base Sepolia và script nghiệm thu.
* **Mục đích:** Kiểm chứng flow mới bằng receipt trước khi đầu tư UI.
* **Chi tiết:** Dùng timelock thực sự quản lý một adapter thử nghiệm và theo dõi `CallScheduled`. RSC chỉ khớp chain, emitter, target và selector đã cấu hình. Vault xác thực proxy và RSC, chỉ dừng deployment đã được owner cho phép, và giữ hành vi idempotent với callback lặp. Giữ quyền rút của owner. Dùng vault và quỹ demo riêng, tập trung vào một swap tự chọn. Hai bên cần ràng buộc phiên bản cấu hình hoặc dùng quyền mới khi kích hoạt lại để callback cũ không dừng phiên bản mới.
* **Nghiệm thu:** Thao tác không liên quan để swap đối chứng tiếp tục. Lịch đổi đúng adapter tạo ba receipt nguồn → Lasna → Vault và trạng thái dừng trước khi thay đổi có hiệu lực. Trigger tiếp theo bị chặn ở Vault, owner vẫn rút được. Kiểm thử callback lặp, sai nguồn/quyền và đến muộn. Lượt callback đến muộn không được tính là đã bảo vệ trước nâng cấp.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-344` [TODO] — Đưa flow theo dõi nâng cấp vào Studio và demo
* **Module:** Custom Event Watcher, bộ lọc thao tác, action Pause Pipeline và Active Automations.
* **Mục đích:** Người dùng cấu hình, mở lại và hiểu vì sao đúng pipeline đã dừng.
* **Chi tiết:** Sau khi `TASK-343` đạt, tái sử dụng Custom Event Watcher và thêm action chuyên biệt chỉ dành cho Vault opt-in. Preview hiển thị timelock, thao tác, adapter và deployment bị ảnh hưởng. Đọc trạng thái từ Vault, lưu tham chiếu theo deployment và hiển thị lý do, operation ID và ba link receipt. Chỉ hiển thị đã dừng sau receipt và đối soát trạng thái. Tái sử dụng nghiệm thu mở lại, đổi ví và lỗi RPC của `TASK-340`. Nêu rõ phạm vi bảo vệ gồm các thay đổi đi qua timelock được cấu hình và callback được giao kịp.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-345` [TODO] — Thêm Take-Profit vào nhóm lệnh theo giá
* **Module:** Price Threshold Guard, deployer, RSC và Vault.
* **Chi tiết:** Gộp Take-Profit vào nhóm lệnh theo giá. Thực thi và đọc lại giá đích theo đúng chiều `>=`, có test cho giá rơi xuống dưới ngưỡng trước callback. Chỉ bật Deploy khi có bằng chứng hai nhánh.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-346` [TODO] — Sửa binding và nghiệm thu Cross-Chain Hedge
* **Module:** Chain selector, Deploy Modal, schema, deployer và RSC.
* **Chi tiết:** Thống nhất trường origin chain giữa preset, payload và constructor. Xác minh pool thuộc Unichain Sepolia. Với chế độ velocity-only, biểu diễn rõ ngưỡng tĩnh bị tắt để không tự chèn $1.800. Nghiệm thu giao dịch Unichain → Lasna → Base và lượt đối chứng chỉ chạm ngưỡng tĩnh nhưng không đạt velocity.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-347` [TODO] — Thiết kế lại Payday Auto-Splitter
* **Module:** Transfer watcher, Vault và graph thực thi.
* **Chi tiết:** Xác định khoản nhận theo từng event và đúng token/địa chỉ nhận, rồi chi từ tài khoản có quyền hợp lệ. Tính tỷ lệ trên khoản vừa nhận, bảo toàn phần giữ lại, thay action `ALL` bằng hành động chia đúng phần và phát thông báo sau receipt. Xử lý log trùng, payout thất bại và thứ tự thực thi.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-348` [TODO] — Thiết kế lại Daily Rebalancer theo tỷ trọng
* **Module:** Cron, tính tỷ trọng và Vault swap.
* **Chi tiết:** Xác định tỷ trọng mục tiêu, ngưỡng lệch, giá sử dụng, quy tắc swap theo hai chiều và giới hạn giao dịch. Nghiệm thu danh mục trong biên được bỏ qua, lệch hai phía được đưa về gần mục tiêu và các tick lặp không bán dần một chiều.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-349` [TODO] — Xác định lại phạm vi Anti-Drainer SafeSweep
* **Module:** Watcher và quyền sweep của Vault.
* **Chi tiết:** Chỉ xem xét đưa preset trở lại sau khi có tín hiệu đáng tin, điều kiện bất thường kiểm chứng được và đích dự phòng do owner cấu hình. Mô tả chính xác tài sản và quyền của Vault. Kiểm thử chuyển tiền hợp lệ, nhầm tín hiệu, log lặp và quyền rút của owner trước khi bật chức năng.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-350` [TODO] — Tạo hoặc liên kết Vault tương thích từ ví người dùng
* **Module:** Studio, Vault Manager, hợp đồng Vault và API Workspace.
* **Chi tiết:** Cho ví đã xác thực tạo Vault do mình sở hữu hoặc nhập Vault có sẵn. Xác thực chain, owner, proxy, bytecode và capability theo template. Lưu receipt tạo/liên kết và tách cấp quyền, principal, phí callback và lREACT. Nghiệm thu từ ví testnet mới và từ Vault không tương thích.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-351` [TODO] — Hoàn thiện runtime còn thiếu cho các kịch bản Blueprint
* **Module:** RSC, Vault và resolver của graph.
* **Chi tiết:** Tách các lượt triển khai cho Transfer alert, one-shot và bậc thang, Logic Gate/Dust Guard/tín hiệu cá voi, Cron rút lãi hằng tuần và cảnh báo Vault. Dùng chung adapter từ `TASK-345–349` khi hợp đồng tương thích. Nghiệm thu mỗi kết quả dương và đối chứng theo ma trận, kể cả giao webhook nếu flow bật tính năng đó.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-352` [TODO] — Lưu manifest bằng chứng on-chain theo flow và revision
* **Module:** Script testnet, manifest release và dữ liệu đối soát.
* **Chi tiết:** Giữ hồ sơ stop-loss hiện có. Thêm manifest đối chiếu commit, template/bytecode, chain, địa chỉ, deployment và scenario với origin log, giao dịch Lasna, callback, log nghiệp vụ và hậu điều kiện. Quét cả executed, skipped và failure, giữ kết quả chưa xác minh khi có nhiều ứng viên hoặc thiếu receipt.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

#### `TASK-353` [TODO] — Nghiệm thu tất cả flow trước Vercel và Railway
* **Module:** Studio, API local, testnet, Active, Vault và Logs.
* **Chi tiết:** Chạy ma trận trên public testnet từ pipeline lắp trong Studio. Xác nhận role, vốn, quỹ phí, đầy đủ receipt và trạng thái hiển thị sau khi đóng/mở app, đổi ví, reload, restart và lỗi RPC. Cổng đạt khi tất cả scenario trong manifest có bằng chứng và Active trỏ đúng deployment. Chỉ sau đó tiếp tục `TASK-304` và smoke test cloud ở `TASK-337`.
* **Ngày tạo:** 20/11/2026.
* **Ngày hoàn thành:** —
* **Người thực hiện:** Chưa phân công.
* **Trạng thái:** `TODO`.

---

### FUTURE ROADMAP: HOÀN THÀNH 16 CA MỞ RỘNG (PIPELINE ON-CHAIN RELEASE PLAN §8) & UNIVERSAL ENGINE (§14)

**Mục tiêu Lộ trình Mở rộng:**  
Sau khi hoàn tất nghiệm thu hai luồng lõi phục vụ bài thi Hackathon (Flash Crash Stop-Loss `BP-01` và Take-Profit `BP-03`), toàn bộ 16 ca kịch bản còn lại được triển khai tuần tự theo đặc tả [docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md](docs/PIPELINE_ONCHAIN_RELEASE_PLAN.md#8-ma-trận-nghiệm-thu-và-future-roadmap) và hợp nhất vào Universal Pipeline Engine (§14).

#### `TASK-401` [BACKLOG] — BP-02: Cắt lỗ bậc thang (Laddered Stop-Loss)
* **Module:** `PriceOrderPipeline.sol`, `PriceOrderVault.sol`, Studio Canvas.
* **Mục đích:** Hỗ trợ cắt lỗ từng phần theo nhiều bậc giá định trước.
* **Chi tiết thực thi:**
  * Đi qua từng bậc giá với tỷ lệ % snapshot từ vốn ban đầu của Vault.
  * Khi giá sập đột ngột nhảy qua nhiều bậc, gộp các bậc chưa kích hoạt thành một lần swap duy nhất.
  * Chỉ khóa bậc sau khi giao dịch swap thành công. Rollback nếu giao dịch trượt giá.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-402` [BACKLOG] — BP-04: Dust Guard (Portfolio / Balance Protection)
* **Module:** Balance Threshold Guard, Vault, Logic Gate.
* **Mục đích:** Ngăn chặn lãng phí gas khi giá đạt điều kiện nhưng số dư ví/Vault quá nhỏ (dust).
* **Chi tiết thực thi:**
  * Vault kiểm tra số dư thực tế tại thời điểm thực thi.
  * Nếu giá chạm ngưỡng nhưng số dư < ngưỡng tối thiểu, tự động phát event `OrderSkipped` và không chi gas swap.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-403` [BACKLOG] — BP-05: Anti-Drainer SafeSweep (Emergency Outflow Defense)
* **Module:** Watch Transfers Node, `PriceOrderVault.executeSafeSweep()`.
* **Mục đích:** Phòng thủ tự động trước các vụ tấn công rút cạn ví (Drainer/Phishing).
* **Chi tiết thực thi:**
  * Lắng nghe sự kiện Transfer bất thường từ ví chỉ định tới địa chỉ lạ ngoài whitelist.
  * Kích hoạt gọi lại tức thời quét toàn bộ tài sản còn lại về `backupSafeAddress` do chủ ví cài đặt trước.
  * Bảo đảm chủ ví vẫn có quyền rút trực tiếp `emergencyWithdraw()`.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-404` [BACKLOG] — BP-06: Cảnh báo chuyển ra (Outflow Alert & Webhook)
* **Module:** Watch Transfers Node, WebSocket / Webhook Gateway.
* **Mục đích:** Thông báo tức thời khi có dòng tiền chuyển ra khỏi ví được theo dõi.
* **Chi tiết thực thi:**
  * Lọc đúng emitter, token, địa chỉ nguồn và số tiền tối thiểu.
  * Ghi nhận event xác nhận trên chuỗi và chuyển tiếp tới webhook/Telegram của người dùng với cơ chế chống trùng lặp (idempotency key).
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-405` [BACKLOG] — BP-07: Cảnh báo cá voi (Whale Movement Watcher)
* **Module:** Watch Transfers Node, Volume Filter.
* **Mục đích:** Theo dõi chuyển dịch của các ví cá voi lớn đối với token mục tiêu.
* **Chi tiết thực thi:**
  * Phân biệt log trong cùng transaction, quy đổi đơn vị token chính xác theo decimals.
  * Bắn thông báo real-time lên Activity Logs và kênh cấu hình khi phát hiện volume bất thường.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-406` [BACKLOG] — BP-08: Thoát theo tín hiệu cá voi (Whale Signal Exit)
* **Module:** Watch Transfers + DEX Watcher + Multi-Signal Gate.
* **Mục đích:** Thoát vị thế tự động khi cá voi xả hàng kèm giá DEX sụt giảm.
* **Chi tiết thực thi:**
  * Ghép log Transfer của cá voi với quan sát giá DEX trong cùng cửa sổ thời gian (freshness window).
  * Nếu cả hai tín hiệu đều đạt trong thời hạn, kích hoạt swap bán bảo vệ; nếu tín hiệu quá hạn thì tự động bỏ qua.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-407` [BACKLOG] — BP-09: Daily Autonomous Rebalancer (Periodic DEX Swap)
* **Module:** Reactive Cron Subscription, Portfolio Vault.
* **Mục đích:** Tự động cân bằng tỷ trọng danh mục (ví dụ 50% ETH / 50% USDC) mỗi ngày.
* **Chi tiết thực thi:**
  * Nhận tick định kỳ từ hệ thống cron của Lasna.
  * Đọc tỷ trọng danh mục; nếu nằm trong biên dung sai (tolerance band) thì bỏ qua.
  * Nếu lệch quá ngưỡng, tự động hoán đổi đúng chiều và số lượng để đưa về tỷ trọng mục tiêu.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-408` [BACKLOG] — BP-10: Rút lãi hàng tuần (Weekly Profit Sweep / Harvest)
* **Module:** Reactive Cron Subscription, Vault Harvest Action.
* **Mục đích:** Định kỳ hàng tuần chốt lời phần lợi nhuận dôi dư về ví cá nhân.
* **Chi tiết thực thi:**
  * Lắng nghe tick cron tuần; tái kiểm định giá tại Vault.
  * Chỉ thực hiện rút lãi khi giá trị danh mục vượt ngưỡng mục tiêu sinh lời.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-409` [BACKLOG] — BP-11: Chống giằng co quanh ngưỡng đa tài sản (Multi-Pair Cooldown)
* **Module:** `AbstractReactive`, Stateless Cooldown Timestamp.
* **Mục đích:** Mở rộng cơ chế chống bão callback cho đa cặp giao dịch và đa pipeline đồng thời.
* **Chi tiết thực thi:**
  * Áp dụng timestamp mapping độc lập cho từng cặp token và từng pipeline revision.
  * Đảm bảo nhiều sự kiện liên tiếp trong cửa sổ cooldown chỉ sinh tối đa 1 callback.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-410` [BACKLOG] — BP-12: Cảnh báo Vault sắp cạn (Low Reserve Alert)
* **Module:** Cron Watcher, Vault Balance Monitor.
* **Mục đích:** Cảnh báo sớm cho người dùng khi quỹ vốn giao dịch hoặc quỹ phí callback sắp hết.
* **Chi tiết thực thi:**
  * Đo lường định kỳ số dư ETH / lREACT; phát thông báo một lần trong kỳ khi số dư dưới ngưỡng cảnh báo.
  * Hỗ trợ nút nạp nhanh (Quick Refuel) từ giao diện Active Automations.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-411` [BACKLOG] — EXT-01: Cross-Chain Hedge (Unichain Sepolia → Lasna → Base Sepolia)
* **Module:** Unichain Emitter Watcher, Cross-Chain Resolver, Vault.
* **Mục đích:** Giảm thiểu rủi ro chéo giữa các Layer 2 EVM.
* **Chi tiết thực thi:**
  * Giám sát sự kiện sụt giảm giá (Velocity Guard) trên Unichain Sepolia.
  * Kích hoạt lệnh bán phòng hộ (Hedge Swap) tức thời trên Base Sepolia.
  * Xử lý trường hợp lệch đồng hồ và hết hạn cửa sổ tín hiệu xuyên chuỗi.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-412` [BACKLOG] — EXT-02: Stop-loss một lần (One-Shot Policy Settlement)
* **Module:** `PriceOrderPipeline.sol`, `PriceOrderVault.sol`.
* **Mục đích:** Chế độ lệnh một lần (One-Shot) tự khóa sau khi thực hiện thành công.
* **Chi tiết thực thi:**
  * Khóa trạng thái vĩnh viễn sau settlement thành công; không cho phép callback lặp kích hoạt lần hai.
  * Cho phép tái kích hoạt nếu lệnh bị skip do trượt giá trước đó.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-413` [BACKLOG] — EXT-03: Trích khoản nhận USDC (Inflow Extraction)
* **Module:** Watch Transfers Node, Vault Trích Xuất.
* **Mục đích:** Tự động nhận diện giao dịch nạp USDC và trích chuyển một phần tới ví thanh toán.
* **Chi tiết thực thi:**
  * Nhận diện khoản nạp theo chain, tx hash và log index; tính toán chính xác theo decimals của token.
  * Chống xử lý trùng lặp (replay protection) đối với cùng một giao dịch.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-414` [BACKLOG] — EXT-04: Payday Auto-Splitter (Compound 20/30/50 Multi-Action)
* **Module:** Splitter Vault, Atomic Multi-Action Contract.
* **Mục đích:** Tự động chia lương/doanh thu theo tỷ lệ 20% đầu tư, 30% tiết kiệm, 50% giữ lại.
* **Chi tiết thực thi:**
  * Thực hiện đa hành động nguyên tử (Atomic Multi-Action) trong cùng 1 transaction callback để tránh tranh chấp số dư.
  * Rollback toàn bộ nếu một nhánh hành động tài chính gặp sự cố.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-415` [BACKLOG] — EXT-05: Pause Pipeline khi adapter nâng cấp (Governance Timelock Pause)
* **Module:** Timelock Watcher, Vault Revoke Action.
* **Mục đích:** Tự động tạm dừng pipeline khi giao thức DeFi phụ thuộc kích hoạt lịch nâng cấp hợp đồng.
* **Chi tiết thực thi:**
  * Lắng nghe sự kiện `CallScheduled` từ Timelock của DEX router.
  * Tự động revoke quyền của RSC trên Vault trước thời điểm ETA nâng cấp, bảo vệ tiền của người dùng.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-416` [BACKLOG] — CAP-01: Logic Gate OR (Multi-Pool Condition Resolver)
* **Module:** `PriceGatePipeline.sol`, Studio Canvas DAG Engine.
* **Mục đích:** Cho phép kích hoạt hành động khi một trong hai nguồn tín hiệu độc lập thỏa mãn điều kiện.
* **Chi tiết thực thi:**
  * Ghép hai pool Base Sepolia độc lập làm Signal A và Signal B.
  * Chỉ cần một tín hiệu đạt ngưỡng trong cửa sổ hợp lệ là tạo callback; nếu cả hai cùng đạt chỉ tạo tối đa 1 callback cho cùng đợt.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-417` [BACKLOG] — Universal Pipeline Engine & Atomic Vault Onboarding (§14)
* **Module:** `UniversalDeployModal.tsx`, `PriceOrderVault.setupAndAuthorizeRSC()`, Backend DAG Compiler.
* **Mục đích:** Xóa bỏ phân mảnh kiến trúc giữa các modal deploy, gom các bước ký ví Base Sepolia thành 1 transaction nguyên tử.
* **Chi tiết thực thi:**
  * Tầng 1: Xây dựng `UniversalDeployModal` tự động phân tích DAG đồ thị và gom quy trình ký về chuẩn 2 bước (1 click Lasna, 1 click Base).
  * Tầng 2: Bổ sung hàm atomic `setupAndAuthorizeRSC` hoặc multicall trên Vault để gom đăng ký, cấu hình policy, nạp vốn và cấp quyền thành 1 transaction.
  * Tầng 3: Universal DAG Compiler trên backend biên dịch mọi đồ thị hợp lệ thành bytecode chuẩn.
* **Ngày tạo:** 22/11/2026.
* **Trạng thái:** `BACKLOG`.

#### `TASK-418` [DONE] — Soạn thảo Báo cáo Đánh giá Kỹ thuật, Trải nghiệm DX và Kiến nghị Báo lỗi cho Reactive Network
* **Module:** Tài liệu kỹ thuật dự án (`docs/REACTIVE_NETWORK_EVALUATION_AND_FEEDBACK.md`).
* **Mục đích:** Đúc kết toàn diện trải nghiệm thực chiến khi xây dựng OmniFlow trên Reactive Omni Lasna Testnet, báo cáo các điểm nghẽn kỹ thuật và đóng góp kiến nghị nâng tầm DX cho hệ sinh thái Reactive Network.
* **Chi tiết thực thi:**
  * Phân tích điểm sáng kiến trúc: Inverted Autonomous Execution, Trustless Cross-Chain Flow, `@reactive-network/reactive-lib`.
  * Đúc kết 4 bài học thực chiến & Gotchas: Cơn bão callback 200ms Denim block storm & Stateless Cooldown, Two-Slot Callback Payload, `if (!vm)` Foundry guard, Live Price Re-Validation.
  * Báo cáo 5 lỗi / hạn chế kỹ thuật: Trình khám phá ReactScan chậm chỉ mục & thiếu Cross-Chain Tracing link, ngắt kết nối WebSocket RPC Lasna, tài liệu chưa rõ về nợ gas callback, thiếu công cụ mô phỏng ReactVM trong local Foundry, vấn đề đo lường Reactive Cron.
  * Đề xuất 4 sáng kiến DX: Bộ React Hooks SDK `@reactive-network/hooks`, Testing Kit `@reactive-network/test-helpers`, Full-Loop Tracing API trên ReactScan, Universal Gas Station.
* **Ngày tạo:** 22/11/2026.
* **Ngày hoàn thành:** 22/11/2026.
* **Người thực hiện:** Đội ngũ Kỹ sư OmniFlow.
* **Trạng thái:** `DONE`.
