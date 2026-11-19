// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';
import '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';

interface IOmniCallbackSystem {
    struct Configuration {
        uint256 chainId;
        address recipient;
        uint64 gasLimit;
        bytes payload;
    }

    function requestCallbackV_1_0(Configuration calldata configuration) external;
}

/**
 * @title StopLoss_Pipeline
 * @notice Runs stop-loss automation on Reactive Omni (Lasna Testnet).
 * @dev Uses Reactive Omni's fast block finality to detect price drops and request callbacks.
 *      Supports consecutive-hit confirmation, an anchored price velocity window, and configurable origin chains.
 */
contract StopLoss_Pipeline is IReactive, AbstractReactive {
    address private constant OMNI_SYSTEM = 0x8888888888888888888888888888888888888888;
    uint64 private constant CALLBACK_GAS = 350000;
    uint256 public constant DEFAULT_ORIGIN_CHAIN_ID = 84532; // Base Sepolia
    uint256 public constant SYNC_TOPIC = 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1;

    uint256 public immutable originChainId;
    uint256 public immutable originTopic0;
    address public immutable pairAddress;
    uint256 public immutable priceThreshold; // Price scaled by 1e18.
    uint256 public immutable cooldownSeconds;
    uint256 public immutable percentToSwap;
    address public immutable actionVault;

    // Track consecutive price hits to filter brief price dips.
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

    event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload);
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

        // Register the subscription when the Reactive system contract is available.
        if (OMNI_SYSTEM.code.length != 0) {
            vendor = service = ISystemContract(payable(OMNI_SYSTEM));
            addAuthorizedSender(OMNI_SYSTEM);
        }
        if (address(service).code.length != 0) {
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

    // Supports Reactive Omni and legacy ReactVM.
    function react(LogRecord calldata log) external {
        if (OMNI_SYSTEM.code.length != 0) {
            require(msg.sender == OMNI_SYSTEM, "Only Omni system");
        } else {
            require(vm, "VM only");
        }
        if (log._contract != pairAddress) return;
        if (log.topic_0 != 0 && log.topic_0 != originTopic0) return;

        // Use a timestamp-based cooldown to limit callbacks during rapid Base Sepolia blocks.
        if (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldownSeconds) return;

        // Decode the reserve values from the Sync event.
        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));
        if (reserve0 == 0) return;


        // Compute the reserve price with 18 decimal places.
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

        // Confirm the static threshold with consecutive price hits.
        if (priceThreshold > 0) {
            if (currentPrice <= priceThreshold) {
                consecutiveHits++;
                if (consecutiveHits >= requiredHits) {
                    triggerConditionMet = true;
                }
            } else {
                // Reset the hit count when the price recovers above the threshold.
                consecutiveHits = 0;
            }
        }

        if (!triggerConditionMet) return;

        // Record the trigger timestamp, reset the hit count, and increment the callback counter.
        lastTriggeredTimestamp = block.timestamp;
        consecutiveHits = 0;
        callbacksEmitted++;

        emit ConditionTriggered(currentPrice, block.timestamp);

        // The callback payload reserves two address arguments.
        // Slot 1 (address(0)): The proxy injects the reactive contract address on Omni or the ReactVM ID on legacy networks.
        // Slot 2 (address(this)): Address of this StopLoss_Pipeline contract.
        // Cross-chain and velocity triggers use type(uint256).max to skip the Vault's static price check.
        uint256 passedThreshold = isCrossChainOrVelocity ? type(uint256).max : priceThreshold;

        bytes memory payload = abi.encodeWithSignature(
            "executeStopLoss(address,address,uint256,uint256)",
            address(0),
            address(this),
            percentToSwap,
            passedThreshold
        );

        if (OMNI_SYSTEM.code.length != 0) {
            IOmniCallbackSystem(OMNI_SYSTEM).requestCallbackV_1_0(
                IOmniCallbackSystem.Configuration(DEFAULT_ORIGIN_CHAIN_ID, actionVault, CALLBACK_GAS, payload)
            );
            emit OmniCallbackRequested(DEFAULT_ORIGIN_CHAIN_ID, actionVault, CALLBACK_GAS, payload);
        } else {
            emit Callback(DEFAULT_ORIGIN_CHAIN_ID, actionVault, CALLBACK_GAS, payload);
        }
    }
}
