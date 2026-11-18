// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';

/**
 * @title StopLoss_Pipeline
 * @notice Bộ não điều phối tự động hóa chạy trên Reactive Omni (Lasna Testnet)
 * @dev Tận dụng Instant Finality block ~1s để phát hiện rủi ro và bắn callback tức thời.
 *      Hỗ trợ Stateful Anti-Wick Counter, Anchored Sliding Window (Price Velocity) và Dynamic Origin Chain.
 */
contract StopLoss_Pipeline is IReactive, AbstractReactive {
    uint256 public constant DEFAULT_ORIGIN_CHAIN_ID = 84532; // Base Sepolia
    uint256 public constant SYNC_TOPIC = 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1;

    uint256 public immutable originChainId;
    uint256 public immutable originTopic0;
    address public immutable pairAddress;
    uint256 public immutable priceThreshold; // Đơn vị: 1e18
    uint256 public immutable cooldownSeconds;
    uint256 public immutable percentToSwap;
    address public immutable actionVault;

    // Stateful Anti-Wick Counter (chống giật râu nến qua N blocks)
    uint256 public consecutiveHits;
    uint256 public immutable requiredHits;

    // Price Velocity Guard (Anchored Sliding Window)
    uint256 public windowStartPrice;
    uint256 public windowStartTime;
    uint256 public immutable velocityThresholdBps; // % drop * 100 (e.g. 500 = 5%)
    uint256 public immutable windowSeconds;

    // Internal Gas Estimator & Stateless Cooldown Guard
    uint256 public callbacksEmitted;
    uint256 public lastTriggeredTimestamp;

    event ConditionTriggered(uint256 currentPrice, uint256 blockTime);

    constructor(
        address _pairAddress,
        uint256 _priceThreshold,
        uint256 _cooldownSeconds,
        uint256 _percentToSwap,
        address _actionVault,
        uint256 _requiredHits,
        uint256 _velocityThresholdBps,
        uint256 _windowSeconds,
        uint256 _originChainId,
        uint256 _originTopic0
    ) payable {
        require(_pairAddress != address(0), "Invalid pair");
        require(_actionVault != address(0), "Invalid vault");

        pairAddress = _pairAddress;
        priceThreshold = _priceThreshold;
        cooldownSeconds = _cooldownSeconds;
        percentToSwap = _percentToSwap;
        actionVault = _actionVault;

        requiredHits = _requiredHits > 0 ? _requiredHits : 1;
        velocityThresholdBps = _velocityThresholdBps;
        windowSeconds = _windowSeconds;
        originChainId = _originChainId > 0 ? _originChainId : DEFAULT_ORIGIN_CHAIN_ID;
        originTopic0 = _originTopic0 != 0 ? _originTopic0 : SYNC_TOPIC;

        // Đăng ký event subscription với Reactive System Contract khi deploy on-chain (!vm)
        if (!vm && address(service) != address(0)) {
            service.subscribe(
                originChainId,
                _pairAddress,
                originTopic0,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    // Tương thích cả Reactive Omni (CometBFT) lẫn Legacy ReactVM
    function react(LogRecord calldata log) external {
        if (log._contract != pairAddress) return;
        if (log.topic_0 != 0 && log.topic_0 != originTopic0) return;

        // PATTERN 2: STATELESS TIMESTAMP COOLDOWN (CHỐNG DỘI BLOCK 200MS & ZERO-DEADLOCK)
        if (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldownSeconds) return;

        // Giải mã reserve0 và reserve1 từ event Sync
        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        if (reserve0 == 0) return;

        // Tỷ giá hiện tại chuẩn 18 decimals: (reserve1 * 1e18) / reserve0
        uint256 currentPrice = (uint256(reserve1) * 1e18) / uint256(reserve0);

        bool triggerConditionMet = false;
        bool isCrossChainOrVelocity = (originChainId != DEFAULT_ORIGIN_CHAIN_ID);

        // 1. PRICE VELOCITY GUARD: Anchored Sliding Window
        if (velocityThresholdBps > 0 && windowSeconds > 0) {
            if (windowStartTime == 0 || (block.timestamp - windowStartTime >= windowSeconds)) {
                windowStartPrice = currentPrice;
                windowStartTime = block.timestamp;
            } else {
                if (windowStartPrice > currentPrice) {
                    uint256 dropBps = ((windowStartPrice - currentPrice) * 10000) / windowStartPrice;
                    if (dropBps >= velocityThresholdBps) {
                        triggerConditionMet = true;
                        isCrossChainOrVelocity = true;
                    }
                }
            }
        }

        // 2. STATEFUL ANTI-WICK CONFIRMATION: Ngưỡng giá tĩnh kết hợp bộ đếm liên tục
        if (priceThreshold > 0) {
            if (currentPrice <= priceThreshold) {
                consecutiveHits++;
                if (consecutiveHits >= requiredHits) {
                    triggerConditionMet = true;
                }
            } else {
                // Giá phục hồi trên ngưỡng -> reset ngay lập tức về 0 để triệt tiêu râu nến giật
                consecutiveHits = 0;
            }
        }

        if (!triggerConditionMet) return;

        // Cập nhật timestamp, reset hits và tăng biến đếm gas an toàn
        lastTriggeredTimestamp = block.timestamp;
        consecutiveHits = 0;
        callbacksEmitted++;

        emit ConditionTriggered(currentPrice, block.timestamp);

        // ĐẶC TẢ PAYLOAD REACTIVE (TWO-SLOT PAYLOAD):
        // Slot 1 (address(0)): Sẽ tự động bị Reactive Callback Proxy ghi đè thành RVM ID
        // Slot 2 (address(this)): Địa chỉ thực sự của hợp đồng RSC StopLoss_Pipeline trên Lasna
        // Nếu là Cross-chain hoặc Velocity trigger, truyền type(uint256).max để ActionVault bypass check giá tĩnh
        uint256 passedThreshold = isCrossChainOrVelocity ? type(uint256).max : priceThreshold;

        bytes memory payload = abi.encodeWithSignature(
            "executeStopLoss(address,address,uint256,uint256)",
            address(0),
            address(this),
            percentToSwap,
            passedThreshold
        );

        // Phát ra Callback hướng tới Base Sepolia (Chain ID 84532)
        // 1. Chuẩn Event (Legacy & Hybrid Relayer)
        emit Callback(
            DEFAULT_ORIGIN_CHAIN_ID, // Callback đích luôn thực thi trên ActionVault ở Base Sepolia
            actionVault,
            350000, // Gas limit đủ cho Uniswap swap
            payload
        );

        // 2. Chuẩn System Contract Call (Reactive Omni Direct System Request)
        (bool s1, ) = address(0x8888888888888888888888888888888888888888).call(
            abi.encodeWithSignature(
                "requestCallbackV_1_0((uint256,address,uint64,bytes))",
                DEFAULT_ORIGIN_CHAIN_ID,
                actionVault,
                uint64(350000),
                payload
            )
        );
        if (!s1 && address(service) != address(0)) {
            address(service).call(
                abi.encodeWithSignature(
                    "requestCallbackV_1_0((uint256,address,uint64,bytes))",
                    DEFAULT_ORIGIN_CHAIN_ID,
                    actionVault,
                    uint64(350000),
                    payload
                )
            );
        }
    }
}
