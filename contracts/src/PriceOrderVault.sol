// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import {AbstractCallback} from '@reactive-network/reactive-lib/src/abstract-base/AbstractCallback.sol';
import {IUniswapV2Pair, IUniswapV2Router02} from './ActionVault.sol';

enum PriceOrderMode {
    OneShotStopLoss,
    TakeProfit,
    CrossChainHedge,
    Ladder
}

struct PriceOrder {
    bytes32 executionId;
    PriceOrderMode mode;
    uint256 threshold;
    uint256 percent;
    uint256 expiresAt;
}

struct GateOrder {
    bytes32 executionId;
    uint64 primaryValidUntil;
    uint64 confirmationValidUntil;
}

/// @notice Base Sepolia settlement for versioned price orders.
contract PriceOrderVault is AbstractCallback {
    struct Ladder {
        uint256 initialPrincipal;
        uint256 settledMask;
        uint256[] thresholds;
        uint8[] percentages;
    }

    struct PriceGate {
        address confirmationPool;
        uint256 primaryThreshold;
        uint256 confirmationThreshold;
        uint8 percent;
        bool requireBoth;
    }

    struct PricePolicy {
        PriceOrderMode mode;
        uint8 percent;
        uint256 threshold;
    }

    enum Permission {
        None,
        PriceOrder,
        Ladder,
        Gate,
        SafeSweep
    }

    uint256 public constant MAX_SLIPPAGE_BPS = 500;
    address public immutable owner;
    address public immutable backupSafeAddress;
    address public immutable uniswapRouter;
    address public immutable usdcToken;
    address public immutable tokenPair;

    mapping(address => bool) public authorizedRSCs;
    mapping(address => Permission) public permissions;
    mapping(address => bool) public oneShotSettled;
    mapping(address => mapping(bytes32 => bool)) public executionSettled;
    mapping(address => Ladder) private ladders;
    mapping(address => PriceGate) public priceGates;
    mapping(address => PricePolicy) public pricePolicies;

    event RSCAuthorized(address indexed rsc, bool status);
    event OrderSkipped(string reason, uint256 currentPrice);
    event OrderSettled(address indexed rsc, bytes32 indexed executionId, uint256 ethAmountIn, uint256 minAmountOut);
    event OrderPolicyCompleted(address indexed rsc);
    event LadderConfigured(address indexed rsc, uint256 initialPrincipal, bytes32 scheduleHash);
    event LadderStepsSettled(address indexed rsc, bytes32 indexed executionId, uint256 stepMask);
    event PriceGateConfigured(address indexed rsc, address indexed confirmationPool);
    event EmergencyWithdrawn(address indexed to, uint256 amount);
    event SafeSwept(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    constructor(address proxy, address backup, address router, address quote, address pair)
        AbstractCallback(proxy)
    {
        require(proxy != address(0) && backup != address(0), "Invalid authority");
        require(router.code.length != 0 && quote.code.length != 0 && pair.code.length != 0, "Invalid market");
        owner = msg.sender;
        backupSafeAddress = backup;
        uniswapRouter = router;
        usdcToken = quote;
        tokenPair = pair;
        addAuthorizedSender(proxy);
    }

    function setAuthorizedRSC(address rsc, bool authorized) external onlyOwner {
        require(rsc != address(0), "Invalid RSC");
        require(!authorized || permissions[rsc] != Permission.None, "RSC policy not configured");
        authorizedRSCs[rsc] = authorized;
        emit RSCAuthorized(rsc, authorized);
    }

    function configurePriceOrder(address rsc, PricePolicy calldata policy) external onlyOwner {
        _configure(rsc, Permission.PriceOrder);
        require(policy.mode != PriceOrderMode.Ladder && policy.percent > 0 && policy.percent <= 100,
            "Invalid price policy");
        require(policy.mode == PriceOrderMode.CrossChainHedge ? policy.threshold == 0 : policy.threshold > 0,
            "Invalid policy threshold");
        pricePolicies[rsc] = policy;
    }

    function configureLadder(address rsc, uint256[] calldata thresholds, uint8[] calldata percentages)
        external onlyOwner
    {
        _configure(rsc, Permission.Ladder);
        Ladder storage ladder = ladders[rsc];
        require(ladder.initialPrincipal == 0 && address(this).balance != 0, "Invalid initial principal");
        require(thresholds.length >= 2 && thresholds.length <= 8 && thresholds.length == percentages.length,
            "Invalid ladder length");
        uint256 totalPercent;
        for (uint256 i; i < thresholds.length; ++i) {
            require(thresholds[i] != 0 && (i == 0 || thresholds[i] < thresholds[i - 1]) && percentages[i] != 0,
                "Invalid ladder step");
            require(address(this).balance * percentages[i] / 100 != 0, "Ladder step rounds to zero");
            totalPercent += percentages[i];
        }
        require(totalPercent <= 100, "Ladder exceeds principal");
        ladder.initialPrincipal = address(this).balance;
        ladder.thresholds = thresholds;
        ladder.percentages = percentages;
        emit LadderConfigured(rsc, ladder.initialPrincipal, keccak256(abi.encode(thresholds, percentages)));
    }

    function configurePriceGate(address rsc, PriceGate calldata gate) external onlyOwner {
        _configure(rsc, Permission.Gate);
        require(gate.confirmationPool.code.length != 0 && gate.confirmationPool != tokenPair
            && gate.primaryThreshold != 0 && gate.confirmationThreshold != 0
            && gate.percent > 0 && gate.percent <= 100, "Invalid gate configuration");
        priceGates[rsc] = gate;
        emit PriceGateConfigured(rsc, gate.confirmationPool);
    }

    function executePriceGate(address rsc, GateOrder calldata order) external authorizedSenderOnly {
        require(authorizedRSCs[rsc], "Unauthorized RSC contract");
        require(permissions[rsc] == Permission.Gate, "Invalid RSC permission");
        PriceGate storage gate = priceGates[rsc];
        require(order.executionId != bytes32(0) && gate.confirmationPool != address(0), "Invalid gate order");
        if (executionSettled[rsc][order.executionId]) {
            emit OrderSkipped("Order already settled", 0);
            return;
        }
        bool primary = order.primaryValidUntil != 0 && block.timestamp <= order.primaryValidUntil
            && _atOrBelow(tokenPair, gate.primaryThreshold);
        bool confirmation = order.confirmationValidUntil != 0 && block.timestamp <= order.confirmationValidUntil
            && _atOrBelow(gate.confirmationPool, gate.confirmationThreshold);
        if (gate.requireBoth ? !(primary && confirmation) : !(primary || confirmation)) {
            emit OrderSkipped("Price gate no longer qualifies", 0);
            return;
        }
        uint256 amount = address(this).balance * gate.percent / 100;
        require(amount != 0, "No ETH available in vault");
        executionSettled[rsc][order.executionId] = true;
        uint256 minOut = _swap(amount, block.timestamp);
        emit OrderSettled(rsc, order.executionId, amount, minOut);
    }

    /// @dev Omni replaces the first argument with the authenticated requesting contract address.
    function executePriceOrder(address rsc, PriceOrder calldata order) external authorizedSenderOnly {
        require(authorizedRSCs[rsc], "Unauthorized RSC contract");
        require(order.executionId != bytes32(0), "Invalid execution ID");
        if (order.mode == PriceOrderMode.Ladder) {
            require(permissions[rsc] == Permission.Ladder, "Invalid RSC permission");
        } else {
            require(permissions[rsc] == Permission.PriceOrder, "Invalid RSC permission");
            PricePolicy storage policy = pricePolicies[rsc];
            require(policy.mode == order.mode && policy.percent == order.percent && policy.threshold == order.threshold,
                "Order does not match policy");
        }

        bool oneShot = order.mode == PriceOrderMode.OneShotStopLoss;
        if (executionSettled[rsc][order.executionId] || (oneShot && oneShotSettled[rsc])) {
            emit OrderSkipped("Order already settled", 0);
            return;
        }
        if (block.timestamp > order.expiresAt) {
            emit OrderSkipped("Callback expired", 0);
            return;
        }
        if (order.mode == PriceOrderMode.Ladder) {
            require(order.percent == 0 && order.threshold != 0, "Invalid ladder order");
            _executeLadder(rsc, order);
            return;
        }
        require(order.percent > 0 && order.percent <= 100, "Invalid percentage");

        if (order.mode != PriceOrderMode.CrossChainHedge) {
            require(order.threshold != 0, "Missing threshold");
            uint256 livePrice = _livePrice();
            if (order.mode == PriceOrderMode.TakeProfit && livePrice < order.threshold) {
                emit OrderSkipped("Price fell below take-profit threshold", livePrice);
                return;
            }
            if (oneShot && livePrice > order.threshold) {
                emit OrderSkipped("Price bounced back above stop threshold", livePrice);
                return;
            }
        } else {
            require(order.threshold == 0, "Unexpected hedge threshold");
        }

        uint256 amount = address(this).balance * order.percent / 100;
        require(amount != 0, "No ETH available in vault");
        executionSettled[rsc][order.executionId] = true;
        if (oneShot) oneShotSettled[rsc] = true;
        uint256 minOut = _swap(amount, order.expiresAt);
        emit OrderSettled(rsc, order.executionId, amount, minOut);
        if (oneShot) emit OrderPolicyCompleted(rsc);
    }

    function _executeLadder(address rsc, PriceOrder calldata order) private {
        Ladder storage ladder = ladders[rsc];
        require(ladder.initialPrincipal != 0, "Ladder not configured");
        uint256 livePrice = _livePrice();
        uint256 price = livePrice > order.threshold ? livePrice : order.threshold;
        uint256 amount;
        uint256 stepMask;
        for (uint256 i; i < ladder.thresholds.length && price <= ladder.thresholds[i]; ++i) {
            uint256 step = 1 << i;
            if (ladder.settledMask & step != 0) continue;
            uint256 stepAmount = ladder.initialPrincipal * ladder.percentages[i] / 100;
            require(stepAmount != 0, "Ladder step rounds to zero");
            amount += stepAmount;
            stepMask |= step;
        }
        if (stepMask == 0) {
            emit OrderSkipped("No unsettled ladder step qualifies", livePrice);
            return;
        }
        require(address(this).balance >= amount, "Insufficient ladder principal");
        ladder.settledMask |= stepMask;
        executionSettled[rsc][order.executionId] = true;
        uint256 minOut = _swap(amount, order.expiresAt);
        emit LadderStepsSettled(rsc, order.executionId, stepMask);
        emit OrderSettled(rsc, order.executionId, amount, minOut);
        if (ladder.settledMask == (1 << ladder.thresholds.length) - 1) emit OrderPolicyCompleted(rsc);
    }

    function _livePrice() private view returns (uint256) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(tokenPair).getReserves();
        require(reserve0 != 0 && reserve1 != 0, "Empty pool reserve");
        return uint256(reserve1) * 1e18 / reserve0;
    }

    function _atOrBelow(address pool, uint256 threshold) private view returns (bool) {
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(pool).getReserves();
        return reserve0 != 0 && reserve1 != 0 && uint256(reserve1) * 1e18 / reserve0 <= threshold;
    }

    function _swap(uint256 amount, uint256 deadline) private returns (uint256 minOut) {
        IUniswapV2Router02 router = IUniswapV2Router02(uniswapRouter);
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = usdcToken;
        uint256[] memory quote = router.getAmountsOut(amount, path);
        minOut = quote[1] * (10_000 - MAX_SLIPPAGE_BPS) / 10_000;
        require(minOut != 0, "Insufficient quote");
        uint256[] memory amounts = router.swapExactETHForTokens{value: amount}(minOut, path, owner, deadline);
        require(amounts[1] >= minOut, "Insufficient output");
    }

    function executeSafeSweep(address rsc) external authorizedSenderOnly {
        require(authorizedRSCs[rsc], "Unauthorized RSC contract");
        require(permissions[rsc] == Permission.SafeSweep, "Invalid RSC permission");
        emit SafeSwept(backupSafeAddress, _withdraw(backupSafeAddress));
    }

    function configureSafeSweep(address rsc) external onlyOwner {
        _configure(rsc, Permission.SafeSweep);
    }

    function _configure(address rsc, Permission permission) private {
        require(rsc != address(0) && permissions[rsc] == Permission.None, "RSC policy already set or invalid");
        permissions[rsc] = permission;
    }

    function emergencyWithdraw() external onlyOwner {
        emit EmergencyWithdrawn(owner, _withdraw(owner));
    }

    function _withdraw(address to) private returns (uint256 amount) {
        amount = address(this).balance;
        require(amount != 0, "Zero vault balance");
        (bool success,) = payable(to).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable override {}
}
