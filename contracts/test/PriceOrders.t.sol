// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {Test} from 'forge-std/Test.sol';
import {Vm} from 'forge-std/Vm.sol';
import {IReactive} from '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import {IOmniCallbackSystem} from '../src/StopLoss_Pipeline.sol';
import {PriceOrderPipeline} from '../src/PriceOrderPipeline.sol';
import {PriceGatePipeline} from '../src/PriceGatePipeline.sol';
import {PriceOrderVault, PriceOrderMode, PriceOrder, GateOrder} from '../src/PriceOrderVault.sol';
import {IUniswapV2Router02} from '../src/ActionVault.sol';
import {MockWETH} from '../src/mocks/MockWETH.sol';
import {MockUSDC} from '../src/mocks/MockUSDC.sol';
import {MockUniswapV2Pair} from '../src/mocks/MockUniswapV2Pair.sol';
import {MockUniswapV2Router} from '../src/mocks/MockUniswapV2Router.sol';

contract OmniRecorder {
    uint256 public subscriptions;
    uint256 public requests;
    bytes public lastPayload;

    function subscribe(uint256, address, uint256, uint256, uint256, uint256) external {
        ++subscriptions;
    }

    function requestCallbackV_1_0(IOmniCallbackSystem.Configuration calldata config) external {
        require(config.chainId == 84532 && config.gasLimit == 350_000, "Unexpected callback route");
        ++requests;
        lastPayload = config.payload;
    }
}

interface IPriceOrderVaultEvents {
    event OrderSkipped(string reason, uint256 currentPrice);
}

contract PriceOrdersTest is Test {
    address private constant SYSTEM = 0x8888888888888888888888888888888888888888;
    address private constant PROXY = address(0xB453);
    uint256 private constant SYNC = uint256(keccak256("Sync(uint112,uint112)"));
    OmniRecorder private omni;
    MockUSDC private quote;
    MockUniswapV2Pair private pool;
    MockUniswapV2Pair private confirmation;
    MockUniswapV2Router private router;
    PriceOrderVault private vault;

    function setUp() public {
        vm.etch(SYSTEM, address(new OmniRecorder()).code);
        omni = OmniRecorder(SYSTEM);
        MockWETH weth = new MockWETH();
        quote = new MockUSDC();
        pool = new MockUniswapV2Pair(address(weth), address(quote));
        confirmation = new MockUniswapV2Pair(address(weth), address(quote));
        router = new MockUniswapV2Router(address(weth), address(pool));
        vault = new PriceOrderVault(PROXY, address(0xBEEF), address(router), address(quote), address(pool));
        vm.deal(address(vault), 1 ether);
        vm.warp(1000);
    }

    function _pipeline(PriceOrderMode mode) private returns (PriceOrderPipeline) {
        bool hedge = mode == PriceOrderMode.CrossChainHedge;
        return new PriceOrderPipeline(PriceOrderPipeline.Config({
            originPool: address(pool), vault: address(vault), originChainId: hedge ? 1301 : 84532, mode: mode,
            threshold: hedge ? 0 : mode == PriceOrderMode.TakeProfit ? 2800 ether : 1800 ether,
            percent: mode == PriceOrderMode.Ladder ? uint16(0) : uint16(50),
            cooldown: 10, dropBps: hedge ? uint16(500) : uint16(0), windowSeconds: hedge ? uint32(10) : uint32(0)
        }));
    }

    function _log(address emitter, uint256 chain, uint256 serial, uint112 price)
        private pure returns (IReactive.LogRecord memory)
    {
        return IReactive.LogRecord(chain, emitter, SYNC, 0, 0, 0, abi.encode(uint112(1 ether), price),
            serial, 3, serial, serial, 0);
    }

    function _authorizePriceOrder(PriceOrderPipeline rsc) private {
        vault.registerRSC(address(rsc));
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(rsc.mode(), uint8(rsc.percent()), rsc.threshold()));
        vault.setAuthorizedRSC(address(rsc), true);
    }

    function _observe(IReactive pipeline, address emitter, uint256 chain, uint256 serial, uint112 price) private {
        vm.prank(SYSTEM);
        pipeline.react(_log(emitter, chain, serial, price));
    }

    function _deliver(address rsc) private {
        bytes memory request = omni.lastPayload();
        bytes memory payload = bytes.concat(bytes4(request), abi.encode(rsc));
        for (uint256 i = 36; i < request.length; ++i) payload = bytes.concat(payload, request[i]);
        vm.prank(PROXY);
        (bool ok, bytes memory result) = address(vault).call(payload);
        if (!ok) assembly { revert(add(result, 32), mload(result)) }
    }

    function testTakeProfitEqualityRevalidatedAndReplayCannotSpend() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.TakeProfit);
        _authorizePriceOrder(rsc);
        _observe(rsc, address(pool), 84532, 1, 2799 ether);
        assertEq(omni.requests(), 0);
        _observe(rsc, address(pool), 84532, 2, 2800 ether);
        pool.setReserves(1 ether, 2799 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 1 ether);
        pool.setReserves(1 ether, 2800 ether);
        _deliver(address(rsc));
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
        assertGt(quote.balanceOf(address(this)), 0);
    }

    function testOneShotOnlyLocksAfterSuccessfulSettlementAndMirrorsCompletion() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.OneShotStopLoss);
        assertEq(omni.subscriptions(), 2);
        _authorizePriceOrder(rsc);
        _observe(rsc, address(pool), 84532, 1, 1700 ether);
        pool.setReserves(1 ether, 1900 ether);
        _deliver(address(rsc));
        assertFalse(vault.oneShotSettled(address(rsc)));
        vm.warp(1010);
        _observe(rsc, address(pool), 84532, 2, 1700 ether);
        pool.setReserves(1 ether, 1700 ether);
        _deliver(address(rsc));
        assertTrue(vault.oneShotSettled(address(rsc)));
        vm.warp(1020);
        _observe(rsc, address(pool), 84532, 3, 1700 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
        IReactive.LogRecord memory completion = _log(address(vault), 84532, 4, 0);
        completion.topic_0 = uint256(keccak256("OrderPolicyCompleted(address)"));
        completion.topic_1 = uint256(uint160(address(rsc)));
        vm.prank(SYSTEM);
        rsc.react(completion);
        vm.warp(1030);
        _observe(rsc, address(pool), 84532, 5, 1700 ether);
        assertTrue(rsc.policyComplete());
        assertEq(omni.requests(), 3);
    }

    function testHedgeOnlyAcceptsOrderedUnichainVelocityInsideWindow() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.CrossChainHedge);
        _authorizePriceOrder(rsc);
        _observe(rsc, address(pool), 84532, 1, 2000 ether);
        _observe(rsc, address(pool), 1301, 2, 1800 ether);
        _observe(rsc, address(pool), 1301, 3, 1750 ether);
        _observe(rsc, address(pool), 1301, 2, 1500 ether);
        vm.warp(1010);
        _observe(rsc, address(pool), 1301, 4, 1700 ether);
        assertEq(omni.requests(), 0);
        vm.warp(1011);
        _observe(rsc, address(pool), 1301, 5, 1615 ether);
        assertEq(omni.requests(), 1);
        pool.setReserves(1 ether, 2400 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
    }

    function testLadderGroupsGapUsesInitialPrincipalAndRollsBackFailedSwap() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.Ladder);
        uint256[] memory prices = new uint256[](3);
        prices[0] = 1800 ether; prices[1] = 1600 ether; prices[2] = 1400 ether;
        uint8[] memory percentages = new uint8[](3);
        percentages[0] = 20; percentages[1] = 30; percentages[2] = 50;
        vault.registerRSC(address(rsc));
        vault.configureLadder(address(rsc), prices, percentages);
        vault.setAuthorizedRSC(address(rsc), true);

        pool.setReserves(1 ether, 1550 ether);
        _observe(rsc, address(pool), 84532, 1, 1550 ether);
        vm.mockCallRevert(address(router), abi.encodeWithSelector(IUniswapV2Router02.swapExactETHForTokens.selector),
            abi.encodeWithSignature("Error(string)", "Router failed"));
        bytes32 id = keccak256(abi.encode(uint256(84532), address(pool), uint256(1), uint256(0)));
        vm.expectRevert("Router failed");
        vm.prank(PROXY);
        vault.executePriceOrder(address(rsc), PriceOrder(id, PriceOrderMode.Ladder, 1550 ether, 0, 1180));
        assertFalse(vault.executionSettled(address(rsc), id));
        assertEq(address(vault).balance, 1 ether);
        vm.clearMockedCalls();
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);

        vm.warp(1010);
        _observe(rsc, address(pool), 84532, 2, 1550 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
        vm.warp(1020);
        pool.setReserves(1 ether, 1399 ether);
        _observe(rsc, address(pool), 84532, 3, 1399 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0);
    }

    function _gate(bool requireBoth) private returns (PriceGatePipeline rsc) {
        rsc = new PriceGatePipeline(PriceGatePipeline.Config({
            primaryPool: address(pool), confirmationPool: address(confirmation), vault: address(vault),
            primaryThreshold: 1800 ether, confirmationThreshold: 1800 ether,
            freshnessSeconds: 10, cooldownSeconds: 0, requireBoth: requireBoth
        }));
        vault.registerRSC(address(rsc));
        vault.configurePriceGate(address(rsc), PriceOrderVault.PriceGate(
            address(confirmation), 1800 ether, 1800 ether, 50, requireBoth));
        vault.setAuthorizedRSC(address(rsc), true);
    }

    function testAndRejectsStaleSignalAndRechecksBothPools() public {
        PriceGatePipeline rsc = _gate(true);
        _observe(rsc, address(pool), 84532, 1, 1799 ether);
        vm.warp(1011);
        _observe(rsc, address(confirmation), 84532, 2, 1750 ether);
        assertEq(omni.requests(), 0);
        _observe(rsc, address(pool), 84532, 3, 1800 ether);
        assertEq(omni.requests(), 1);
        pool.setReserves(1 ether, 1800 ether);
        confirmation.setReserves(1 ether, 1900 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 1 ether);
        confirmation.setReserves(1 ether, 1800 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
    }

    function testOrFiresOncePerEpisodeEvenWhenBothPoolsMatch() public {
        PriceGatePipeline rsc = _gate(false);
        _observe(rsc, address(pool), 84532, 1, 1900 ether);
        _observe(rsc, address(confirmation), 84532, 1, 1900 ether);
        assertEq(omni.requests(), 0);
        _observe(rsc, address(pool), 84532, 2, 1800 ether);
        _observe(rsc, address(confirmation), 84532, 2, 1800 ether);
        assertEq(omni.requests(), 1);
        pool.setReserves(1 ether, 1800 ether);
        _deliver(address(rsc));
        assertEq(address(vault).balance, 0.5 ether);
        vm.warp(1011);
        _observe(rsc, address(confirmation), 84532, 3, 1800 ether);
        assertEq(omni.requests(), 2);
    }

    function testOrDoesNotRepeatUntilBothSignalsReset() public {
        PriceGatePipeline rsc = _gate(false);
        _observe(rsc, address(pool), 84532, 1, 1700 ether);
        assertEq(omni.requests(), 1);
        _observe(rsc, address(pool), 84532, 2, 1700 ether);
        assertEq(omni.requests(), 1);
        _observe(rsc, address(pool), 84532, 3, 1900 ether);
        assertEq(omni.requests(), 1);
        _observe(rsc, address(confirmation), 84532, 1, 1900 ether);
        _observe(rsc, address(pool), 84532, 4, 1700 ether);
        assertEq(omni.requests(), 2);
    }

    function testAndRejectsExpiredWindowAtVault() public {
        PriceGatePipeline rsc = _gate(true);
        _observe(rsc, address(pool), 84532, 1, 1700 ether);
        _observe(rsc, address(confirmation), 84532, 2, 1700 ether);
        assertEq(omni.requests(), 1);
        vm.warp(1011);
        bytes32 reasonHash = keccak256(bytes("Price gate no longer qualifies"));
        vm.recordLogs();
        _deliver(address(rsc));
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool skipped;
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i].emitter == address(vault) && logs[i].topics[0] == keccak256("OrderSkipped(string,uint256)")) {
                (string memory reason,) = abi.decode(logs[i].data, (string, uint256));
                skipped = keccak256(bytes(reason)) == reasonHash;
            }
        }
        assertTrue(skipped);
        assertEq(address(vault).balance, 1 ether);
    }

    function testProxyIdentityAndOwnerWithdrawal() public {
        PriceOrder memory order = PriceOrder(bytes32(uint256(1)), PriceOrderMode.TakeProfit, 2800 ether, 50, 1100);
        vm.expectRevert("Authorized sender only");
        vault.executePriceOrder(address(this), order);
        vm.prank(PROXY);
        vm.expectRevert("Unauthorized RSC contract");
        vault.executePriceOrder(address(this), order);
        vault.emergencyWithdraw();
        assertEq(address(vault).balance, 0);
    }

    function testPolicyConfigurationRequiresRegisteredContractAndOwner() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.TakeProfit);
        vm.expectRevert("RSC not registered");
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 50, 2800 ether));
        vault.registerRSC(address(rsc));
        vm.prank(address(0xBAD));
        vm.expectRevert("Only owner can execute");
        vault.setAuthorizedRSC(address(rsc), true);
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 50, 2800 ether));
        vm.expectRevert("Only owner can execute");
        vm.prank(address(0xBAD));
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 50, 2800 ether));
        vault.setAuthorizedRSC(address(rsc), true);
        assertTrue(vault.authorizedRSCs(address(rsc)));
        vault.setAuthorizedRSC(address(rsc), false);
        assertFalse(vault.authorizedRSCs(address(rsc)));
    }

    function testRegistersLasnaIdentityWithoutDestinationBytecode() public {
        address rsc = address(0x123456);
        assertEq(rsc.code.length, 0);

        vm.expectRevert("Invalid RSC");
        vault.registerRSC(address(0));
        vm.expectRevert("Only owner can execute");
        vm.prank(address(0xBAD));
        vault.registerRSC(rsc);

        vault.registerRSC(rsc);
        vm.expectRevert("RSC already registered");
        vault.registerRSC(rsc);
        vm.expectRevert("RSC policy not configured");
        vault.setAuthorizedRSC(rsc, true);
        vault.configurePriceOrder(rsc, PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 50, 2800 ether));
        vault.setAuthorizedRSC(rsc, true);

        PriceOrder memory order = PriceOrder(bytes32(uint256(1)), PriceOrderMode.TakeProfit, 2800 ether, 50, 1100);
        vm.expectRevert("Authorized sender only");
        vault.executePriceOrder(rsc, order);
        vault.setAuthorizedRSC(rsc, false);
        vm.expectRevert("Unauthorized RSC contract");
        vm.prank(PROXY);
        vault.executePriceOrder(rsc, order);
    }

    function testPolicyCannotBeReconfiguredOrReauthorizedWithoutPolicy() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.TakeProfit);
        vault.registerRSC(address(rsc));
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 50, 2800 ether));
        vm.expectRevert("RSC policy already set or invalid");
        vault.configurePriceOrder(address(rsc), PriceOrderVault.PricePolicy(
            PriceOrderMode.TakeProfit, 25, 3000 ether));
        PriceOrderPipeline unconfigured = _pipeline(PriceOrderMode.TakeProfit);
        vm.expectRevert("RSC not registered");
        vault.setAuthorizedRSC(address(unconfigured), true);
    }

    function testWrongModeAndParametersCannotUseAuthorizedPolicy() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.TakeProfit);
        _authorizePriceOrder(rsc);
        PriceOrder memory wrongMode = PriceOrder(bytes32(uint256(1)), PriceOrderMode.OneShotStopLoss, 2800 ether, 50, 1100);
        vm.expectRevert("Order does not match policy");
        vm.prank(PROXY);
        vault.executePriceOrder(address(rsc), wrongMode);
        PriceOrder memory wrongPercent = PriceOrder(bytes32(uint256(2)), PriceOrderMode.TakeProfit, 2800 ether, 49, 1100);
        vm.expectRevert("Order does not match policy");
        vm.prank(PROXY);
        vault.executePriceOrder(address(rsc), wrongPercent);
    }

    function testCallbackExpiryCannotBeExtendedByRSC() public {
        PriceOrderPipeline rsc = _pipeline(PriceOrderMode.TakeProfit);
        _authorizePriceOrder(rsc);
        PriceOrder memory tooLong = PriceOrder(bytes32(uint256(3)), PriceOrderMode.TakeProfit, 2800 ether, 50, 1181);
        vm.expectRevert("Invalid order expiry");
        vm.prank(PROXY);
        vault.executePriceOrder(address(rsc), tooLong);
    }

    receive() external payable {}
}
