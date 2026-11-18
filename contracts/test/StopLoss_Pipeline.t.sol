// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import 'forge-std/Test.sol';
import '../src/StopLoss_Pipeline.sol';

contract StopLoss_PipelineTest is Test {
    StopLoss_Pipeline public pipeline;

    address public pairAddress = address(0xAAAA);
    address public actionVault = address(0xBBBB);
    uint256 public priceThreshold = 1800 ether;
    uint256 public cooldownSeconds = 300; // 5 phút
    uint256 public percentToSwap = 50;

    function setUp() public {
        pipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            1, // requiredHits default
            0, // velocityThresholdBps default
            0, // windowSeconds default
            84532, // originChainId (Base Sepolia)
            0  // originTopic0 (SYNC_TOPIC default)
        );
    }

    function test_InitialParameters() public view {
        assertEq(pipeline.pairAddress(), pairAddress);
        assertEq(pipeline.priceThreshold(), priceThreshold);
        assertEq(pipeline.cooldownSeconds(), cooldownSeconds);
        assertEq(pipeline.percentToSwap(), percentToSwap);
        assertEq(pipeline.actionVault(), actionVault);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
        assertEq(pipeline.requiredHits(), 1);
        assertEq(pipeline.consecutiveHits(), 0);
        assertEq(pipeline.callbacksEmitted(), 0);
        assertEq(pipeline.originChainId(), 84532);
    }

    function createLog(address emitter, uint112 reserve0, uint112 reserve1) internal pure returns (IReactive.LogRecord memory) {
        return IReactive.LogRecord({
            chain_id: 84532,
            _contract: emitter,
            topic_0: 0,
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: abi.encode(reserve0, reserve1),
            block_number: 100,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });
    }

    function test_React_IgnoresWrongContract() public {
        IReactive.LogRecord memory log = createLog(address(0xDEAD), uint112(1 ether), uint112(1700 ether));
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
        assertEq(pipeline.callbacksEmitted(), 0);
    }

    function test_React_IgnoresPriceAboveThreshold() public {
        // Giá = 1900 USDC / 1 ETH > Ngưỡng 1800
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1900 ether));
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
        assertEq(pipeline.callbacksEmitted(), 0);
    }

    function test_React_TriggersCallbackAndSetsTimestamp() public {
        // Giá = 1750 USDC / 1 ETH <= Ngưỡng 1800
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        vm.warp(1000); // Đặt thời gian block = 1000s
        pipeline.react(log);

        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);
    }

    function test_React_StatelessCooldownProtectsAgainst200msBlocks() public {
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        // 1. Kích hoạt lần đầu tại t = 1000
        vm.warp(1000);
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);

        // 2. Block 200ms tiếp theo dội đến (t = 1001), điều kiện vẫn thỏa mãn
        vm.warp(1001);
        pipeline.react(log);
        // lastTriggeredTimestamp không đổi -> Bị chặn tức thì bởi Cooldown Guard!
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);

        // 3. Sau khi hết 300 giây cooldown (t = 1301)
        vm.warp(1301);
        pipeline.react(log);
        // Tự động mở lại cho chu kỳ tiếp theo không bị Deadlock!
        assertEq(pipeline.lastTriggeredTimestamp(), 1301);
        assertEq(pipeline.callbacksEmitted(), 2);
    }

    function test_React_StatefulAntiWick_RequiresConsecutiveBlocks() public {
        // Khởi tạo pipeline với requiredHits = 3 (chống giật râu nến qua 3 block liên tiếp)
        StopLoss_Pipeline antiWickPipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            3, // Cần 3 hits liên tục
            0,
            0,
            84532,
            0
        );

        IReactive.LogRecord memory dropLog = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        IReactive.LogRecord memory bounceLog = createLog(pairAddress, uint112(1 ether), uint112(1850 ether));

        vm.warp(100);
        // Hit 1: Giá giảm dưới 1800
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 1);
        assertEq(antiWickPipeline.callbacksEmitted(), 0); // Chưa đủ 3 hits -> chưa emit callback!

        // Hit 2: Giá tiếp tục dưới 1800
        vm.warp(101);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 2);
        assertEq(antiWickPipeline.callbacksEmitted(), 0);

        // Flash Wick: Giá hồi lên 1850 trong 1 block -> Phải reset ngay về 0!
        vm.warp(102);
        antiWickPipeline.react(bounceLog);
        assertEq(antiWickPipeline.consecutiveHits(), 0);
        assertEq(antiWickPipeline.callbacksEmitted(), 0);

        // Bắt đầu chuỗi 3 hits thật sự
        vm.warp(103);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 1);

        vm.warp(104);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 2);

        vm.warp(105);
        antiWickPipeline.react(dropLog); // Hit thứ 3 thỏa mãn!
        assertEq(antiWickPipeline.callbacksEmitted(), 1);
        assertEq(antiWickPipeline.lastTriggeredTimestamp(), 105);
        assertEq(antiWickPipeline.consecutiveHits(), 0);
    }

    function test_React_PriceVelocityGuard_TriggersOnFastDrop() public {
        // Khởi tạo pipeline theo dõi Price Velocity: Giảm >= 5% (500 bps) trong vòng 60 giây
        StopLoss_Pipeline velocityPipeline = new StopLoss_Pipeline(
            pairAddress,
            1500 ether, // priceThreshold rất thấp (1500) để đảm bảo không trigger bằng threshold tĩnh
            cooldownSeconds,
            percentToSwap,
            actionVault,
            1,
            500, // 5% drop
            60,  // trong 60s
            84532,
            0
        );

        // t = 100: Giá ban đầu $2,000 (neo windowStartPrice = $2,000)
        vm.warp(100);
        IReactive.LogRecord memory initialLog = createLog(pairAddress, uint112(1 ether), uint112(2000 ether));
        velocityPipeline.react(initialLog);
        assertEq(velocityPipeline.windowStartPrice(), 2000 ether);
        assertEq(velocityPipeline.windowStartTime(), 100);
        assertEq(velocityPipeline.callbacksEmitted(), 0);

        // t = 120 (trong vòng 60s): Giá giảm xuống $1,880 (sụt 6% > 5% threshold)
        vm.warp(120);
        IReactive.LogRecord memory dropLog = createLog(pairAddress, uint112(1 ether), uint112(1880 ether));
        velocityPipeline.react(dropLog);

        // Price Velocity kích hoạt thành công!
        assertEq(velocityPipeline.callbacksEmitted(), 1);
        assertEq(velocityPipeline.lastTriggeredTimestamp(), 120);
    }

    function test_React_CrossChainOrigin_Configuration() public {
        // Kiểm tra cấu hình Cross-Chain (Unichain Sepolia 1301)
        StopLoss_Pipeline crossChainPipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            1,
            0,
            0,
            1301, // Unichain Sepolia
            0
        );

        assertEq(crossChainPipeline.originChainId(), 1301);

        // Kích hoạt callback từ Unichain
        vm.warp(500);
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        crossChainPipeline.react(log);

        assertEq(crossChainPipeline.callbacksEmitted(), 1);
        assertEq(crossChainPipeline.lastTriggeredTimestamp(), 500);
    }
}
