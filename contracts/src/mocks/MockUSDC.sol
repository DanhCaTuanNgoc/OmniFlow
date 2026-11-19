// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @title MockUSDC
 * @notice An 18-decimal USDC test token that keeps the demo pool's price calculation on a shared scale.
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
