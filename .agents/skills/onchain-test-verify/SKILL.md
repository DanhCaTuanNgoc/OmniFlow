---
name: onchain-test-verify
description: Comprehensive testing, verification, and anti-mock protocols to guarantee 100% live on-chain execution across Base Sepolia and Reactive Omni Lasna.
---

# On-Chain Testing & Verification Skill (Anti-Mock & Full-Loop Protocol)

Use this skill whenever writing tests, verifying smart contracts, testing frontend data binding, or validating the full cross-chain event loop for OmniFlow.

---

## 1. The Anti-Mock "Fail-Fast" Iron Rule (BẢN ÁN CHO DUMMY DATA)

> ⚠️ **NỖI ĐAU DỰ ÁN TRƯỚC (DotNexus Post-Mortem):**  
> Việc sử dụng mock data fallback khi kết nối Backend/RPC chập chờn khiến UI lúc nào cũng hiển thị số liệu "hoàn hảo giả tạo", che giấu các lỗi nghiêm trọng ở tầng hợp đồng và khiến dự án bị đánh trượt tiêu chí **Execution** (0 điểm nếu không có giao dịch on-chain thật).

### Quy Tắc Cấm Tuyệt Đối (Zero Tolerance):
1. **Nghiêm cấm Silent Fallback trong `catch` blocks:**
   ```typescript
   // ❌ BỊ CẤM HOÀN TOÀN (ANTI-PATTERN):
   try {
     const balance = await vaultContract.getBalance();
   } catch (err) {
     return "1.25 ETH"; // CỰC KỲ NGUY HIỂM: Tạo ảo giác hệ thống đang chạy
   }

   // ✅ BẮT BUỘC (FAIL-FAST PATTERN):
   try {
     const balance = await vaultContract.getBalance();
   } catch (err) {
     setError("RPC_DISCONNECTED: Failed to read live vault balance");
     setBalance(null); // Hiển thị trạng thái lỗi hoặc spinner mất kết nối rõ ràng
   }
   ```
2. **Nghiêm cấm Fake Transaction Hashes:**
   * Tuyệt đối không dùng chuỗi hash giả dạng `0x1234...fake` hoặc `0xdeadbeef` trên giao diện UI hay bảng Activity Logs.
   * Mọi Tx Hash hiển thị trên UI bắt buộc phải được trả về từ RPC của Base Sepolia hoặc Reactive Lasna và có thể click mở trực tiếp trên Explorer thật.
3. **Trạng Thái Giao Diện Minh Bạch (Explicit Disconnected State):**
   * Nếu RPC bị rate-limit hoặc ngắt kết nối: Hiển thị banner cảnh báo đỏ `🔴 RPC DISCONNECTED - RETRYING IN 3s`, tuyệt đối không tự ý hiển thị số dư ảo.

---

## 2. Tháp Kiểm Thử 3 Tầng Cho Reactive Omni (The 3-Tier Test Pyramid)

```
        ┌────────────────────────────────────────────────────────┐
        │  TIER 3: E2E Live Data Assertion Script (Playwright)   │
        │  - Đối soát dữ liệu DOM với kết quả gọi eth_call thật  │
        ├────────────────────────────────────────────────────────┤
        │  TIER 2: Multi-Chain Full Loop Integration Harness     │
        │  - Origin Event -> Omni Consensus -> Callback Proxy    │
        │  - Bắt buộc ghi nhận 3 Tx Hashes thật & đo độ trễ ~1s  │
        ├────────────────────────────────────────────────────────┤
        │  TIER 1: Foundry Unit & Fork Tests (forge test -vvv)   │
        │  - Test toán học, slippage, in-flight guard, panic btn │
        └────────────────────────────────────────────────────────┘
```

---

## 3. Tier 1: Foundry Testing Suite (`contracts/test/`)

Chạy kiểm thử trước mọi commit mã nguồn:
```bash
cd contracts && forge test -vvv
```

### Các Kịch Bản Bắt Buộc Phải Test:
1. **`ActionVault.t.sol`:**
   * `test_CallbackOnlyFromProxy()`: Giả lập gọi `executeStopLoss` từ tài khoản lạ $\rightarrow$ Phải revert với lý do `Callback: caller is not service provider`.
   * `test_RSCAuthorization()`: Gọi từ Proxy nhưng `rscCaller != authorizedRSC` $\rightarrow$ Phải revert với `Unauthorized RSC caller`.
   * `test_LivePriceReValidation_RevertsOnBounce()`: Giả lập giá pool bật ngược lại lên trên ngưỡng cắt lỗ $\rightarrow$ Lệnh swap phải hủy an toàn (`emit OrderSkipped`).
   * `test_PanicButton_EmergencyWithdraw()`: Nạp 1 ETH vào Vault, gọi `emergencyWithdraw()` $\rightarrow$ Số dư Vault về 0, ví Owner tăng đúng 1 ETH.
2. **`StopLoss_Pipeline.t.sol`:**
   * `test_InFlightGuard_AntiSpam()`: Giả lập bắn 5 sự kiện `Sync` liên tục trong 1 giây $\rightarrow$ Chỉ phát sinh duy nhất **1 sự kiện `Callback`**, 4 sự kiện sau bị drop.
   * `test_CooldownEnforcement()`: Kiểm tra biến `cooldownSeconds`.

---

## 4. Tier 2: Kịch Bản Test Full-Loop Đa Chuỗi Tự Động (`test-full-loop.ts`)

Đây là **vũ khí tối thượng** để lấy điểm tuyệt đối từ Ban Giám Khảo Reactive Hackathon:

### Quy Trình Kích Hoạt Vòng Lặp Khép Kín:
Tạo kịch bản script độc lập tại `scripts/test-full-loop.ts`:

```typescript
import { ethers } from "ethers";

async function verifyFullLoop() {
  console.log("=== BẮT ĐẦU KIỂM THỬ VÒNG LẶP ON-CHAIN REACTIVEFLOW ===");

  // 1. Kết nối RPC thật của Base Sepolia và Reactive Lasna
  const baseProvider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL);
  const lasnaProvider = new ethers.JsonRpcProvider(process.env.LASNA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.TESTER_PRIVATE_KEY!, baseProvider);

  console.log(`[1/5] Kiểm tra ví: ${wallet.address}`);

  // 2. Kích hoạt Origin Event trên Base Sepolia
  console.log("[2/5] Thực hiện Swap trên Uniswap Base Sepolia để ép giá rớt...");
  const originTx = await dexRouter.swapExactETHForTokens(
    0, [WETH, USDC], wallet.address, Date.now() + 300,
    { value: ethers.parseEther("0.02") }
  );
  const originReceipt = await originTx.wait();
  console.log(`✅ [ORIGIN TX HASH]: ${originReceipt.hash} (Block #${originReceipt.blockNumber})`);
  const originTimestamp = Date.now();

  // 3. Lắng nghe Reactive Omni (Lasna Testnet)
  console.log("[3/5] Đang chờ Reactive Omni bắt event và thực thi react() qua CometBFT...");
  const reactiveTx = await waitForReactiveCallback(lasnaProvider, rscAddress, originReceipt.blockNumber);
  const latencyMs = Date.now() - originTimestamp;
  console.log(`✅ [REACTIVE TX HASH]: ${reactiveTx.hash} | Độ trễ đo được: ${latencyMs}ms (~${(latencyMs/1000).toFixed(2)}s)`);

  // 4. Lắng nghe Callback Proxy trên Base Sepolia
  console.log("[4/5] Đang chờ Callback Proxy gọi vào ActionVault trên Base Sepolia...");
  const callbackTx = await waitForVaultExecution(baseProvider, vaultAddress);
  console.log(`✅ [DESTINATION CALLBACK TX HASH]: ${callbackTx.hash}`);

  // 5. Đối soát tài sản thực tế
  console.log("[5/5] Đối soát số dư thực tế...");
  const usdcBalance = await usdcContract.balanceOf(wallet.address);
  console.log(`💰 Số dư USDC nhận về trong ví cá nhân: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

  // 6. Xuất báo cáo bằng chứng On-chain
  const evidence = {
    testDate: new Date().toISOString(),
    latencySeconds: (latencyMs / 1000).toFixed(2),
    origin: { chainId: 84532, txHash: originReceipt.hash },
    reactive: { chainId: 5318007, txHash: reactiveTx.hash },
    destination: { chainId: 84532, txHash: callbackTx.hash }
  };
  fs.writeFileSync("FULL_LOOP_EVIDENCE.json", JSON.stringify(evidence, null, 2));
  console.log("🎉 XÁC THỰC 100% ON-CHAIN THÀNH CÔNG! Đã lưu FULL_LOOP_EVIDENCE.json");
}
```

---

## 5. Tier 3: Đối Soát Giao Diện UI & Blockchain (E2E Assertions)

Khi viết script test frontend (ví dụ bằng Node.js script hoặc Playwright không qua loop MCP):
1. **Assert Data Integrity:**
   * So sánh số hiển thị trên thẻ card (ví dụ: `Vault Balance: 0.05 ETH`) với kết quả gọi hàm RPC thật `baseProvider.getBalance(vaultAddress)`.
   * Nếu có sai lệch $\rightarrow$ Báo lỗi `DATA_DESYNC_ERROR`.
2. **Assert Explorer Links:**
   * Kiểm tra thuộc tính `href` của các link giao dịch trên màn hình **Activity Logs**.
   * Link Lasna phải bắt đầu bằng: `https://lasna.reactscan.net/tx/0x...`
   * Link Base Sepolia phải bắt đầu bằng: `https://sepolia.basescan.org/tx/0x...`
   * Bất kỳ link nào chứa chuỗi `mock` hay `dummy` đều bị coi là vi phạm nghiêm trọng và trượt bài test.

---

## 6. Mẫu Báo Cáo Bằng Chứng On-Chain (`FULL_LOOP_EVIDENCE.json`)

Tệp này sẽ được nộp kèm bài thi để Ban Giám Khảo đối soát trực tiếp trên blockchain explorer:

```json
{
  "project": "OmniFlow",
  "track": "Set It and Forget It",
  "testExecutionTimestamp": "2026-11-20T14:30:00Z",
  "fullLoopMetrics": {
    "measuredLatencyMs": 1180,
    "blockTimeOmniSeconds": 1.05,
    "status": "VERIFIED_100%_ONCHAIN"
  },
  "verifiableTransactions": {
    "step1_originEvent": {
      "chain": "Base Sepolia (Chain ID: 84532)",
      "contract": "Uniswap V2 Pair (WETH/USDC)",
      "event": "Sync(reserve0, reserve1)",
      "txHash": "0x...",
      "explorerUrl": "https://sepolia.basescan.org/tx/0x..."
    },
    "step2_reactiveExecution": {
      "chain": "Reactive Omni Lasna Testnet (Chain ID: 5318007)",
      "contract": "StopLoss_Pipeline.sol",
      "method": "react(LogRecord calldata)",
      "txHash": "0x...",
      "explorerUrl": "https://lasna.reactscan.net/tx/0x..."
    },
    "step3_destinationCallback": {
      "chain": "Base Sepolia (Chain ID: 84532)",
      "contract": "ActionVault.sol",
      "method": "executeStopLoss(address,uint256,uint256)",
      "caller": "Reactive Callback Proxy",
      "txHash": "0x...",
      "explorerUrl": "https://sepolia.basescan.org/tx/0x..."
    }
  }
}
```

---

## 7. Checklist Tự Kiểm Tra Trước Khi Báo Cáo Hoàn Thành

- [ ] Toàn bộ hook đọc dữ liệu ở Frontend (`useVault`, `useActiveAutomations`) KHÔNG chứa bất kỳ dòng mock data hardcode nào trong `catch`.
- [ ] Giao diện hiển thị rõ trạng thái Loading / Disconnected khi ngắt kết nối mạng.
- [ ] Đã chạy `cd contracts && forge test -vvv` và đạt kết quả 100% PASS.
- [ ] Đã chạy `test-full-loop.ts` trên testnet thật và xuất ra tệp `FULL_LOOP_EVIDENCE.json`.
- [ ] Cả 3 Tx Hashes trong báo cáo có thể tìm thấy và hiển thị trạng thái `Success` trên Reactscan và Basescan.
