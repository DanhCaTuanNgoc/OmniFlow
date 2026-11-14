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
            actionVault
        );
    }

    function test_InitialParameters() public view {
        assertEq(pipeline.pairAddress(), pairAddress);
        assertEq(pipeline.priceThreshold(), priceThreshold);
        assertEq(pipeline.cooldownSeconds(), cooldownSeconds);
        assertEq(pipeline.percentToSwap(), percentToSwap);
        assertEq(pipeline.actionVault(), actionVault);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
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
    }

    function test_React_IgnoresPriceAboveThreshold() public {
        // Giá = 1900 USDC / 1 ETH > Ngưỡng 1800
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1900 ether));
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
    }

    function test_React_TriggersCallbackAndSetsTimestamp() public {
        // Giá = 1750 USDC / 1 ETH <= Ngưỡng 1800
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        vm.warp(1000); // Đặt thời gian block = 1000s
        pipeline.react(log);

        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
    }

    function test_React_StatelessCooldownProtectsAgainst200msBlocks() public {
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        // 1. Kích hoạt lần đầu tại t = 1000
        vm.warp(1000);
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);

        // 2. Block 200ms tiếp theo dội đến (t = 1001), điều kiện vẫn thỏa mãn
        vm.warp(1001);
        pipeline.react(log);
        // lastTriggeredTimestamp không đổi -> Bị chặn tức thì bởi Cooldown Guard!
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);

        // 3. Sau khi hết 300 giây cooldown (t = 1301)
        vm.warp(1301);
        pipeline.react(log);
        // Tự động mở lại cho chu kỳ tiếp theo không bị Deadlock!
        assertEq(pipeline.lastTriggeredTimestamp(), 1301);
    }
}
