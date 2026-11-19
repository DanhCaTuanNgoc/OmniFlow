// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@reactive-network/reactive-lib/src/abstract-base/AbstractCallback.sol';

interface IUniswapV2Router02 {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function WETH() external pure returns (address);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

/**
 * @title ActionVault
 * @notice A user-owned, non-custodial vault on Base Sepolia.
 * @dev Inherits AbstractCallback to authenticate calls from the Reactive callback proxy.
 */
contract ActionVault is AbstractCallback {
    address public immutable owner;
    address public immutable backupSafeAddress; // Backup wallet that receives funds if the owner's wallet is compromised.
    mapping(address => bool) public authorizedRSCs; // Supports multiple pipelines in parallel.
    address public immutable uniswapRouter;
    address public immutable usdcToken;
    address public immutable tokenPair;

    uint256 public constant MAX_SLIPPAGE_BPS = 500; // Maximum allowed slippage is 5%.

    event StopLossExecuted(uint256 ethAmountIn, uint256 minUsdcOut, uint256 timestamp);
    event OrderSkipped(string reason, uint256 currentPrice);
    event EmergencyWithdrawn(address indexed to, uint256 amount);
    event SafeSwept(address indexed to, uint256 amount);
    event RSCAuthorized(address indexed rsc, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    constructor(
        address _callbackProxy,
        address _backupSafeAddress,
        address _uniswapRouter,
        address _usdcToken,
        address _tokenPair
    ) AbstractCallback(_callbackProxy) payable {
        require(_callbackProxy != address(0), "Invalid callback proxy");
        require(_backupSafeAddress != address(0), "Invalid backup address");
        require(_uniswapRouter != address(0), "Invalid router");
        require(_usdcToken != address(0), "Invalid usdc");
        require(_tokenPair != address(0), "Invalid token pair");
        owner = msg.sender;
        backupSafeAddress = _backupSafeAddress;
        uniswapRouter = _uniswapRouter;
        usdcToken = _usdcToken;
        tokenPair = _tokenPair;
    }

    /**
     * @notice Grants or revokes execution permission for a reactive contract.
     * @param _rsc Address of the reactive contract on Reactive Lasna.
     * @param _status True to authorize the contract, false to revoke authorization.
     */
    function setAuthorizedRSC(address _rsc, bool _status) external onlyOwner {
        require(_rsc != address(0), "Invalid RSC");
        authorizedRSCs[_rsc] = _status;
        emit RSCAuthorized(_rsc, _status);
    }

    /**
     * @notice Executes a stop-loss order from Reactive Network.
     * @param rvmId Identity injected by the callback proxy into the first argument.
     * @param rscContract Address of the StopLoss_Pipeline contract.
     * @param percentToSwap Percentage of the Vault's ETH balance to swap, from 1 to 100.
     * @param thresholdPriceUSD Origin price threshold. Use type(uint256).max to skip the local price check.
     */
    function executeStopLoss(
        address rvmId,
        address rscContract,
        uint256 percentToSwap,
        uint256 thresholdPriceUSD
    ) external authorizedSenderOnly {
        _executeStopLossInternal(rvmId, rscContract, percentToSwap, thresholdPriceUSD, thresholdPriceUSD == type(uint256).max);
    }

    /**
     * @notice Executes a stop-loss order with an explicit isCrossChainTrigger flag.
     */
    function executeStopLoss(
        address rvmId,
        address rscContract,
        uint256 percentToSwap,
        uint256 thresholdPriceUSD,
        bool isCrossChainTrigger
    ) external authorizedSenderOnly {
        _executeStopLossInternal(rvmId, rscContract, percentToSwap, thresholdPriceUSD, isCrossChainTrigger);
    }

    function _executeStopLossInternal(
        address /* rvmId */,
        address rscContract,
        uint256 percentToSwap,
        uint256 thresholdPriceUSD,
        bool isCrossChainTrigger
    ) internal {
        require(authorizedRSCs[rscContract], "Unauthorized RSC contract");
        require(percentToSwap > 0 && percentToSwap <= 100, "Invalid swap percent");

        uint256 ethBalance = address(this).balance;
        require(ethBalance > 0, "No ETH available in vault");

        // Revalidate the live pool price before swapping.
        // Cross-chain and velocity triggers skip the static price check on the Base Sepolia pool.
        if (!isCrossChainTrigger && thresholdPriceUSD != type(uint256).max) {
            (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(tokenPair).getReserves();
            require(reserve0 > 0, "Empty pool reserve");
            uint256 livePrice = (uint256(reserve1) * 1e18) / uint256(reserve0);

            if (livePrice > thresholdPriceUSD) {
                emit OrderSkipped("Price bounced back above stop threshold", livePrice);
                return;
            }
        }

        uint256 swapAmount = (ethBalance * percentToSwap) / 100;

        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(uniswapRouter).WETH();
        path[1] = usdcToken;

        // Use the router quote to account for pool fees and price impact when setting minAmountOut.
        uint256[] memory amountsOut = IUniswapV2Router02(uniswapRouter).getAmountsOut(swapAmount, path);
        uint256 minAmountOut = (amountsOut[1] * (10000 - MAX_SLIPPAGE_BPS)) / 10000;

        emit StopLossExecuted(swapAmount, minAmountOut, block.timestamp);

        // Send the swap output directly to the Vault owner.
        IUniswapV2Router02(uniswapRouter).swapExactETHForTokens{value: swapAmount}(
            minAmountOut,
            path,
            owner,
            block.timestamp + 300
        );
    }

    // =========================================================================
    // Emergency safe sweep to the backup wallet if the owner's wallet is compromised.
    // =========================================================================
    function executeSafeSweep(
        address /* rvmId */,
        address rscContract
    ) external authorizedSenderOnly {
        require(authorizedRSCs[rscContract], "Unauthorized RSC contract");
        uint256 balance = address(this).balance;
        require(balance > 0, "Zero vault balance");

        emit SafeSwept(backupSafeAddress, balance);
        payable(backupSafeAddress).transfer(balance);
    }

    // =========================================================================
    // Non-custodial emergency withdrawal for the Vault owner.
    // =========================================================================
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Zero vault balance");

        emit EmergencyWithdrawn(owner, balance);
        payable(owner).transfer(balance);
    }

    receive() external payable override {}
}
