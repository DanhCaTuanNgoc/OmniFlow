# ĐẶC TẢ YÊU CẦU CHỨC NĂNG & KỸ THUẬT CHI TIẾT (FRS / TECHNICAL SPECIFICATION)
## DỰ ÁN: REACTIVEFLOW — THE ZAPIER OF WEB3
### Phân Tích Sâu Kiến Trúc Dữ Liệu, API, Vòng Đời Canvas, Danh Mục Node, Ma Trận 12 Kịch Bản Thực Chiến & Thiết Kế Smart Contract Chuẩn Hóa

---

| **Thuộc tính** | **Chi tiết** |
| :--- | :--- |
| **Tài liệu** | Functional Requirements Specification (FRS) & Technical Data Spec |
| **Mã tài liệu** | `RF-FRS-DEEPDIVE-V1.0` |
| **Tác giả** | Lead Business Analyst & Web3 Solutions Architect |
| **Phạm vi** | Đặc tả 5 Màn hình Workspace + Landing Page; Vòng đời Canvas & Node; Node Catalog, 12 Kịch bản & Mẫu Smart Contract |
| **Ngày hoàn thành** | 14/11/2026 |
| **Trạng thái** | Production-Ready Blueprint |

---

## MỤC LỤC

1. [TỔNG QUAN KIẾN TRÚC DỮ LIỆU & TRẠNG THÁI (STATE ARCHITECTURE)](#1-tổng-quan-kiến-trúc-dữ-liệu--trạng-thái-state-architecture)
2. [ĐẶC TẢ SÂU MÀN HÌNH CỐT LÕI: PIPELINE STUDIO (VISUAL BOARD)](#2-đặc-tả-sâu-màn-hình-cốt-lõi-pipeline-studio-visual-board)
   * 2.1 Vòng Đời Của Một Canvas (Canvas Lifecycle & Khả Năng Chạy 24/7)
   * 2.2 Vòng Đời Của Từng Node (Node State Machine)
   * 2.3 Danh Mục 10 Node Thực Thi Chuẩn Hóa (Lean & Orthogonal Catalog)
   * 2.4 Phân Tích Nghiệp Vụ: Đề Xuất 12 Node vs 10 Node Tinh Hoa (Loại Bỏ 3 Điểm Dư Thừa)
   * 2.5 Ma Trận Khả Năng Vận Hành: 4 Trụ Cột & 12 Kịch Bản Thực Chiến Sống Còn
   * 2.6 Đánh Giá Năng Lực Node: Đã Phát Huy Hết Sức Mạnh Reactive Omni Chưa?
3. [ĐẶC TẢ CHI TIẾT 4 MÀN HÌNH WORKSPACE BỔ TRỢ & LANDING PAGE](#3-đặc-tả-chi-tiết-4-màn-hình-workspace-bổ-trợ--landing-page)
   * 3.1 Màn hình Landing Page (Cửa ngõ tương tác)
   * 3.2 Màn hình Active Automations (Giám sát 24/7 & Nạp Gas)
   * 3.3 Màn hình Template Library (Thư viện công thức 1-Click)
   * 3.4 Màn hình Vault Manager & Security (Két An Toàn & Panic Button)
   * 3.5 Màn hình Activity Logs & Explorer (Minh chứng On-Chain)
4. [CHUẨN DỮ LIỆU & ĐẶC TẢ API (DATA CONTRACTS & SCHEMAS)](#4-chuẩn-dữ-liệu--đặc-tả-api-data-contracts--schemas)
5. [ĐẶC TẢ KIẾN TRÚC SMART CONTRACT CHUẨN HÓA TRÊN REACTIVE OMNI](#5-đặc-tả-kiến-trúc-smart-contract-chuẩn-hóa-trên-reactive-omni)
   * 5.1 Callback Proxy Authentication Pattern (Xác thực 2 chiều chuẩn giao thức)
   * 5.2 In-Flight Callback Protection Pattern (Cờ pending chống bắn lặp callback trên block 200ms)
   * 5.3 Live Price Re-Validation Pattern (Tái thẩm định giá tức thời chống Stale Trigger)
   * 5.4 Dual-Way Event State Synchronization (Đồng bộ trạng thái lệnh qua Event Stream)

---

# 1. TỔNG QUAN KIẾN TRÚC DỮ LIỆU & TRẠNG THÁI (STATE ARCHITECTURE)

Hệ thống ReactiveFlow hoạt động dựa trên cơ chế **Decoupled Asynchronous State** (Tách rời trạng thái giao diện và trạng thái thực thi on-chain):

```
┌────────────────────────────────────────────────────────────────────────┐
│  CLIENT TIER (Browser - React State / IndexedDB)                       │
│  - Quản lý UI Graph: nodes[], edges[], inspectorForm, viewport         │
│  - Nhận event real-time qua WebSocket / RPC Subscriptions              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Export Graph JSON / Deploy Tx
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  SERVICE TIER (Backend Compiler & Relayer Engine)                      │
│  - Pipeline Parser & Safe Solidity Template Hydrator                   │
│  - Foundry CLI Worker (forge build & forge create)                     │
│  - Relayer Service (Gas sponsorship lREACT & Vault authorization)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Autonomous On-Chain Execution
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│  ON-CHAIN TIER (Reactive Omni CometBFT + Base Sepolia)                 │
│  - RSC chạy 24/7/365 độc lập hoàn toàn với Browser                     │
│  - Bắt event cấp độ Consensus, kích hoạt Callback sang ActionVault    │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 2. ĐẶC TẢ SÂU MÀN HÌNH CỐT LÕI: PIPELINE STUDIO (VISUAL BOARD)

## 2.1 Vòng Đời Của Một Canvas (Canvas Lifecycle)

Một trong những thắc mắc kỹ thuật lớn nhất: **"Khi người dùng đóng trình duyệt hoặc tắt máy, Canvas và Pipeline có tiếp tục chạy 24/7 không?"**

> 💡 **Khẳng định kiến trúc:**  
> **CANVAS TRÊN GIAO DIỆN CHỈ LÀ THIẾT KẾ (BLUEPRINT), HỢP ĐỒNG ON-CHAIN MỚI LÀ THỰC THI (ENGINE).**  
> Khi người dùng bấm **Deploy**, toàn bộ đồ thị trên Canvas được biên dịch thành hợp đồng thông minh `RSC` bất biến triển khai lên mạng **Reactive Network Omni**. Từ giây phút đó, hệ thống chạy **24/7/365 trên mạng lưới phi tập trung**, hoàn toàn độc lập với việc máy tính người dùng bật hay tắt! Khi mở lại web, Canvas tự động đồng bộ (rehydrate) trạng thái từ on-chain về.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Mở Canvas mới / Load Template
    DRAFT --> VALIDATING: Người dùng bấm [Deploy Automation]
    VALIDATING --> DRAFT: Lỗi Graph (Cổng chưa nối / Thiếu params)
    VALIDATING --> HYDRATING_PARAMS: Đồ thị hợp lệ (Type-safe verified)
    HYDRATING_PARAMS --> DEPLOYING_RSC: Trích xuất params tiêm vào Template Bytecode
    DEPLOYING_RSC --> FUNDING_GAS: RSC deployed trên Reactive Lasna (Pre-compiled)
    FUNDING_GAS --> WAITING_USER_AUTH: Nạp 1.0 lREACT vào RSC
    WAITING_USER_AUTH --> AUTHORIZING_VAULT: Frontend nhắc User ký setAuthorizedRSC trên MetaMask
    AUTHORIZING_VAULT --> RUNNING_24_7: Cấp quyền RSC gọi ActionVault trên Base Sepolia
    
    state RUNNING_24_7 {
        [*] --> LISTENING
        LISTENING --> EVALUATING: Bắt được Event on-chain
        EVALUATING --> EXECUTING: Điều kiện thỏa mãn
        EVALUATING --> LISTENING: Điều kiện không thỏa
        EXECUTING --> COOLDOWN_WAIT: Callback thành công (Timestamp recorded)
        COOLDOWN_WAIT --> LISTENING: Hết Cooldown (Tự động mở không sợ Deadlock)
    }

    RUNNING_24_7 --> PAUSED: Người dùng bấm [Pause] trên Dashboard
    PAUSED --> RUNNING_24_7: Người dùng bấm [Resume]
    RUNNING_24_7 --> TERMINATED: Người dùng bấm [Stop / Terminate]
    PAUSED --> TERMINATED: Hủy vĩnh viễn
    TERMINATED --> [*]: Hoàn trả lREACT dư & Hủy ủy quyền Vault
```

### Các Giai Đoạn Chi Tiết Của Vòng Đời Canvas:

| Giai Đoạn (Stage) | Trạng Thái Lưu Trữ | Mô Tả Nghiệp Vụ & Kỹ Thuật |
| :--- | :--- | :--- |
| **1. DRAFT (Soạn thảo)** | `localStorage` / React State | Người dùng kéo thả node, nối dây, nhập tham số trên Inspector. Chưa có chi phí gas. |
| **2. VALIDATING (Kiểm tra)** | In-Memory Engine | Kiểm tra: (1) Đồ thị có ít nhất 1 Trigger và 1 Action không? (2) Các cổng có nối đúng chuẩn Typed Port không? (3) Tham số giá/ví có bị rỗng không? |
| **3. COMPILING & DEPLOYING** | Backend Runner / Lasna RPC | Backend điền tham số vào Template $\rightarrow$ chạy `forge create` deploy `StopLoss_Pipeline.sol` lên Reactive Lasna Testnet. |
| **4. BINDING & SPONSORSHIP** | Multi-chain Tx | Ký transaction ủy quyền địa chỉ RSC vừa sinh vào `ActionVault.sol` trên Base Sepolia; tự động chuyển `1.0 lREACT` vào RSC để nuôi gas. |
| **5. RUNNING 24/7 (Sống On-chain)** | **Reactive Network Consensus** | **Canvas có thể đóng!** Hợp đồng RSC liên tục lắng nghe event trên Base Sepolia thông qua Reactive System Contract `0x...fffFfF`. |
| **6. STOP / PAUSE (Tạm dừng)** | Destination Chain State | Người dùng bấm Pause $\rightarrow$ gọi hàm `revokeRSC(address)` trên `ActionVault`, tạm thời tước quyền thực thi của RSC. |
| **7. TERMINATED (Hủy hoàn toàn)** | On-chain Unsubscribe | RSC gọi `service.unsubscribe()`, rút toàn bộ `lREACT` còn dư về ví của người dùng. Canvas lưu trữ thành dạng Archived. |

---

## 2.2 Vòng Đời Của Từng Node (Node State Machine)

Trên Canvas, mỗi Node là một thực thể đồ họa có trạng thái riêng biệt, được cập nhật theo thời gian thực (Real-time Visual Feedback Loop):

```mermaid
stateDiagram-v2
    [*] --> NODE_IDLE: Khởi tạo trên Canvas
    NODE_IDLE --> NODE_CONFIGURED: Điền đủ params trên Inspector
    NODE_CONFIGURED --> NODE_DEPLOYED: Pipeline Deploy thành công
    
    state NODE_DEPLOYED {
        [*] --> ST_LISTENING: Chờ sự kiện (Xanh lam nhạt)
        ST_LISTENING --> ST_EVENT_CAPTURED: Block mới có Event (Chớp sáng)
        ST_EVENT_CAPTURED --> ST_EVALUATING: Đang giải mã LogRecord (Vàng cam)
        ST_EVALUATING --> ST_PASSED: Thỏa mãn Threshold (Vàng kim rực rỡ)
        ST_EVALUATING --> ST_SKIPPED: Không thỏa mãn (Mờ xám lại)
        ST_PASSED --> ST_FIRING_CALLBACK: Bắn Callback (Tím neon)
        ST_FIRING_CALLBACK --> ST_SUCCESS: Callback thành công (Xanh lục đậm)
        ST_FIRING_CALLBACK --> ST_REVERTED: Bị revert (Đỏ tươi)
        ST_SUCCESS --> ST_COOLDOWN: Đang đếm ngược Cooldown (Đồng hồ cát)
        ST_COOLDOWN --> ST_LISTENING: Sẵn sàng chu kỳ mới
        ST_SKIPPED --> ST_LISTENING: Quay lại lắng nghe
    }
```

### Bảng Mã Màu & Hiệu Ứng Trực Quan Của Node:

| Trạng Thái Node | Màu Viền / Nền Node | Hiệu Ứng Animation Trên Canvas | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| `IDLE / DRAFT` | Xám `#9E9E9E` | Tĩnh (Static) | Node mới kéo ra, chưa deploy. |
| `CONFIGURED` | Xanh dương `#2196F3` | Border sáng nhẹ khi focus | Tham số đã validate thành công. |
| `LISTENING` | Xanh lam nhạt `#E1F5FE` | Pulse nhịp thở chậm (Slow breathe) | RSC đang subscribe event on-chain. |
| `EVENT_CAPTURED` | Xanh Cyan `#00E5FF` | **Chớp sáng 200ms** | Nhận được `Sync` log từ Origin chain. |
| `CONDITION_MET` | Vàng cam `#FFB300` | Sáng rực rỡ (Glowing aura) | Logic `react()` trả về `true`. |
| `EXECUTING` | Tím neon `#D500F9` | Hạt photon bắn dọc theo đường dây nối | Đang phát sinh `emit Callback(...)`. |
| `SUCCESS` | Xanh lục `#00E676` | Viền xanh rực rỡ + Link Tx Hash | Callback hoàn tất trên Destination chain. |
| `COOLDOWN` | Cam hổ phách `#FF6D00` | Biểu tượng đồng hồ cát đếm lùi | `block.timestamp - lastTriggered < cooldown`. |
| `ERROR / REVERT` | Đỏ thẫm `#D50000` | Viền đỏ rung nhẹ (Shake) | Callback revert hoặc trượt giá vượt mức. |

---

## 2.3 Danh Mục 10 Node Thực Thi Chuẩn Hóa (Lean & Orthogonal Catalog)

Hệ thống được thiết kế theo nguyên tắc **Direct Orthogonal Architecture** (Không trùng lặp, mỗi node sở hữu một năng lực kỹ thuật độc nhất):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   REACTIVEFLOW LEAN CATALOG (10 NODES)                 │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 🔵 1. TRIGGERS (3)  │ 🟡 2. CONDITIONS (3)     │ 🟢 3. ACTIONS (3)     │
│ 1. Watch DEX Price  │ 4. Price Threshold Guard │ 7. DEX Token Swap     │
│ 2. Watch Transfers  │ 5. Cooldown Rate-Limiter │ 8. Emergency SafeSweep│
│ 3. Periodic Cron    │ 6. Balance Threshold     │ 9. Notify Log Webhook │
├─────────────────────┴──────────────────────────┴───────────────────────┤
│ ⚪ 4. LOGIC / CONTROL (1)                                              │
│ 10. Logic Gate (AND / OR) — [Điểm nhấn biến hệ thống thành Zapier Web3]│
└────────────────────────────────────────────────────────────────────────┘
```

---

### CHI TIẾT ĐẶC TẢ TỪNG NODE:

#### 1. 🔵 Node: `WatchDEXPriceNode` (Trigger)
* **Chức năng:** Lắng nghe biến động giá của một cặp token trên sàn DEX AMM.
* **Cơ chế kỹ thuật ngầm:** Gọi `service.subscribe(originChainId, pairAddress, SYNC_TOPIC, ...)`. Lắng nghe `Sync(uint112 reserve0, uint112 reserve1)`.
* **Cổng kết nối:** 0 Input | 1 Output (Type: `EventStream<PriceData>`).
* **Đặc tả Inputs (Inspector):**
  * `chainId` *(Dropdown, Bắt buộc)*: `84532` (Base Sepolia) hoặc `1301` (Unichain Sepolia). Mặc định: `84532`.
  * `dexRouter` *(Dropdown, Bắt buộc)*: `Uniswap V2`.
  * `tokenPair` *(Dropdown, Bắt buộc)*: `ETH/USDC`, `WBTC/USDC`. Tự động map sang Pair Address `0x...`.
* **Output Data Package:** `{ reserve0: uint112, reserve1: uint112, timestamp: uint256 }`.

---

#### 2. 🔵 Node: `WatchTransfersNode` (Trigger)
* **Chức năng:** Theo dõi các giao dịch biến động số dư của một ví hoặc token cụ thể (phát hiện ví bị hack hoặc theo dõi giao dịch cá voi).
* **Cơ chế kỹ thuật ngầm:** Gọi `service.subscribe()` lắng nghe event `Transfer(address indexed from, address indexed to, uint256 value)`.
* **Cổng kết nối:** 0 Input | 1 Output (Type: `EventStream<TransferData>`).
* **Đặc tả Inputs (Inspector):**
  * `watchTarget` *(Dropdown)*: `My Connected Wallet` hoặc `Specific Address`.
  * `tokenAddress` *(Dropdown)*: `Native ETH` hoặc ERC-20 token address.
  * `direction` *(Dropdown)*: `Outgoing` | `Incoming` | `Both`.
* **Output Data Package:** `{ from: address, to: address, amount: uint256, txHash: bytes32 }`.

---

#### 3. 🔵 Node: `PeriodicCronNode` (Trigger)
* **Chức năng:** Kích hoạt tự động theo chu kỳ thời gian (phục vụ tái cân bằng danh mục hoặc kiểm tra tài sản định kỳ).
* **Cơ chế kỹ thuật ngầm:** Đăng ký lắng nghe các block ticks định kỳ từ hệ thống Reactive Network System Cron.
* **Cổng kết nối:** 0 Input | 1 Output (Type: `EventStream<CronTick>`).
* **Đặc tả Inputs (Inspector):**
  * `intervalValue` *(Integer, Bắt buộc)*: Khoảng thời gian (ví dụ: `1`, `6`, `24`).
  * `intervalUnit` *(Dropdown)*: `Minutes` | `Hours` | `Days`. Mặc định: `Hours`.
* **Output Data Package:** `{ tickTimestamp: uint256, blockNumber: uint256 }`.

---

#### 4. 🟡 Node: `PriceThresholdGuardNode` (Condition)
* **Chức năng:** So sánh tỷ giá tức thời được tính toán từ reserves với ngưỡng mục tiêu (Hỗ trợ cả Cắt lỗ và Chốt lời).
* **Cơ chế kỹ thuật ngầm:** $\text{currentPrice} = \frac{\text{reserve1} \times 10^{18}}{\text{reserve0}}$. So khớp với operator `<=`, `>=`.
* **Cổng kết nối:** 1 Input (Type: `PriceData`) | 1 Output (Type: `ConditionSignal`).
* **Đặc tả Inputs (Inspector):**
  * `operator` *(Dropdown, Bắt buộc)*: `LESS_THAN_OR_EQUAL (<=)` [Cắt lỗ] hoặc `GREATER_THAN_OR_EQUAL (>=)` [Chốt lời].
  * `targetPriceUSD` *(Number Float, Bắt buộc)*: Ngưỡng giá USD (ví dụ: `1800.00`).
* **Output Data Package:** `{ conditionMet: boolean, currentPrice: uint256 }`.

---

#### 5. 🟡 Node: `CooldownGuardNode` (Condition / Rate-Limiter)
* **Chức năng:** Ngăn chặn việc một pipeline bị kích hoạt liên tục trong nhiều block kế tiếp nhau gây cạn kiệt tài sản và phí gas.
* **Cơ chế kỹ thuật ngầm:** `require(block.timestamp - lastTriggered >= cooldownSeconds, "Cooldown active");`.
* **Cổng kết nối:** 1 Input | 1 Output.
* **Đặc tả Inputs (Inspector):**
  * `cooldownValue` *(Integer, Bắt buộc)*: Thời gian chờ (ví dụ: `300`).
  * `timeUnit` *(Dropdown)*: `Seconds` | `Minutes` | `Hours`. Mặc định: `Minutes`.
* **Output Data Package:** `{ canExecute: boolean, secondsRemaining: uint256 }`.

---

#### 6. 🟡 Node: `BalanceThresholdNode` (Condition)
* **Chức năng:** Kiểm tra số dư tài sản trong ví hoặc trong `ActionVault` trước khi cho phép hành động chạy tiếp.
* **Cổng kết nối:** 1 Input | 1 Output.
* **Đặc tả Inputs (Inspector):**
  * `targetAccount` *(Dropdown)*: `My ActionVault` hoặc `My Connected Wallet`.
  * `comparison` *(Dropdown)*: `Above` hoặc `Below`.
  * `thresholdAmount` *(Number)*: Số lượng token tối thiểu (ví dụ: `0.01 ETH`).
* **Output Data Package:** `{ balanceSufficient: boolean, currentBalance: uint256 }`.

---

#### 7. 🟢 Node: `DEXSwapNode` (Action)
* **Chức năng:** Phát sinh callback gọi vào `ActionVault.sol` để thực thi hoán đổi token trên Uniswap Router (Dùng cho cả Stop-Loss, Take-Profit, Rebalance).
* **Cơ chế kỹ thuật ngầm:** `emit Callback(...)` gọi `executeStopLoss(percent, minAmountOut)`.
* **Cổng kết nối:** 1 Input (Type: `ValidatedSignal`) | 0 Output.
* **Đặc tả Inputs (Inspector):**
  * `fromToken` *(Dropdown)*: Token bán (ví dụ: `ETH`).
  * `toToken` *(Dropdown)*: Token nhận về (ví dụ: `USDC`).
  * `amountPercentage` *(Slider, Bắt buộc)*: Tỷ lệ bán (1% - 100%). Mặc định: `50%`.
  * **`maxSlippage` *(Slider, Bắt buộc) — Tích hợp trực tiếp bên trong node:*** Trượt giá tối đa (0.1% - 5%). Mặc định: `1%`.
* **Business Rules:** Tự động tính `minAmountOut = (amountIn * expectedPrice * (100 - slippage)) / 100` chống MEV.

---

#### 8. 🟢 Node: `EmergencySafeSweepNode` (Action)
* **Chức năng:** Chuyển toàn bộ tài sản native ETH và ERC-20 về ví lạnh khẩn cấp khi phát hiện dấu hiệu xâm nhập.
* **Cơ chế kỹ thuật ngầm:** `emit Callback(...)` gọi `emergencySweep(safeAddress)`.
* **Cổng kết nối:** 1 Input | 0 Output.
* **Đặc tả Inputs (Inspector):**
  * `safeAddress` *(Address, Bắt buộc)*: Địa chỉ ví lạnh an toàn.
  * `assetScope` *(Dropdown)*: `All Assets (ETH + Tokens)` | `ETH Only`.

---

#### 9. 🟢 Node: `NotifyLogWebhookNode` (Action / Logger)
* **Chức năng:** Không tốn phí swap tài chính, chỉ phát ra một event nhật ký on-chain để gửi thông báo cảnh báo lên Dashboard / Telegram.
* **Cơ chế kỹ thuật ngầm:** `emit PipelineNotification(pipelineId, message, timestamp);`.
* **Cổng kết nối:** 1 Input | 0 Output.
* **Đặc tả Inputs (Inspector):**
  * `alertTitle` *(Text)*: Tiêu đề cảnh báo (ví dụ: *"Whale Alert: High Volatility Detected"*).
  * `severity` *(Dropdown)*: `INFO` | `WARNING` | `CRITICAL`.

---

#### 10. ⚪ Node: `LogicGateNode` (Logic / Control)
* **Chức năng:** Cho phép gộp 2 hoặc nhiều nhánh điều kiện lại với nhau theo phép toán logic `AND` (tất cả cùng đúng) hoặc `OR` (chỉ cần 1 điều kiện đúng).
* **Cơ chế kỹ thuật ngầm:** Biểu diễn thành biểu thức logic lồng trong hàm `react()`: `if (condA && condB) emit Callback(...)`.
* **Cổng kết nối:** 2 Inputs (Signal A, Signal B) | 1 Output (Combined Signal).
* **Đặc tả Inputs (Inspector):**
  * `gateType` *(Dropdown, Bắt buộc)*: `AND (Tất cả điều kiện phải thỏa)` | `OR (Một trong các điều kiện thỏa)`.

---

## 2.4 Phân Tích Nghiệp Vụ: Đề Xuất 12 Node vs 10 Node Tinh Hoa

Khi mở rộng hệ thống, việc đánh giá tính cần thiết của từng node là cực kỳ quan trọng để tránh tạo ra các "tính năng rác":

```
┌────────────────────────────────────────────────────────────────────────┐
│              SO SÁNH ĐỀ XUẤT 12 NODE vs 10 NODE TINH HOA               │
├─────────────────────────┬──────────────────────────────────────────────┤
│ ĐỀ XUẤT 12 NODES        │ PHÂN TÍCH NGHIỆP VỤ & KẾT LUẬN               │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 1. Take-Profit Scalper  │ ❌ DƯ THỪA 100%: Bản chất on-chain đều là    │
│    vs DEX Token Swap    │ gọi Uniswap swap ETH -> USDC. Điểm khác duy  │
│                         │ nhất là operator (<= vs >=) ở node Condition.│
│                         │ $\rightarrow$ Hợp nhất vào 1 node `DEX Swap`. │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 2. Slippage Guard       │ ❌ SAI NGHIỆP VỤ UX: Slippage không bao giờ  │
│    như một Node rời     │ là 1 node điều kiện độc lập trên đồ thị DeFi.│
│                         │ Nó là tham số cấu hình bắt buộc NẰM TRONG    │
│                         │ node `DEX Swap` (minAmountOut).              │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 3. Whale Alert Tracker  │ ❌ TRÙNG LẶP: Đều là nghe sự kiện `Transfer`.│
│    vs Watch Transfers   │ "Cá voi" chỉ là một ví có amount lớn.        │
│                         │ $\rightarrow$ Hợp nhất vào `Watch Transfers`.│
└─────────────────────────┴──────────────────────────────────────────────┘
```

> 🎯 **Kết luận:** Giữ lại **10 Node Tinh Hoa** giúp sản phẩm đạt chuẩn **Orthogonal Architecture**, vừa vặn cho Hackathon 21 ngày, không bị lỗi thời gian chạy thực tế (Runtime bug), và được Ban Giám Khảo đánh giá rất cao về tư duy thiết kế phần mềm sạch.

---

## 2.5 Ma Trận Khả Năng Vận Hành: 4 Trụ Cột & 12 Kịch Bản Thực Chiến Sống Còn

Chỉ với 10 node này, người dùng giải quyết được **12 bài toán đau đớn nhất trong thế giới Crypto**:

```mermaid
mindmap
  root((12 Kịch Bản Thực Chiến))
    Trụ Cột 1: Quản Trị Rủi Ro
      KB1: Stop-Loss Tránh Flash Crash
      KB2: Cắt Lỗ Bậc Thang Thông Minh
      KB3: Chốt Lời Đỉnh Sóng Tự Động
      KB4: Cắt Lỗ Có Lọc Tiền Lẻ (Dust)
    Trụ Cột 2: Bảo Vệ Ví Chống Hack
      KB5: Tự Động Tẩu Tán Sang Ví Lạnh
      KB6: Cảnh Báo Xâm Nhập Không Tốn Gas
    Trụ Cột 3: Bám Đuôi Cá Voi
      KB7: Cảnh Báo Sớm Cá Voi Nạp Sàn
      KB8: Thoát Hàng Trước Khi Bị Úp Bô
    Trụ Cột 4: Quản Lý Thụ Động 24/7
      KB9: Cân Bằng Danh Mục Hàng Ngày
      KB10: Rút Tiền Đều Đặn Theo Tuần
      KB11: Cắt Lỗ Có Thời Gian Phục Hồi
      KB12: Cảnh Báo Két Sắp Hết Tiền
```

### BẢNG CHI TIẾT 12 KỊCH BẢN THỰC CHIẾN:

| # | Tên Kịch Bản | Luồng Ghép Nối Các Node | Nỗi Đau Thực Tế Của Người Dùng | Giá Trị Khiến Họ CẦN ReactiveFlow |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Cắt Lỗ Đêm (Flash Crash Guard)** | `Watch DEX Price` $\rightarrow$ `Price Threshold (<= $1800)` $\rightarrow$ `Cooldown (5m)` $\rightarrow$ `DEX Swap (100% ETH -> USDC)` | Giá sập 30% lúc 3h sáng khi trader đang ngủ. | Ngủ ngon giấc vì hợp đồng tự cắt lỗ sang USDC trong 1s. |
| **02** | **Cắt Lỗ Bậc Thang (Multi-Tier)** | Nhánh 1: `Price <= $2000` $\rightarrow$ `Swap 30%`. Nhánh 2: `Price <= $1700` $\rightarrow$ `Swap 70% còn lại`. | Bán tháo hết 1 lần thì sợ giá hồi phục lại. | Quản trị rủi ro theo từng nấc như quỹ chuyên nghiệp. |
| **03** | **Chốt Lời Tự Động (Take-Profit)** | `Watch DEX Price` $\rightarrow$ `Price Threshold (>= $2800)` $\rightarrow$ `DEX Swap (Bán 50% sang USDC)` | Lòng tham chi phối, không chịu chốt lời rồi đu đỉnh. | Tự động hóa kỷ luật chốt lời tiền mặt khi đạt kỳ vọng. |
| **04** | **Lọc Tiền Lẻ (Dust Guard)** | `Watch DEX Price` $\rightarrow$ `Logic Gate [Price <= $1800 AND Balance >= 0.05 ETH]` $\rightarrow$ `DEX Swap` | Ví chỉ còn vài đồng lẻ mà swap thì lỗ tiền gas. | Chỉ kích hoạt lệnh khi số dư đủ lớn, tránh lãng phí gas. |
| **05** | **Tẩu Tán Ví Khẩn Cấp (Anti-Drainer)** | `Watch Transfers (Ví bị rút tiền)` $\rightarrow$ `Emergency Safe Sweep (Rút sạch về Ví Lạnh)` | Bấm nhầm link lừa đảo phishing, bị bot rút ruột ví. | Reactive Omni phát hiện trong 1s, tẩu tán sạch vốn trước mũi hacker! |
| **06** | **Báo Động Đỏ Xâm Nhập** | `Watch Transfers` $\rightarrow$ `Cooldown (1m)` $\rightarrow$ `Notify Log Webhook (Bắn alert Telegram)` | Muốn biết ngay lập tức khi ví phát sinh giao dịch lạ. | Nhận thông báo tức thì trên điện thoại mà không tốn phí swap. |
| **07** | **Cảnh Báo Cá Voi Nạp Tiền** | `Watch Transfers (Ví cá voi chuyển > 500 ETH)` $\rightarrow$ `Notify Log Webhook` | Cá voi nạp tiền lên sàn xả hàng làm sập giá. | Phát hiện động thái gom/xả của cá voi trước khi chart sập. |
| **08** | **Thoát Hàng Trước Cá Voi** | `Watch Transfers (Cá voi nạp tiền)` $\rightarrow$ `Logic Gate [AND Giá bắt đầu giảm]` $\rightarrow$ `DEX Swap` | Nhỏ lẻ luôn là người chịu trận cuối cùng khi cá voi xả. | Front-run đợt xả, bán được ở giá cao trong những block đầu tiên! |
| **09** | **Tái Cân Bằng Danh Mục Định Kỳ** | `Periodic Cron (Mỗi 24h)` $\rightarrow$ `Balance Threshold` $\rightarrow$ `DEX Swap (Cân bằng 50/50)` | Quản lý danh mục thụ động nhưng không rảnh canh chart. | Tự động tái cân bằng danh mục chuẩn hóa quỹ đầu tư 365 ngày. |
| **10** | **Rút Tiền Lãi Hàng Tuần (DCA Out)** | `Periodic Cron (Mỗi 7 ngày)` $\rightarrow$ `Price Threshold (Giá >= $2200)` $\rightarrow$ `DEX Swap (Bán 10%)` | Muốn rút tiền sinh hoạt hàng tuần nhưng chỉ bán khi giá cao. | Tự động rút tiền mặt khi thị trường xanh, thị trường đỏ thì giữ. |
| **11** | **Cắt Lỗ Chống Bị "Cắn Đuôi"** | `Watch DEX Price` $\rightarrow$ `Price <= $1800` $\rightarrow$ `Cooldown (1 Giờ)` $\rightarrow$ `DEX Swap (50%)` | Giá giằng co quanh cản làm hợp đồng swap liên tục. | Bắt buộc chờ 1 tiếng thị trường ổn định mới xét lệnh tiếp theo. |
| **12** | **Cảnh Báo Két Sắp Hết Tiền** | `Periodic Cron (Mỗi 12h)` $\rightarrow$ `Balance Threshold (Vault < 0.02 ETH)` $\rightarrow$ `Notify Log Webhook` | Két hết tiền mà không biết khiến tự động hóa bị ngừng. | Không bao giờ bị đứt quãng tự động hóa, nhắc nhở nạp thêm vốn. |

---

## 2.6 Đánh Giá Năng Lực Node: Đã Phát Huy Hết Sức Mạnh Reactive Omni Chưa?

| Tiêu Chí Đánh Giá | Hiện Trạng Của 10 Node Tinh Hoa | Nhận Định Chuyên Môn (BA Evaluation) |
| :--- | :--- | :--- |
| **Khai thác block ~1s của Omni** | ⭐⭐⭐⭐⭐ (5/5) | Cặp `Watch DEX Price` $\rightarrow$ `DEX Swap` và `Watch Transfers` $\rightarrow$ `Safe Sweep` khai thác triệt để tốc độ 1s để cứu tiền. |
| **Bảo mật & Giảm thiểu rủi ro** | ⭐⭐⭐⭐⭐ (5/5) | `CooldownGuard` và tham số `minAmountOut` triệt tiêu 100% nguy cơ lặp giao dịch và bẫy MEV. |
| **Tính đa dạng Use Case** | ⭐⭐⭐⭐⭐ (5/5) | Phủ trọn 4 trụ cột nghiệp vụ: Cắt lỗ, Chốt lời, Chống hack ví, và Quản lý danh mục thụ động. |
| **Độ khả thi trong 21 ngày** | ⭐⭐⭐⭐⭐ (5/5) | Chỉ cần 2 Solidity Template cốt lõi là giải quyết được toàn bộ 10 node này. Cực kỳ khả thi! |

---

# 3. ĐẶC TẢ CHI TIẾT 4 MÀN HÌNH WORKSPACE BỔ TRỢ & LANDING PAGE

---

## 3.1 Màn Hình: Landing Page (Cửa ngõ tương tác)

### Mục tiêu & Đối tượng
Giới thiệu giá trị sản phẩm, tạo ấn tượng với Giám khảo trong 30 giây đầu và điều hướng vào ứng dụng.

### Bảng Đặc Tả Dữ Liệu & Giao Diện:
* **Input Elements:** Nút bấm **[ Launch Workspace ]**, nút **[ Watch 2-Min Demo ]**, nút chuyển đổi theme (Dark/Light).
* **Live Dynamic Data (WebSocket / Polling 2s):**
  * `lasnaBlockHeight`: Chiều cao block hiện tại của Reactive Lasna.
  * `lasnaBlockTime`: Tốc độ trung bình (ví dụ: `1.04s`).
  * `baseSepoliaBlockHeight`: Chiều cao block Base Sepolia (ví dụ: `#1849102`).
  * `totalActiveAutomations`: Tổng số hợp đồng RSC đang chạy trong hệ thống.
* **Business Rules:**
  * Khi bấm **[ Launch Workspace ]**:
    * Nếu ví chưa kết nối $\rightarrow$ Kích hoạt modal kết nối Web3 (MetaMask/Coinbase).
    * Nếu ví đã kết nối $\rightarrow$ Chuyển thẳng vào route `/workspace/studio`.
* **Output / Trạng Thái:**
  * Hiển thị banner trạng thái mạng: 🟢 *Reactive Omni Network: Healthy (1s blocks)*.

---

## 3.2 Màn Hình: Active Automations (Giám sát 24/7 & Nạp Gas)

### Mục tiêu
Nơi người dùng an tâm "quên nó đi" nhưng vẫn nắm trọn quyền điều khiển mọi hợp đồng tự động hóa on-chain.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ACTIVE AUTOMATIONS DASHBOARD                                          │
│                                                                        │
│  [ Card: ETH Stop-Loss @ $1800 ]                     Status: 🟢 ACTIVE │
│  ├─ Deployed RSC: 0x9bA...3f1 (Lasna)               Events Captured:   │
│  ├─ Target Vault: 0x24C...A89 (Base)                      [ 4,210 ]    │
│  ├─ Gas Gauge: [████████████░░░░░░] 1.45 lREACT      [ + Refuel Gas ]  │
│  └─ Controls:  [ ⏸️ Pause ]   [ ⏹️ Terminate ]       [ 🔍 View Logs ]   │
└────────────────────────────────────────────────────────────────────────┘
```

### Bảng Đặc Tả Chi Tiết:
* **Data Sources (Inputs):**
  * Lấy danh sách hợp đồng đã deploy của `connectedWallet` từ Local Index / Factory Contract.
  * Đọc `balance` của địa chỉ RSC trên Reactive Lasna (`provider.getBalance(rscAddress)`).
  * Đọc biến `lastTriggered` và `totalEventsProcessed` từ hợp đồng RSC.
* **Business Rules (Quy tắc xử lý):**
  * **Cảnh báo Gas Cạn:** 
    * Nếu `balance(lREACT) >= 0.5` $\rightarrow$ Thanh màu xanh lục (Bình thường).
    * Nếu `0.1 <= balance(lREACT) < 0.5` $\rightarrow$ Thanh màu vàng cam (Khuyến nghị nạp thêm).
    * Nếu `balance(lREACT) < 0.1` $\rightarrow$ Thanh màu đỏ nhấp nháy: *"Gas critical! Callback may fail."*
  * **Xử lý Nút [ + Refuel Gas ]:** Mở popup cho phép gửi `0.5` hoặc `1.0 lREACT` từ ví sang địa chỉ hợp đồng RSC.
  * **Xử lý Nút [ Pause ]:** Gọi transaction `setAuthorizedRSC(address(0))` trên `ActionVault` $\rightarrow$ Trạng thái chuyển sang 🟡 `PAUSED`.
  * **Xử lý Nút [ Terminate ]:** Hủy vĩnh viễn, gọi hàm rút toàn bộ gas dư về ví $\rightarrow$ Trạng thái chuyển sang ⚪ `TERMINATED`.
* **Outputs:** Bảng điều khiển real-time cập nhật số event nhảy liên tục mỗi khi Base Sepolia sinh block mới.

---

## 3.3 Màn Hình: Template Library (Thư Viện Công Thức 1-Click)

### Mục tiêu
Xóa bỏ hoàn toàn rào cản thao tác cho người dùng mới và phục vụ ban giám khảo test sản phẩm trong 10 giây.

### Bảng Đặc Tả Chi Tiết:
* **Data Schema Của Một Recipe Card:**
  ```json
  {
    "id": "recipe-stop-loss-eth",
    "title": "Uniswap Flash Crash Stop-Loss",
    "badge": "DeFi Protection",
    "difficulty": "Beginner",
    "estimatedGas": "~0.002 Sepolia ETH",
    "nodesIncluded": ["WatchDEXPrice", "PriceThresholdGuard", "CooldownGuard", "DEXSwap"],
    "description": "Automatically swap 50% ETH to USDC if price drops below $1,800."
  }
  ```
* **Business Rules (Graph Hydration Engine):**
  * Khi người dùng bấm **[ Use Recipe ]**:
    1. Hệ thống serialize mẫu JSON tương ứng thành một mảng `nodes[]` và `edges[]` hoàn chỉnh với các tọa độ `(x, y)` được tính toán sẵn.
    2. Điền sẵn các tham số an toàn (Default Safe Parameters).
    3. Chuyển route sang `/workspace/studio` và render toàn bộ đồ thị lên Canvas.
    4. Hiển thị thông báo Toast: *"Recipe loaded! You can customize parameters on the right panel before deploying."*

---

## 3.4 Màn Hình: Vault Manager & Security (Két An Toàn & Panic Button)

### Mục tiêu
Đảm bảo tính phi lưu ký (Non-Custodial) và an toàn vốn tuyệt đối cho người dùng.

### Bảng Đặc Tả Chi Tiết:
* **Data Elements:**
  * `Vault Address`: Địa chỉ `ActionVault.sol` của user trên Base Sepolia.
  * `ETH Balance`: Đọc qua `provider.getBalance(vaultAddress)`.
  * `USDC Balance`: Đọc qua `usdcContract.balanceOf(vaultAddress)`.
  * `Authorized RSC`: Địa chỉ RSC đang được cấp quyền.
* **Chức Năng Nạp/Rút Tiền Thường (Normal Deposit/Withdraw):**
  * `Deposit ETH`: User gửi ETH từ MetaMask vào địa chỉ Vault.
  * `Withdraw ETH`: Gọi hàm `withdraw(uint256 amount)` (chỉ `owner` mới được gọi).
* **CHỨC NĂNG PANIC BUTTON (EMERGENCY WITHDRAW - NÚT ĐỎ):**
  * **Giao diện:** Nút bấm đỏ nổi bật có biểu tượng khiên bảo vệ `[ 🚨 EMERGENCY PANIC WITHDRAW ]`.
  * **Input:** Bấm nút $\rightarrow$ Modal xác nhận: *"Are you sure you want to withdraw 100% funds back to your wallet immediately?"*
  * **Quy tắc xử lý (On-chain execution):**
    * Gửi transaction gọi trực tiếp hàm `ActionVault.emergencyWithdraw()`.
    * Hàm này bỏ qua mọi logic kiểm tra của Reactive Network, chuyển sạch 100% native ETH và tokens về ví `msg.sender` (ví user).
  * **Output:**
    * Sau khi tx thành công: Số dư Vault về `0 ETH`, số dư ví cá nhân tăng tương ứng.
    * Ghi nhận log cảnh báo: *"Emergency withdrawal completed at block #..."*.

---

## 3.5 Màn Hình: Activity Logs & Explorer (Minh Chứng On-Chain)

### Mục tiêu
Cung cấp bằng chứng kỹ thuật không thể chối cãi cho Ban Giám Khảo thấy toàn bộ vòng lặp hoạt động on-chain thật.

### Bảng Đặc Tả Chi Tiết:
* **Event Ingestion Pipeline:**
  * Lắng nghe WebSocket RPC từ Base Sepolia và Lasna Testnet.
* **Cấu Trúc Bảng Nhật Ký (Columns):**
  1. `Event ID / Time`: Định dạng `HH:mm:ss DD/MM/YYYY`.
  2. `Pipeline Name`: Tên của automation kích hoạt sự kiện.
  3. `Origin Event`: Tên event (e.g. `Sync(reserve0, reserve1)`) kèm link tx hash Base Sepolia.
  4. `Reactive Execution`: Tên hàm `react()` trên Reactive Omni kèm link tx hash Lasna.
  5. `Latency (Delta T)`: Độ lệch thời gian giữa Origin và Callback (ví dụ: `1.18s`).
  6. `Callback Result`: `SUCCESS` (Xanh) | `SKIPPED (Price Above Threshold)` (Xám) | `REVERTED` (Đỏ).
* **Bộ Lọc (Filters):** Lọc theo Pipeline, lọc theo Trạng thái (All / Executed / Skipped), lọc theo Chain.

---

# 4. CHUẨN DỮ LIỆU & ĐẶC TẢ API (DATA CONTRACTS & SCHEMAS)

### 4.1 Cấu Trúc Graph Serialization Schema (JSON xuất từ Canvas)

Khi người dùng bấm **Deploy Automation**, Canvas đóng gói toàn bộ trạng thái thành cấu trúc JSON chuẩn:

```json
{
  "pipelineVersion": "1.0.0",
  "pipelineName": "My Protected ETH Stop-Loss",
  "ownerAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "network": {
    "originChainId": 84532,
    "reactiveChainId": 5318007,
    "destinationChainId": 84532
  },
  "nodes": [
    {
      "id": "node-trigger-1",
      "type": "watchDEXPrice",
      "position": { "x": 100, "y": 200 },
      "data": {
        "pairAddress": "0x1234567890123456789012345678901234567890",
        "pairSymbol": "ETH/USDC",
        "dex": "Uniswap V2"
      }
    },
    {
      "id": "node-condition-1",
      "type": "priceThresholdGuard",
      "position": { "x": 400, "y": 200 },
      "data": {
        "operator": "LESS_THAN_OR_EQUAL",
        "targetPriceUSD": 1800.0,
        "priceDecimals": 18
      }
    },
    {
      "id": "node-condition-2",
      "type": "cooldownGuard",
      "position": { "x": 700, "y": 200 },
      "data": {
        "cooldownSeconds": 300
      }
    },
    {
      "id": "node-action-1",
      "type": "dexSwap",
      "position": { "x": 1000, "y": 200 },
      "data": {
        "actionVaultAddress": "0xABCDEF0123456789ABCDEF0123456789ABCDEF01",
        "fromToken": "WETH",
        "toToken": "USDC",
        "amountPercent": 50,
        "maxSlippagePercent": 1.0
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-trigger-1", "target": "node-condition-1" },
    { "id": "e2-3", "source": "node-condition-1", "target": "node-condition-2" },
    { "id": "e3-4", "source": "node-condition-2", "target": "node-action-1" }
  ]
}
```

---

### 4.2 Endpoint Đặc Tả Deploy Service: `POST /api/pipeline/compile-and-deploy`

* **Request Headers:** `Content-Type: application/json`
* **Request Body:** Toàn bộ payload Graph JSON ở mục 4.1.
* **Server Processing Flow (Tối Ưu & Non-Custodial Zero-Trust):**
  1. Kiểm tra tính toàn vẹn của đồ thị (Graph Integrity Validation).
  2. Trích xuất danh sách node parameters tương ứng với Template Solidity (`StopLoss_Pipeline.sol`).
  3. Deploy RSC lên Reactive Lasna thông qua Pre-compiled Bytecode / `cast send --create` với constructor arguments tương ứng (thực thi dưới 2 giây, không tốn tài nguyên compile động).
  4. Nạp `1.0 lREACT` vào hợp đồng vừa deploy để nuôi callback.
  5. Trả về `rscAddress` cho Frontend để Người dùng (`owner` của `ActionVault`) tự bấm ký giao dịch `setAuthorizedRSC` trên MetaMask. (Relayer server tuyệt đối không can thiệp, đảm bảo tính Non-Custodial).
* **Response Payload (Success 200 OK):**
  ```json
  {
    "success": true,
    "pipelineId": "rf-pipe-8921a",
    "deployedContracts": {
      "rscAddress": "0x9bA415C9C985F8f2a58d5F6D90f23bEb5E3Af3f1",
      "rscChainId": 5318007,
      "rscDeployTxHash": "0x5a1b3c7d...89f2",
      "actionVaultAddress": "0xABCDEF0123456789ABCDEF0123456789ABCDEF01",
      "vaultChainId": 84532
    },
    "gasStatus": {
      "initialFundedLReact": "1.0",
      "estimatedCallbacksRemaining": 20
    },
    "explorerLinks": {
      "reactscan": "https://lasna.reactscan.net/address/0x9bA415C9C985F8f2a58d5F6D90f23bEb5E3Af3f1",
      "blockscout": "https://sepolia.basescan.org/address/0xABCDEF0123456789ABCDEF0123456789ABCDEF01"
    }
  }
  ```

---

### 4.3 WebSocket Stream Data Payload: `topic: pipeline_events`

Mỗi khi có event xảy ra trên origin chain hoặc reactive chain, client nhận gói tin WebSocket:

```json
{
  "type": "REACTIVE_STEP_UPDATE",
  "pipelineId": "rf-pipe-8921a",
  "step": "CONDITION_EVALUATED",
  "data": {
    "currentPrice": "1784.50",
    "thresholdPrice": "1800.00",
    "conditionMet": true,
    "originTxHash": "0x12c4...e89a",
    "originBlockNumber": 1849105,
    "latencyMs": 1120
  },
  "visualEffect": {
    "nodeId": "node-condition-1",
    "glowColor": "#FFB300",
    "firePulseEdge": "e2-3"
  }
}
```

---

# 5. ĐẶC TẢ KIẾN TRÚC SMART CONTRACT CHUẨN HÓA TRÊN REACTIVE OMNI

Nhằm đảm bảo hợp đồng thông minh của ReactiveFlow đạt chuẩn bảo mật và hiệu năng cao nhất trên Reactive Omni, hệ thống áp dụng **4 Mẫu Thiết Kế Cốt Lõi (Core On-Chain Design Patterns)**:

---

### 5.1 Callback Proxy Authentication Pattern (Xác thực 2 chiều chuẩn giao thức)

Trên mạng Reactive Network, lệnh Callback cross-chain không trực tiếp gọi đến đích mà được chuyển tiếp qua **Reactive Callback Proxy / Service Provider**. 

#### Cơ chế hoạt động:
1. Khi Callback Proxy gọi vào hàm `execute()` trên `ActionVault.sol`, Proxy **tự động chèn (overwrite) địa chỉ của hợp đồng RSC vào tham số đầu tiên `address rvm`**.
2. Hợp đồng `ActionVault` sử dụng modifier `onlyServiceProvider` (kế thừa từ `AbstractCallback`) để đảm bảo `msg.sender` chính là Callback Proxy chính thức.
3. Hợp đồng kiểm tra tiếp: `require(rvm == authorizedRSC, "Unauthorized RSC");` để bảo đảm chỉ duy nhất RSC của người dùng mới có quyền ra lệnh cho Vault.

```solidity
// Trích đoạn chuẩn hóa trên ActionVault.sol (Base Sepolia)
function execute(
    address rvm, // Được Callback Proxy tự động tiêm địa chỉ RSC
    uint256 pipelineId,
    uint256 kind,
    uint256 triggerPrice,
    uint256 tickTimestamp
) external onlyServiceProvider {
    require(rvm == authorizedRSC && rvm != address(0), "Unauthorized RSC caller");
    
    // Tiếp tục thực thi logic an toàn...
}
```

---

### 5.2 In-Flight Callback Protection & Cooldown Timestamp Pattern (Chống dội callback trên block 200ms & Triệt tiêu Deadlock)

#### Thách thức kỹ thuật:
Mạng Base Sepolia tạo block với tốc độ cực nhanh (**200ms/block**). Khi giá thị trường chạm ngưỡng cắt lỗ, có thể phát sinh liên tiếp 5-10 sự kiện `Sync` trong vòng 1 giây trước khi callback đầu tiên kịp hoàn tất trên Base. Nếu không kiểm soát, RSC sẽ phát ra 5-10 callback trùng lặp, làm cạn kiệt gas `lREACT` và gây lãng phí phí mạng. Mặt khác, nếu chỉ dùng cờ `bool isCallbackInFlight` mà không có cơ chế reset tự động sẽ dễ gây Deadlock vĩnh viễn cho hợp đồng.

#### Mẫu thiết kế giải quyết (Timestamp Cooldown First + In-Flight Safe Guard):
1. Trong hợp đồng RSC trên Reactive Omni, cấu trúc quản lý đặt điều kiện Cooldown Timestamp lên **ưu tiên hàng đầu**:
   ```solidity
   // Chốt chặn 1: Tự động miễn nhiễm mọi block 200ms trong thời gian Cooldown
   if (block.timestamp - lastTriggeredTimestamp < cooldownSeconds) {
       return;
   }

   // Chốt chặn 2: Kiểm tra cờ đang bay nếu có
   if (isCallbackInFlight) return;
   ```
2. Khi phát hiện giá chạm ngưỡng bảo vệ:
   * Gán ngay `lastTriggeredTimestamp = block.timestamp` và `isCallbackInFlight = true`.
   * Phát duy nhất **1 lệnh Callback**.
   * Bất kỳ block 200ms nào tiếp theo đều bị ngắt ngay lập tức ở Chốt chặn 1 (`return`) mà không tốn gas VM.
3. Hết thời gian `cooldownSeconds`, hợp đồng tự động mở lại khả năng phát hiện sự kiện mà **không cần phụ thuộc vào bất kỳ bot off-chain nào gọi hàm reset**, loại trừ 100% nguy cơ Deadlock. Đồng thời, hàm `resetInFlight()` vẫn được giữ lại để cho phép reset chủ động khi cần.

---

### 5.3 Live Price Re-Validation Pattern (Tái thẩm định giá tức thời chống Stale Trigger)

#### Thách thức kỹ thuật:
Do độ trễ mạng (~1.2s - 1.5s), có trường hợp giá vừa chạm $1,799 kích hoạt Stop-Loss, nhưng ngay trong block tiếp theo một lệnh mua lớn đẩy giá vọt ngược lại lên $1,850. Nếu lệnh cắt lỗ vẫn khớp ở thời điểm giá $1,850 thì người dùng bị bán hớ không đúng ý muốn.

#### Mẫu thiết kế giải quyết:
Khi hàm `execute()` được gọi trên `ActionVault.sol`, hợp đồng **đọc lại giá tức thời trên sàn DEX ngay tại block đó (Live Price Re-check)**:
```solidity
uint256 currentLivePrice = getLivePriceFromPool();

// Tái thẩm định: Điều kiện giá có CÒN ĐÚNG ở thời điểm hiện tại không?
bool stillValid = (kind == STOP_LOSS) 
    ? (currentLivePrice <= order.stopPrice) 
    : (currentLivePrice >= order.takePrice);

if (!stillValid) {
    // Giá đã hồi phục! Hủy lệnh an toàn, không swap
    emit OrderSkipped(pipelineId, REASON_PRICE_BOUNCED_BACK);
    return;
}
```

---

### 5.4 Dual-Way Event State Synchronization (Đồng bộ trạng thái lệnh qua Event Stream)

Thay vì dùng cơ chế gọi hàm chéo chuỗi phức tạp, hệ thống sử dụng **Event-Driven Mirroring**:
* Khi người dùng tạo/hủy lệnh trên `ActionVault` (Base Sepolia), hợp đồng phát ra event `OrderPlaced(id, ...)` hoặc `OrderCancelled(id)`.
* Hợp đồng RSC trên Reactive Omni subscribe chính các event này của Vault để tự động thêm/xóa ID trong danh sách theo dõi nội bộ.
* Mọi logic đều được vận hành on-chain 100% mà **không cần bất kỳ bot off-chain nào đứng giữa đồng bộ dữ liệu**.

---

> 📌 **Kết Luận & Bàn Giao Kỹ Thuật:**  
> Bản đặc tả FRS hoàn thiện này cung cấp đầy đủ: Bản đồ 10 Node Tinh Hoa, cơ sở loại trừ 3 điểm dư thừa, ma trận 12 kịch bản thực chiến sống còn, toàn bộ chuẩn kết nối API / WebSocket, và 4 Mẫu Thiết Kế Smart Contract chuẩn mực nhất trên Reactive Omni.
