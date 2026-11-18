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

        // Nạp thanh khoản ban đầu cho Pool (1 ETH = $2,000 USDC)
        pair.setReserves(1 ether, 2000 ether);

        // 2. Deploy Vault bởi Owner
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

        // Unauthorized caller không thể gán quyền
        vm.prank(hacker);
        vm.expectRevert("Only owner can execute");
        vault.setAuthorizedRSC(hacker, true);
    }

    function test_PanicButton_EmergencyWithdraw() public {
        uint256 ownerInitial = owner.balance;

        // Chỉ owner mới có thể gọi Panic Button
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

        // Mô phỏng Callback Proxy gọi executeSafeSweep
        vm.prank(callbackProxy);
        vault.executeSafeSweep(address(0), rscContract);

        // Tiền phải chạy về Cold Wallet chứ không phải hacker/owner
        assertEq(address(vault).balance, 0);
        assertEq(coldWallet.balance, 1 ether);
    }

    function test_ExecuteStopLoss_Success() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Giả lập giá rớt xuống $1,750 (Sync: 1 ETH, 1750 USDC)
        pair.setReserves(1 ether, 1750 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // Callback Proxy thực thi bán 50% ETH khi giá <= $1800
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50, // Bán 50% ETH
            1800 ether // Ngưỡng kích hoạt
        );

        // Số dư ETH của Vault giảm 50% (còn 0.5 ETH)
        assertEq(address(vault).balance, 0.5 ether);

        // USDC được chuyển thẳng về ví cá nhân của Owner
        uint256 ownerUsdcAfter = usdc.balanceOf(owner);
        assertTrue(ownerUsdcAfter > ownerUsdcBefore);
    }

    function test_ExecuteStopLoss_SkipsWhenPriceBounces() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Giả lập giá hồi phục lên $1,850 (trên ngưỡng $1,800)
        pair.setReserves(1 ether, 1850 ether);

        // Callback Proxy gọi tới nhưng giá đã hồi -> Phải SKIP an toàn không swap
        vm.prank(callbackProxy);
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);

        // Số dư Vault vẫn nguyên vẹn 1 ETH!
        assertEq(address(vault).balance, 1 ether);
        assertEq(usdc.balanceOf(owner), 0);
    }

    function test_CallbackProxy_UnauthorizedSenderReverts() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Hacker gọi giả mạo không qua Proxy
        vm.prank(hacker);
        vm.expectRevert();
        vault.executeStopLoss(address(0), rscContract, 50, 1800 ether);
    }

    function test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithMaxThreshold() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Giá Base Sepolia hiện tại là $2,000 (vẫn cao hơn $1,800)
        pair.setReserves(1 ether, 2000 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // Trigger đến từ Cross-chain hoặc Velocity với thresholdPriceUSD = type(uint256).max
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50, // Bán 50%
            type(uint256).max // Decoupled trigger
        );

        // Vault đã swap 0.5 ETH thành công bất chấp giá Base vẫn $2,000!
        assertEq(address(vault).balance, 0.5 ether);
        assertTrue(usdc.balanceOf(owner) > ownerUsdcBefore);
    }

    function test_ExecuteStopLoss_CrossChainBypassesStaticPriceCheck_WithExplicitFlag() public {
        vm.prank(owner);
        vault.setAuthorizedRSC(rscContract, true);

        // Giá Base Sepolia hiện tại là $2,000 (vẫn cao hơn $1,800)
        pair.setReserves(1 ether, 2000 ether);

        uint256 ownerUsdcBefore = usdc.balanceOf(owner);

        // Gọi overload 5 tham số với isCrossChainTrigger = true
        vm.prank(callbackProxy);
        vault.executeStopLoss(
            address(0),
            rscContract,
            50,
            1800 ether,
            true // isCrossChainTrigger
        );

        // Vault swap 50% thành công
        assertEq(address(vault).balance, 0.5 ether);
        assertTrue(usdc.balanceOf(owner) > ownerUsdcBefore);
    }
}
