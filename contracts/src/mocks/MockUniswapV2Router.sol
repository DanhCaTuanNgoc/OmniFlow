// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import './MockUniswapV2Pair.sol';
import './MockWETH.sol';
import './MockUSDC.sol';

/**
 * @title MockUniswapV2Router
 * @notice Router giả lập phục vụ ActionVault swap chuẩn theo đường cong Uniswap V2
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
     * @notice Tính toán lượng token đầu ra chuẩn xác theo công thức x * y = k với 0.3% phí
     */
    function getAmountsOut(uint amountIn, address[] calldata /*path*/) external view returns (uint[] memory amounts) {
        (uint112 reserve0, uint112 reserve1,) = MockUniswapV2Pair(pair).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "INSUFFICIENT_LIQUIDITY");

        // Giả định token0 là WETH và token1 là USDC
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * uint256(reserve1);
        uint denominator = (uint256(reserve0) * 1000) + amountInWithFee;
        uint amountOut = numerator / denominator;

        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }

    /**
     * @notice Thực hiện swap ETH sang USDC và chuyển thẳng tới ví `to`
     */
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint /*deadline*/
    ) external payable returns (uint[] memory amounts) {
        amounts = this.getAmountsOut(msg.value, path);
        require(amounts[1] >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");

        // Chuyển USDC từ Router (hoặc mint) sang cho người nhận
        MockUSDC(path[1]).mint(to, amounts[1]);
    }
}
