// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import 'forge-std/Script.sol';
import '../src/ActionVault.sol';
import '../src/StopLoss_Pipeline.sol';
import '../src/mocks/MockWETH.sol';
import '../src/mocks/MockUSDC.sol';
import '../src/mocks/MockUniswapV2Pair.sol';
import '../src/mocks/MockUniswapV2Router.sol';

/**
 * @title DeployScript
 * @notice Script triển khai hạ tầng OmniFlow lên Base Sepolia và Reactive Lasna Testnet
 */
contract DeployScript is Script {
    // Official Reactive Network Callback Proxy trên Base Sepolia
    address public constant CALLBACK_PROXY_BASE_SEPOLIA = 0xa6eA49Ed671B8a4dfCDd34E36b7a75Ac79B8A5a6;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        console.log("=== OMNIFLOW CONTRACT DEPLOYMENT ===");
        console.log("Deployer Address:", deployer);
        console.log("Chain ID:", block.chainid);

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        if (block.chainid == 84532) {
            // ==========================================
            // DEPLOYMENT TRÊN BASE SEPOLIA (CHAIN ID 84532)
            // ==========================================
            console.log("--- Trien khai Testbed & ActionVault tren Base Sepolia ---");

            MockWETH weth = new MockWETH();
            console.log("MockWETH deployed at:", address(weth));

            MockUSDC usdc = new MockUSDC();
            console.log("MockUSDC deployed at:", address(usdc));

            MockUniswapV2Pair pair = new MockUniswapV2Pair(address(weth), address(usdc));
            console.log("MockUniswapV2Pair deployed at:", address(pair));

            // Set initial liquidity: 1 ETH = $2,000 USDC
            pair.setReserves(1 ether, 2000 ether);
            console.log("Initial reserves set: 1 WETH / 2000 USDC");

            MockUniswapV2Router router = new MockUniswapV2Router(address(weth), address(pair));
            console.log("MockUniswapV2Router deployed at:", address(router));

            // Ví lạnh dự phòng mặc định là deployer
            address coldWallet = deployer;

            uint256 vaultFunding = vm.envOr("VAULT_FUNDING", uint256(0.002 ether));

            ActionVault vault = new ActionVault{value: vaultFunding}(
                CALLBACK_PROXY_BASE_SEPOLIA,
                coldWallet,
                address(router),
                address(usdc),
                address(pair)
            );
            console.log("ActionVault deployed at:", address(vault));
            console.log("ActionVault funded with ETH:", vaultFunding);
        } else if (block.chainid == 5318007) {
            // ==========================================
            // DEPLOYMENT TRÊN REACTIVE LASNA (CHAIN ID 5318007)
            // ==========================================
            console.log("--- Trien khai StopLoss_Pipeline tren Reactive Lasna ---");

            address pairAddress = vm.envOr("PAIR_ADDRESS", address(0));
            address vaultAddress = vm.envOr("VAULT_ADDRESS", address(0));

            require(pairAddress != address(0), "PAIR_ADDRESS must be set");
            require(vaultAddress != address(0), "VAULT_ADDRESS must be set");

            uint256 priceThreshold = 1800 ether; // Cắt lỗ dưới $1,800
            uint256 cooldownSeconds = 300; // 5 phút cooldown
            uint256 percentToSwap = 50; // Bán 50%
            uint256 requiredHits = 1; // Stateless ReactVM: 1 hit trigger
            uint256 velocityBps = 0;
            uint256 windowSec = 0;
            uint256 originChain = 84532; // Base Sepolia
            uint256 originTopic = 0;

            uint256 rscFunding = vm.envOr("RSC_FUNDING", uint256(0.05 ether));

            StopLoss_Pipeline rsc = new StopLoss_Pipeline{value: rscFunding}(
                pairAddress,
                priceThreshold,
                cooldownSeconds,
                percentToSwap,
                vaultAddress,
                requiredHits,
                velocityBps,
                windowSec,
                originChain,
                originTopic
            );
            console.log("StopLoss_Pipeline deployed at:", address(rsc));
            console.log("StopLoss_Pipeline funded with lREACT:", rscFunding);
        }

        vm.stopBroadcast();
        console.log("=== DEPLOYMENT COMPLETE ===");
    }
}
