---
name: reactive-contracts
description: Engineering standards, security patterns, and testing guidelines for Reactive Smart Contracts (RSC) on Reactive Omni and Callback Vaults on Base Sepolia using Foundry.
---

# Reactive Contracts & Cross-Chain Security Skill

Use this skill whenever authoring, modifying, testing, or auditing smart contracts in the `contracts/` directory of OmniFlow.

---

## 1. Network Topology & Core Addresses

* **Origin / Destination Chain:** Base Sepolia (`Chain ID: 84532`)
  * Block time: **200ms** (Denim upgrade). Use `block.timestamp` rather than block counts for cooldowns and timers.
* **Reactive Core Chain:** Reactive Omni Lasna Testnet (`Chain ID: 5318007`)
  * Block time: **~1s** with Instant Finality (CometBFT consensus).
* **Official System Addresses:**
  * Reactive System Contract: `0x0000000000000000000000000000000000fffFfF`
  * Official Callback Proxy: Official Reactive Network Callback Proxy deployed on Base Sepolia.

---

## 2. Core Smart Contract Architecture

### A. Reactive Smart Contract (RSC) on Reactive Lasna
* **Inheritance:** Must inherit `IReactive` and `AbstractReactive` from `@reactive-network/reactive-lib`.
* **Subscription:** Call `service.subscribe(chainId, originContract, topic0, topic1, topic2, topic3)` in constructor.
  * Use `REACTIVE_IGNORE` (`0xa65f96fc951c3fa459f6b604ca206e910659a200aa377370725c5a4ea33d0229`) for unindexed topics.
* **Execution Function (`react`):**
  * MUST be protected with `vmOnly` modifier.
  * MUST verify origin contract: `if (log._contract != expectedPair) return;`.
  * MUST decode `LogRecord calldata log`: e.g. `(uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));`.
  * Calculate mathematically using 18 decimals precision: `currentPrice = (uint256(reserve1) * 1e18) / uint256(reserve0)`.
* **Callback Emission:**
  * Use `emit Callback(destChainId, targetContract, gasLimit, payload);`.
  * Always provide sufficient gas limit (e.g. 350,000 for DEX router swaps).

### B. Destination Contract (`ActionVault.sol`) on Base Sepolia
* **Inheritance:** Must inherit `AbstractCallback` from `@reactive-network/reactive-lib/src/abstract-sdk/AbstractCallback.sol`.
* **Authentication:**
  * The callback function MUST use the `callback(address rscCaller)` modifier.
  * Inside the function, MUST enforce:
    ```solidity
    require(rscCaller == authorizedRSC, "Unauthorized RSC caller");
    ```
* **Asset Custody & Panic Button:**
  * The user is the permanent `owner`.
  * MUST implement `emergencyWithdraw()` without any external dependency:
    ```solidity
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Zero balance");
        payable(owner).transfer(balance);
        emit EmergencyWithdrawn(owner, balance);
    }
    ```
* **Post-Swap Settlement:**
  * When executing DEX swaps, the destination token (e.g. USDC) MUST be routed directly to the `owner`'s wallet address (`to = owner`), NOT kept inside the Vault.

---

## 3. The 4 Defensive Engineering Patterns (MANDATORY)

1. **Callback Proxy Authentication Pattern:**
   * Never assume `msg.sender` on Base Sepolia is the RSC contract address.
   * `msg.sender` is ALWAYS the official Reactive Callback Proxy. The RSC address is injected as parameter `rscCaller`.
2. **In-Flight Callback Protection Pattern (Anti-Burst 200ms):**
   * Base Sepolia produces blocks every 200ms. In high volatility, 5–10 `Sync` events can fire within 1 second.
   * The RSC MUST use `bool public isCallbackInFlight` to immediately drop subsequent events while a callback is pending, preventing gas depletion.
3. **Live Price Re-Validation Pattern (Anti-Stale Trigger):**
   * Before executing the swap in `ActionVault`, re-query the pool reserves at execution time.
   * If the market has already rebounded above the stop-loss threshold, skip the swap cleanly with `emit OrderSkipped(...)`.
   * Enforce `minAmountOut = (expectedOut * (10000 - maxSlippageBps)) / 10000` to prevent MEV sandwich exploitation.
4. **Dual-Way Event State Synchronization:**
   * Keep RSC and Vault state aligned purely via event emissions (`StopLossExecuted`, `OrderSkipped`), eliminating the need for centralized off-chain keepers.

---

## 4. Foundry Testing Standards

* Run test suites with full verbosity:
  ```bash
  cd contracts && forge test -vvv
  ```
* Every test suite must verify:
  1. Unit tests: Math calculations, slippage formulas, parameter bounds.
  2. Access control: Unauthorized callers attempting `executeStopLoss` or `emergencyWithdraw` must revert.
  3. Re-entrancy and state reset: Verify `isCallbackInFlight` reset logic.
  4. Fork tests: Fork Base Sepolia at a specific block number, simulate liquidity pool swaps, and assert correct token balances.
