// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import 'forge-std/Test.sol';
import '../src/StopLoss_Pipeline.sol';

contract StopLoss_PipelineTest is Test {
    StopLoss_Pipeline public pipeline;

    address public pairAddress = address(0xAAAA);
    address public actionVault = address(0xBBBB);
    uint256 public priceThreshold = 1800 ether;
    uint256 public cooldownSeconds = 300; // Five-minute cooldown.
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
        // The price of 1,900 USDC per ETH exceeds the 1,800 threshold.
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1900 ether));
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 0);
        assertEq(pipeline.callbacksEmitted(), 0);
    }

    function test_React_TriggersCallbackAndSetsTimestamp() public {
        // The price of 1,750 USDC per ETH is below the 1,800 threshold.
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        vm.warp(1000); // Set the block timestamp to 1,000 seconds.
        pipeline.react(log);

        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);
    }

    function test_React_StatelessCooldownProtectsAgainst200msBlocks() public {
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));

        // 1. Trigger the first callback at t = 1000.
        vm.warp(1000);
        pipeline.react(log);
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);

        // 2. The next event arrives at t = 1001 while the price condition still holds.
        vm.warp(1001);
        pipeline.react(log);
        // The cooldown blocks the callback and preserves lastTriggeredTimestamp.
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
        assertEq(pipeline.callbacksEmitted(), 1);

        // 3. Wait for the 300-second cooldown to elapse at t = 1301.
        vm.warp(1301);
        pipeline.react(log);
        // The next cycle can trigger automatically.
        assertEq(pipeline.lastTriggeredTimestamp(), 1301);
        assertEq(pipeline.callbacksEmitted(), 2);
    }

    function test_React_StatefulAntiWick_RequiresConsecutiveBlocks() public {
        // Require three consecutive price hits to filter a brief dip.
        StopLoss_Pipeline antiWickPipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            3, // Require three consecutive hits.
            0,
            0,
            84532,
            0
        );

        IReactive.LogRecord memory dropLog = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        IReactive.LogRecord memory bounceLog = createLog(pairAddress, uint112(1 ether), uint112(1850 ether));

        vm.warp(100);
        // Hit 1: The price drops below 1,800.
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 1);
        assertEq(antiWickPipeline.callbacksEmitted(), 0); // The first hit does not emit a callback.

        // Hit 2: The price stays below 1,800.
        vm.warp(101);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 2);
        assertEq(antiWickPipeline.callbacksEmitted(), 0);

        // A rebound to 1,850 resets the hit counter to zero.
        vm.warp(102);
        antiWickPipeline.react(bounceLog);
        assertEq(antiWickPipeline.consecutiveHits(), 0);
        assertEq(antiWickPipeline.callbacksEmitted(), 0);

        // Start a new sequence of three consecutive hits.
        vm.warp(103);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 1);

        vm.warp(104);
        antiWickPipeline.react(dropLog);
        assertEq(antiWickPipeline.consecutiveHits(), 2);

        vm.warp(105);
        antiWickPipeline.react(dropLog); // The third hit meets the trigger condition.
        assertEq(antiWickPipeline.callbacksEmitted(), 1);
        assertEq(antiWickPipeline.lastTriggeredTimestamp(), 105);
        assertEq(antiWickPipeline.consecutiveHits(), 0);
    }

    function test_React_PriceVelocityGuard_TriggersOnFastDrop() public {
        // Configure the velocity trigger for a drop of at least 5% (500 basis points) within 60 seconds.
        StopLoss_Pipeline velocityPipeline = new StopLoss_Pipeline(
            pairAddress,
            1500 ether, // Set the static threshold low enough that only the velocity rule can trigger this test.
            cooldownSeconds,
            percentToSwap,
            actionVault,
            1,
            500, // 5% drop
            60,  // trong 60s
            84532,
            0
        );

        // At t = 100, anchor the window at $2,000.
        vm.warp(100);
        IReactive.LogRecord memory initialLog = createLog(pairAddress, uint112(1 ether), uint112(2000 ether));
        velocityPipeline.react(initialLog);
        assertEq(velocityPipeline.windowStartPrice(), 2000 ether);
        assertEq(velocityPipeline.windowStartTime(), 100);
        assertEq(velocityPipeline.callbacksEmitted(), 0);

        // At t = 120, the price falls to $1,880, a 6% drop within the 60-second window.
        vm.warp(120);
        IReactive.LogRecord memory dropLog = createLog(pairAddress, uint112(1 ether), uint112(1880 ether));
        velocityPipeline.react(dropLog);

        // The velocity rule triggers a callback.
        assertEq(velocityPipeline.callbacksEmitted(), 1);
        assertEq(velocityPipeline.lastTriggeredTimestamp(), 120);
    }

    function test_React_CrossChainOrigin_Configuration() public {
        // Check the cross-chain configuration for Unichain Sepolia (1301).
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

        // Trigger a callback from the Unichain event.
        vm.warp(500);
        IReactive.LogRecord memory log = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        crossChainPipeline.react(log);

        assertEq(crossChainPipeline.callbacksEmitted(), 1);
        assertEq(crossChainPipeline.lastTriggeredTimestamp(), 500);
    }

    function test_React_Scenario_FlashWick_Rejection_And_Recovery() public {
        // Require two consecutive hits to filter brief price dips.
        StopLoss_Pipeline antiWickPipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            2, // Require two consecutive hits.
            0,
            0,
            84532,
            0
        );

        // Block 101: The price briefly drops to $1,750 for the first hit.
        IReactive.LogRecord memory wickLog = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        antiWickPipeline.react(wickLog);
        assertEq(antiWickPipeline.consecutiveHits(), 1);
        assertEq(antiWickPipeline.callbacksEmitted(), 0); // The first hit does not trigger a callback.

        // Block 102: The price rebounds to $1,900.
        IReactive.LogRecord memory recoveryLog = createLog(pairAddress, uint112(1 ether), uint112(1900 ether));
        antiWickPipeline.react(recoveryLog);
        assertEq(antiWickPipeline.consecutiveHits(), 0); // The rebound resets the hit counter to zero.
        assertEq(antiWickPipeline.callbacksEmitted(), 0); // The brief dip produces no callback.
    }

    function test_React_Scenario_Storm_10SwapsIn2Seconds_Only1Callback() public {
        vm.warp(1000);
        // The first transaction triggers a callback.
        IReactive.LogRecord memory log1 = createLog(pairAddress, uint112(1 ether), uint112(1750 ether));
        pipeline.react(log1);
        assertEq(pipeline.callbacksEmitted(), 1);

        // Submit nine more events in a burst between t = 1000 and t = 1002.
        for (uint256 i = 0; i < 9; i++) {
            vm.warp(1000 + (i / 4)); // Approximate rapid Base Sepolia block timing.
            IReactive.LogRecord memory spamLog = createLog(pairAddress, uint112(1 ether), uint112(1740 ether));
            pipeline.react(spamLog);
        }

        // The cooldown blocks all nine subsequent callbacks.
        assertEq(pipeline.callbacksEmitted(), 1);
        assertEq(pipeline.lastTriggeredTimestamp(), 1000);
    }

    function test_React_Scenario_CrossChain_Topic0_Filter() public {
        uint256 customTopic = uint256(keccak256("CustomSwapEvent(address,uint256)"));
        StopLoss_Pipeline topicPipeline = new StopLoss_Pipeline(
            pairAddress,
            priceThreshold,
            cooldownSeconds,
            percentToSwap,
            actionVault,
            1,
            0,
            0,
            1301,
            customTopic
        );

        assertEq(topicPipeline.originTopic0(), customTopic);

        // Send a log with the wrong topic0.
        IReactive.LogRecord memory wrongTopicLog = IReactive.LogRecord({
            chain_id: 1301,
            _contract: pairAddress,
            topic_0: uint256(keccak256("WrongEvent()")),
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: abi.encode(uint112(1 ether), uint112(1700 ether)),
            block_number: 100,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });
        topicPipeline.react(wrongTopicLog);
        assertEq(topicPipeline.callbacksEmitted(), 0); // The topic filter blocks the callback.

        // Send a log with the configured topic0.
        IReactive.LogRecord memory correctTopicLog = IReactive.LogRecord({
            chain_id: 1301,
            _contract: pairAddress,
            topic_0: customTopic,
            topic_1: 0,
            topic_2: 0,
            topic_3: 0,
            data: abi.encode(uint112(1 ether), uint112(1700 ether)),
            block_number: 101,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });
        topicPipeline.react(correctTopicLog);
        assertEq(topicPipeline.callbacksEmitted(), 1); // The matching log triggers a callback.
    }

    function test_React_Scenario_MultipleCooldownCycles() public {
        // Cycle 1: Trigger at t = 100.
        vm.warp(100);
        pipeline.react(createLog(pairAddress, uint112(1 ether), uint112(1700 ether)));
        assertEq(pipeline.callbacksEmitted(), 1);

        // At t = 200, the 300-second cooldown still blocks the callback.
        vm.warp(200);
        pipeline.react(createLog(pairAddress, uint112(1 ether), uint112(1650 ether)));
        assertEq(pipeline.callbacksEmitted(), 1);

        // Cycle 2: The next callback triggers at t = 450, after the cooldown.
        vm.warp(450);
        pipeline.react(createLog(pairAddress, uint112(1 ether), uint112(1600 ether)));
        assertEq(pipeline.callbacksEmitted(), 2);
        assertEq(pipeline.lastTriggeredTimestamp(), 450);
    }
}
