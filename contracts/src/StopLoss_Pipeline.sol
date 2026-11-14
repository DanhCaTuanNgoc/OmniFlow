// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';

/**
 * @title StopLoss_Pipeline
 * @notice Bộ não điều phối tự động hóa chạy trên Reactive Omni (Lasna Testnet)
 * @dev Tận dụng Instant Finality block ~1s để phát hiện rủi ro và bắn callback tức thời.
 */
contract StopLoss_Pipeline is IReactive, AbstractReactive {
    uint256 public constant ORIGIN_CHAIN_ID = 84532; // Base Sepolia
    uint256 private constant SYNC_TOPIC = 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1;

    address public immutable pairAddress;
    uint256 public immutable priceThreshold; // Đơn vị: 1e18
    uint256 public immutable cooldownSeconds;
    uint256 public immutable percentToSwap;
    address public immutable actionVault;

    uint256 public lastTriggeredTimestamp; // STATELESS COOLDOWN GUARD (CHỐNG DỘI BLOCK & CHỐNG DEADLOCK)

    event ConditionTriggered(uint256 currentPrice, uint256 blockTime);

    constructor(
        address _pairAddress,
        uint256 _priceThreshold,
        uint256 _cooldownSeconds,
        uint256 _percentToSwap,
        address _actionVault
    ) payable {
        require(_pairAddress != address(0), "Invalid pair");
        require(_actionVault != address(0), "Invalid vault");
        pairAddress = _pairAddress;
        priceThreshold = _priceThreshold;
        cooldownSeconds = _cooldownSeconds;
        percentToSwap = _percentToSwap;
        actionVault = _actionVault;

        // BẢO VỆ MÔI TRƯỜNG REACTVM: Chỉ đăng ký subscription khi ở Top-level deployer (!vm)
        if (!vm) {
            service.subscribe(
                ORIGIN_CHAIN_ID,
                _pairAddress,
                SYNC_TOPIC,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        if (log._contract != pairAddress) return;

        // PATTERN 2: STATELESS TIMESTAMP COOLDOWN (CHỐNG DỘI BLOCK 200MS & ZERO-DEADLOCK)
        // Miễn nhiễm 100% với các block 200ms trong thời gian cooldownSeconds, và tự động mở lại cho chu kỳ tiếp theo!
        if (block.timestamp - lastTriggeredTimestamp < cooldownSeconds) return;

        // Giải mã reserve0 và reserve1 từ event Sync
        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        if (reserve0 == 0) return;

        // Tỷ giá hiện tại chuẩn 18 decimals: (reserve1 * 1e18) / reserve0
        // (Áp dụng với pool MockWETH 18 decimals / MockUSDC 18 decimals trên Base Sepolia)
        uint256 currentPrice = (uint256(reserve1) * 1e18) / uint256(reserve0);

        // Kiểm tra điều kiện: Giá có rớt xuống dưới hoặc bằng ngưỡng bảo vệ không?
        if (currentPrice > priceThreshold) return;

        // Cập nhật timestamp ngay lập tức để block toàn bộ các sự kiện 200ms tiếp theo
        lastTriggeredTimestamp = block.timestamp;
        emit ConditionTriggered(currentPrice, block.timestamp);

        // ĐẶC TẢ PAYLOAD REACTIVE (TWO-SLOT PAYLOAD):
        // Slot 1 (address(0)): Sẽ tự động bị Reactive Callback Proxy ghi đè thành RVM ID (địa chỉ ví deployer)
        // Slot 2 (address(this)): Địa chỉ thực sự của hợp đồng RSC StopLoss_Pipeline trên Lasna
        bytes memory payload = abi.encodeWithSignature(
            "executeStopLoss(address,address,uint256,uint256)",
            address(0),
            address(this),
            percentToSwap,
            priceThreshold
        );

        // Phát ra Callback hướng tới Base Sepolia
        emit Callback(
            ORIGIN_CHAIN_ID,
            actionVault,
            350000, // Gas limit đủ cho Uniswap swap
            payload
        );
    }
}
