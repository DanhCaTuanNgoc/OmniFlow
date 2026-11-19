// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import 'forge-std/Test.sol';
import '../src/ActionVault.sol';
import '../src/mocks/MockWETH.sol';
import '../src/mocks/MockUSDC.sol';
import '../src/mocks/MockUniswapV2Pair.sol';
import '../src/mocks/MockUniswapV2Router.sol';

contract ActionVaultTest is Test {
    ActionVault public vault;
    MockWETH public weth;
    MockUSDC public usdc;
    MockUniswapV2Pair public pair;
    MockUniswapV2Router public router;

    address public owner = address(0x1111);
    address public coldWallet = address(0x2222);
    address public callbackProxy = address(0x3333);
    address public rscContract = address(0x4444);
    address public hacker = address(0x9999);

    function setUp() public {
        vm.deal(owner, 10 ether);

        // 1. Deploy Mocks
        weth = new MockWETH();
        usdc = new MockUSDC();
        pair = new MockUniswapV2Pair(address(weth), address(usdc));
        router = new MockUniswapV2Router(address(weth), address(pair));

        // Seed the pool at 2,000 USDC per ETH.
        pair.setReserves(1 ether, 2000 ether);

        // 2. Deploy the Vault as the owner.
        vm.prank(owner);
        vault = new ActionVault{value: 1 ether}(
            callbackProxy,
            coldWallet,
            address(router),
            address(usdc),
            address(pair)
        );
    }

    function test_InitialState() public view {
        assertEq(vault.owner(), owner);
        assertEq(vault.backupSafeAddress(), coldWallet);
        assertEq(address(vault).balance, 1 ether);
    }

    function test_AuthorizeRSC() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);
        assertTrue(vault.authorizedRSCs(rscContract));

        // An unauthorized caller cannot grant execution permission.
        vm.prank(hacker);
        vm.expectRevert("Only owner can execute");
        vault.setAuthorizedRSC(hacker, true);
    }

    function test_PanicButton_EmergencyWithdraw() public {
        uint256 ownerInitial = owner.balance;

        // Only the owner can trigger an emergency withdrawal.
        vm.prank(owner);
        vault.emergencyWithdraw();

        assertEq(address(vault).balance, 0);
        assertEq(owner.balance, ownerInitial + 1 ether);
    }

    function test_EmergencyWithdraw_RevertsForNonOwner() public {
        vm.prank(hacker);
        vm.expectRevert("Only owner can execute");
        vault.emergencyWithdraw();
    }

    function test_SafeSweep_TransfersToColdWallet() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Simulate the callback proxy calling executeSafeSweep.
        vm.prank(callbackProxy);
        vault.executeSafeSweep(address(0), rscContract);

        // The funds must go to the backup wallet.
        assertEq(address(vault).balance, 0);
        assertEq(coldWallet.balance, 1 ether);
    }

    function test_ExecuteStopLoss_Success() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Simulate a price drop to 1,750 USDC per ETH.
        pair.setReserves(1 ether, 1750 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // The callback proxy sells 50% of the ETH when the price is at or below $1,800.
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50, // Swap 50% of the ETH.
            1800 ether // Trigger price threshold.
        );

        // The Vault's ETH balance falls by half to 0.5 ETH.
        assertEq(address(vault).balance, 0.5 ether);

        // The swap sends USDC directly to the owner's wallet.
        uint256 ownerUsdcAfter = usdc.balanceOf(owner);
        assertTrue(ownerUsdcAfter > ownerUsdcBefore);
    }

    function test_ExecuteStopLoss_SkipsWhenPriceBounces() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Simulate a recovery to $1,850, above the $1,800 threshold.
        pair.setReserves(1 ether, 1850 ether);

        // The Vault must skip the swap when the price has recovered before the callback.
        vm.prank(callbackProxy);
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);

        // The Vault retains its full 1 ETH balance.
        assertEq(address(vault).balance, 1 ether);
        assertEq(usdc.balanceOf(owner), 0);
    }

    function test_CallbackProxy_UnauthorizedSenderReverts() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // An unauthorized caller attempts to bypass the callback proxy.
        vm.prank(hacker);
        vm.expectRevert();
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);
    }

    function test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithMaxThreshold() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // The Base Sepolia price is $2,000, above the $1,800 threshold.
        pair.setReserves(1 ether, 2000 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // Simulate a cross-chain or velocity trigger with thresholdPriceUSD set to type(uint256).max.
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50, // Swap 50% of the ETH.
            type(uint256).max // Decoupled trigger
        );

        // The Vault swaps 0.5 ETH while the Base Sepolia price is still $2,000.
        assertEq(address(vault).balance, 0.5 ether);
        assertTrue(usdc.balanceOf(owner) > ownerUsdcBefore);
    }

    function test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithExplicitFlag() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // The Base Sepolia price is $2,000, above the $1,800 threshold.
        pair.setReserves(1 ether, 2000 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // Call the five-argument overload with isCrossChainTrigger set to true.
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50,
            1800 ether,
            true // isCrossChainTrigger
        );

        // The Vault swaps 50% of its ETH balance.
        assertEq(address(vault).balance, 0.5 ether);
        assertTrue(usdc.balanceOf(owner) > ownerUsdcBefore);
    }

    function test_Scenario_PanicButton_Overrides_PendingCallbacks() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // The owner withdraws all ETH to their wallet through the emergency exit.
        vm.prank(owner);
        vault.emergencyWithdraw();
        assertEq(address(vault).balance, 0);

        // An RSC callback arrives after the withdrawal.
        pair.setReserves(1 ether, 1700 ether);
        vm.prank(callbackProxy);
        vm.expectRevert("No ETH available in vault");
        vault.executeStopLoss(
            address(0),
            rscContract,
            50,
            1800 ether
        );

        // The Vault balance remains zero after the callback attempt.
        assertEq(address(vault).balance, 0);
    }

    function test_Scenario_DeauthorizeRSC_ImmediatelyBlocksCallbacks() public {
        // Grant initial execution permission.
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);
        assertTrue(vault.authorizedRSCs(rscContract));

        // The owner immediately revokes permission after detecting unusual activity.
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, false);
        assertFalse(vault.authorizedRSCs(rscContract));

        // The proxy callback reverts after authorization is revoked.
        pair.setReserves(1 ether, 1700 ether);
        vm.prank(callbackProxy);
        vm.expectRevert("Unauthorized RSC contract");
        vault.executeStopLoss(
            address(0),
            rscContract,
            50,
            1800 ether
        );
    }

    function test_Scenario_SafeSweep_ZeroCollateralRemaining() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        uint256 coldWalletBefore = coldWallet.balance;

        // The callback proxy triggers a safe sweep to the backup wallet.
        vm.prank(callbackProxy);
        vault.executeSafeSweep(address(0), rscContract);

        // The backup wallet receives the full balance.
        assertEq(coldWallet.balance, coldWalletBefore + 1 ether);
        assertEq(address(vault).balance, 0);
    }

    function test_Scenario_MultipleSequentialSwaps() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        pair.setReserves(1 ether, 1700 ether);

        // First swap: sell half of 1 ETH, leaving 0.5 ETH.
        vm.prank(callbackProxy);
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);
        assertEq(address(vault).balance, 0.5 ether);

        // The price drops again to $1,500.
        pair.setReserves(1 ether, 1500 ether);

        // Second swap: sell half of the remaining 0.5 ETH, leaving 0.25 ETH.
        vm.prank(callbackProxy);
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);
        assertEq(address(vault).balance, 0.25 ether);
    }
}
