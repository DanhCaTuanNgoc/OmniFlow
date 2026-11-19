// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @title MockUniswapV2Pair
 * @notice A Uniswap V2 test pair that emits Sync events for Reactive Network subscriptions.
 */
contract MockUniswapV2Pair {
    address public immutable token0;
    address public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    event Sync(uint112 reserve0, uint112 reserve1);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @notice Sets the pool reserves to control the price in tests and demos.
     */
    function setReserves(uint112 _reserve0, uint112 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        blockTimestampLast = uint32(block.timestamp);
        emit Sync(_reserve0, _reserve1);
    }

    /**
     * @notice Simulates a Uniswap V2 swap.
     */
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata /*data*/) external {
        require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");

        if (amount0Out > 0) {
            reserve0 -= uint112(amount0Out);
            IERC20(token0).transfer(to, amount0Out);
        }
        if (amount1Out > 0) {
            reserve1 -= uint112(amount1Out);
            IERC20(token1).transfer(to, amount1Out);
        }

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);

        emit Sync(reserve0, reserve1);
        emit Swap(msg.sender, 0, 0, amount0Out, amount1Out, to);
    }
}
