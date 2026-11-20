// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {IReactive} from '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import {AbstractReactive} from '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';
import {ISystemContract} from '@reactive-network/reactive-lib/src/interfaces/ISystemContract.sol';
import {IOmniCallbackSystem} from './StopLoss_Pipeline.sol';
import {PriceOrderVault, PriceOrder, PriceOrderMode} from './PriceOrderVault.sol';

/// @notice Subscribes to a configured pool and hands price orders to its Base Sepolia Vault.
contract PriceOrderPipeline is IReactive, AbstractReactive {
    struct Config {
        address originPool;
        address vault;
        uint256 originChainId;
        PriceOrderMode mode;
        uint256 threshold;
        uint16 percent;
        uint32 cooldown;
        uint16 dropBps;
        uint32 windowSeconds;
    }

    address private constant OMNI_SYSTEM = 0x8888888888888888888888888888888888888888;
    uint256 private constant BASE_SEPOLIA = 84532;
    uint256 private constant UNICHAIN_SEPOLIA = 1301;
    uint256 private constant SYNC = uint256(keccak256("Sync(uint112,uint112)"));
    uint256 private constant POLICY_COMPLETED = uint256(keccak256("OrderPolicyCompleted(address)"));
    uint64 private constant CALLBACK_GAS = 350_000;
    uint256 public constant CALLBACK_TTL = 180;

    address public immutable originPool;
    address public immutable vault;
    uint256 public immutable originChainId;
    PriceOrderMode public immutable mode;
    uint256 public immutable threshold;
    uint16 public immutable percent;
    uint32 public immutable cooldown;
    uint16 public immutable dropBps;
    uint32 public immutable windowSeconds;

    uint256 public lastTriggeredTimestamp;
    bool public policyComplete;
    uint256 private lastSourceBlock;
    uint256 private lastSourceIndex;
    uint256 private anchorPrice;
    uint256 private anchorTime;

    event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload);

    constructor(Config memory config) payable {
        require(OMNI_SYSTEM.code.length != 0, "Omni system unavailable");
        require(config.originPool != address(0) && config.vault != address(0), "Invalid market");
        bool hedge = config.mode == PriceOrderMode.CrossChainHedge;
        bool ladder = config.mode == PriceOrderMode.Ladder;
        require(config.originChainId == (hedge ? UNICHAIN_SEPOLIA : BASE_SEPOLIA), "Invalid origin chain");
        require(ladder ? config.percent == 0 : config.percent > 0 && config.percent <= 100, "Invalid percentage");
        if (hedge) {
            require(config.threshold == 0 && config.dropBps > 0 && config.dropBps <= 10_000 && config.windowSeconds > 0,
                "Invalid velocity configuration");
        } else {
            require(config.threshold != 0 && config.dropBps == 0 && config.windowSeconds == 0,
                "Invalid threshold configuration");
        }

        originPool = config.originPool;
        vault = config.vault;
        originChainId = config.originChainId;
        mode = config.mode;
        threshold = config.threshold;
        percent = config.percent;
        cooldown = config.cooldown;
        dropBps = config.dropBps;
        windowSeconds = config.windowSeconds;

        vendor = service = ISystemContract(payable(OMNI_SYSTEM));
        addAuthorizedSender(OMNI_SYSTEM);
        service.subscribe(originChainId, originPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        if (config.mode == PriceOrderMode.OneShotStopLoss || ladder) {
            service.subscribe(BASE_SEPOLIA, vault, POLICY_COMPLETED, uint256(uint160(address(this))),
                REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function react(LogRecord calldata log) external {
        require(msg.sender == OMNI_SYSTEM, "Only Omni system");
        if (policyComplete) return;
        if ((mode == PriceOrderMode.OneShotStopLoss || mode == PriceOrderMode.Ladder)
            && log.chain_id == BASE_SEPOLIA && log._contract == vault && log.topic_0 == POLICY_COMPLETED
            && log.topic_1 == uint256(uint160(address(this)))) {
            policyComplete = true;
            return;
        }
        if (log.chain_id != originChainId || log._contract != originPool || log.topic_0 != SYNC
            || log.data.length != 64 || log.block_number == 0) return;
        if (log.block_number < lastSourceBlock
            || (log.block_number == lastSourceBlock && log.log_index <= lastSourceIndex)) return;

        // Observations received during cooldown must not become eligible on replay.
        lastSourceBlock = log.block_number;
        lastSourceIndex = log.log_index;
        if (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldown) return;

        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        if (reserve0 == 0 || reserve1 == 0) return;
        uint256 price = uint256(reserve1) * 1e18 / reserve0;
        if (mode == PriceOrderMode.CrossChainHedge) {
            if (!_velocityReached(price)) return;
        } else if (mode == PriceOrderMode.TakeProfit ? price < threshold : price > threshold) {
            return;
        }

        lastTriggeredTimestamp = block.timestamp;
        PriceOrder memory order = PriceOrder({
            executionId: keccak256(abi.encode(log.chain_id, log._contract, log.tx_hash, log.log_index)),
            mode: mode,
            threshold: mode == PriceOrderMode.Ladder ? price : threshold,
            percent: percent,
            expiresAt: block.timestamp + CALLBACK_TTL
        });
        bytes memory payload = abi.encodeCall(PriceOrderVault.executePriceOrder, (address(0), order));
        IOmniCallbackSystem(OMNI_SYSTEM).requestCallbackV_1_0(
            IOmniCallbackSystem.Configuration(BASE_SEPOLIA, vault, CALLBACK_GAS, payload)
        );
        emit OmniCallbackRequested(BASE_SEPOLIA, vault, CALLBACK_GAS, payload);
    }

    function _velocityReached(uint256 price) private returns (bool) {
        if (anchorTime == 0 || block.timestamp - anchorTime >= windowSeconds) {
            anchorPrice = price;
            anchorTime = block.timestamp;
            return false;
        }
        if (price >= anchorPrice || (anchorPrice - price) * 10_000 < anchorPrice * dropBps) return false;
        anchorPrice = 0;
        anchorTime = 0;
        return true;
    }
}
