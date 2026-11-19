// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import './MockUniswapV2Pair.sol';
import './MockWETH.sol';
import './MockUSDC.sol';

/**
 * @title MockUniswapV2Router
 * @notice A test router that lets ActionVault swap along a Uniswap V2 constant-product curve.
 */
contract MockUniswapV2Router {
    address public immutable weth;
    address public immutable pair;

    constructor(address _weth, address _pair) {
        weth = _weth;
        pair = _pair;
    }

    function WETH() external view returns (address) {
        return weth;
    }

    /**
     * @notice Calculates the output amount using the x * y = k formula with a 0.3% fee.
     */
    function getAmountsOut(uint amountIn, address[] calldata /*path*/) external view returns (uint[] memory amounts) {
        (uint112 reserve0, uint112 reserve1,) = MockUniswapV2Pair(pair).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "INSUFFICIENT_LIQUIDITY");

        // Assume token0 is WETH and token1 is USDC.
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * uint256(reserve1);
        uint denominator = (uint256(reserve0) * 1000) + amountInWithFee;
        uint amountOut = numerator / denominator;

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }

    /**
     * @notice Swaps ETH for USDC and sends the output directly to the specified recipient.
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint /*deadline*/
    ) external payable returns (uint[] memory amounts) {
        amounts = this.getAmountsOut(msg.value, path);
        require(amounts[1] >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");

        // Send USDC from the router balance or mint it for the recipient.
        MockUSDC(path[1]).mint(to, amounts[1]);
    }
}
