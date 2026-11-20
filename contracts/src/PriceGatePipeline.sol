// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {IReactive} from '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import {AbstractReactive} from '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';
import {ISystemContract} from '@reactive-network/reactive-lib/src/interfaces/ISystemContract.sol';
import {IOmniCallbackSystem} from './StopLoss_Pipeline.sol';
import {PriceOrderVault, GateOrder} from './PriceOrderVault.sol';

/// @notice Combines independent Base Sepolia pool observations within a Lasna receipt-time window.
contract PriceGatePipeline is IReactive, AbstractReactive {
    struct Config {
        address primaryPool;
        address confirmationPool;
        address vault;
        uint256 primaryThreshold;
        uint256 confirmationThreshold;
        uint32 freshnessSeconds;
        uint32 cooldownSeconds;
        bool requireBoth;
    }

    struct Observation {
        uint256 sourceBlock;
        uint256 sourceIndex;
        uint64 validUntil;
    }

    address private constant OMNI_SYSTEM = 0x8888888888888888888888888888888888888888;
    uint256 private constant BASE_SEPOLIA = 84532;
    uint256 private constant SYNC = uint256(keccak256("Sync(uint112,uint112)"));
    uint64 private constant CALLBACK_GAS = 350_000;

    address public immutable primaryPool;
    address public immutable confirmationPool;
    address public immutable vault;
    uint256 public immutable primaryThreshold;
    uint256 public immutable confirmationThreshold;
    uint32 public immutable freshnessSeconds;
    uint32 public immutable cooldownSeconds;
    bool public immutable requireBoth;

    Observation private primary;
    Observation private confirmation;
    bool public episodeActive;
    uint256 public lastTriggeredTimestamp;

    event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload);

    constructor(Config memory config) payable {
        require(OMNI_SYSTEM.code.length != 0, "Omni system unavailable");
        require(config.vault != address(0) && config.primaryPool != address(0)
            && config.confirmationPool != address(0) && config.primaryPool != config.confirmationPool, "Invalid pools");
        require(config.primaryThreshold != 0 && config.confirmationThreshold != 0
            && config.freshnessSeconds > 0 && config.freshnessSeconds <= 180, "Invalid gate configuration");
        primaryPool = config.primaryPool;
        confirmationPool = config.confirmationPool;
        vault = config.vault;
        primaryThreshold = config.primaryThreshold;
        confirmationThreshold = config.confirmationThreshold;
        freshnessSeconds = config.freshnessSeconds;
        cooldownSeconds = config.cooldownSeconds;
        requireBoth = config.requireBoth;

        vendor = service = ISystemContract(payable(OMNI_SYSTEM));
        addAuthorizedSender(OMNI_SYSTEM);
        service.subscribe(BASE_SEPOLIA, primaryPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        service.subscribe(BASE_SEPOLIA, confirmationPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
    }

    function react(LogRecord calldata log) external {
        require(msg.sender == OMNI_SYSTEM, "Only Omni system");
        if (log.chain_id != BASE_SEPOLIA || log.topic_0 != SYNC || log.data.length != 64
            || log.block_number == 0 || (log._contract != primaryPool && log._contract != confirmationPool)) return;
        bool isPrimary = log._contract == primaryPool;
        Observation storage next = isPrimary ? primary : confirmation;
        if (log.block_number < next.sourceBlock
            || (log.block_number == next.sourceBlock && log.log_index <= next.sourceIndex)) return;

        if (!_qualifies()) episodeActive = false;
        next.sourceBlock = log.block_number;
        next.sourceIndex = log.log_index;
        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        uint256 threshold = isPrimary ? primaryThreshold : confirmationThreshold;
        bool hit = reserve0 != 0 && reserve1 != 0 && uint256(reserve1) * 1e18 / reserve0 <= threshold;
        next.validUntil = hit ? uint64(block.timestamp + freshnessSeconds) : 0;
        if (!_qualifies()) {
            episodeActive = false;
            return;
        }
        if (episodeActive || (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldownSeconds)) {
            return;
        }

        episodeActive = true;
        lastTriggeredTimestamp = block.timestamp;
        GateOrder memory order = GateOrder({
            executionId: keccak256(abi.encode(log.chain_id, log._contract, log.tx_hash, log.log_index)),
            primaryValidUntil: primary.validUntil,
            confirmationValidUntil: confirmation.validUntil
        });
        bytes memory payload = abi.encodeCall(PriceOrderVault.executePriceGate, (address(0), order));
        IOmniCallbackSystem(OMNI_SYSTEM).requestCallbackV_1_0(
            IOmniCallbackSystem.Configuration(BASE_SEPOLIA, vault, CALLBACK_GAS, payload)
        );
        emit OmniCallbackRequested(BASE_SEPOLIA, vault, CALLBACK_GAS, payload);
    }

    function _qualifies() private view returns (bool) {
        bool primaryFresh = primary.validUntil != 0 && primary.validUntil >= block.timestamp;
        bool confirmationFresh = confirmation.validUntil != 0 && confirmation.validUntil >= block.timestamp;
        return requireBoth ? primaryFresh && confirmationFresh : primaryFresh || confirmationFresh;
    }
}
