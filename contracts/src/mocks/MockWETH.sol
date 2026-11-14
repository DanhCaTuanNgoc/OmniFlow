// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @title MockWETH
 * @notice Token Wrapped Ether chuẩn 18 decimals phục vụ testbed và ép giá demo
 */
contract MockWETH is ERC20 {
    constructor() ERC20("Mock Wrapped Ether", "WETH") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
