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
 * @notice Két an toàn phi lưu ký (Non-Custodial) thuộc sở hữu của người dùng trên Base Sepolia.
 * @dev Kế thừa AbstractCallback để xác thực an toàn các cuộc gọi từ Reactive Callback Proxy.
 */
contract ActionVault is AbstractCallback {
    address public immutable owner;
    address public immutable backupSafeAddress; // Ví lạnh dự phòng nhận tiền khi ví owner bị hack
    mapping(address => bool) public authorizedRSCs; // Hỗ trợ đa Pipeline song song
    address public immutable uniswapRouter;
    address public immutable usdcToken;
    address public immutable tokenPair;

    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5% trượt giá tối đa cho phép

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
     * @notice Cấp quyền hoặc tước quyền thực thi của một hợp đồng RSC
     * @param _rsc Địa chỉ hợp đồng RSC trên Reactive Lasna
     * @param _status true = cấp quyền, false = tước quyền
     */
    function setAuthorizedRSC(address _rsc, bool _status) external onlyOwner {
        require(_rsc != address(0), "Invalid RSC");
        authorizedRSCs[_rsc] = _status;
        emit RSCAuthorized(_rsc, _status);
    }

    /**
     * @notice Thực thi lệnh cắt lỗ từ Reactive Network
     * @param rvmId Slot 1: Được Reactive Callback Proxy tự động ghi đè bằng RVM ID
     * @param rscContract Slot 2: Địa chỉ thực sự của hợp đồng StopLoss_Pipeline.sol
     * @param percentToSwap Tỷ lệ ETH trong vault cần bán (1 - 100)
     * @param thresholdPriceUSD Ngưỡng giá đã kích hoạt lệnh tại thời điểm origin
     */
    function executeStopLoss(
        address rvmId,
        address rscContract,
        uint256 percentToSwap,
        uint256 thresholdPriceUSD
    ) external authorizedSenderOnly {
        require(authorizedRSCs[rscContract], "Unauthorized RSC contract");
        require(percentToSwap > 0 && percentToSwap <= 100, "Invalid swap percent");

        uint256 ethBalance = address(this).balance;
        require(ethBalance > 0, "No ETH available in vault");

        // PATTERN 3: TÁI THẨM ĐỊNH GIÁ TỨC THỜI (LIVE PRICE RE-VALIDATION)
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(tokenPair).getReserves();
        require(reserve0 > 0, "Empty pool reserve");
        uint256 livePrice = (uint256(reserve1) * 1e18) / uint256(reserve0);

        if (livePrice > thresholdPriceUSD) {
            emit OrderSkipped("Price bounced back above stop threshold", livePrice);
            return;
        }

        uint256 swapAmount = (ethBalance * percentToSwap) / 100;

        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(uniswapRouter).WETH();
        path[1] = usdcToken;

        // TÍNH minAmountOut CHUẨN XÁC QUA getAmountsOut CỦA ROUTER (TÍNH CẢ PHÍ VÀ ĐỘ TRƯỢT x*y=k)
        uint256[] memory amountsOut = IUniswapV2Router02(uniswapRouter).getAmountsOut(swapAmount, path);
        uint256 minAmountOut = (amountsOut[1] * (10000 - MAX_SLIPPAGE_BPS)) / 10000;

        emit StopLossExecuted(swapAmount, minAmountOut, block.timestamp);

        // Thực hiện swap và chuyển USDC thẳng về ví User (owner), không giữ lại trong Vault!
        IUniswapV2Router02(uniswapRouter).swapExactETHForTokens{value: swapAmount}(
            minAmountOut,
            path,
            owner,
            block.timestamp + 300
        );
    }

    // =========================================================================
    // EMERGENCY SAFE SWEEP: TẨU TÁN KHẨN CẤP VỀ VÍ LẠNH KHI VÍ OWNER BỊ HACK PHISHING
    // =========================================================================
    function executeSafeSweep(
        address rvmId,
        address rscContract
    ) external authorizedSenderOnly {
        require(authorizedRSCs[rscContract], "Unauthorized RSC contract");
        uint256 balance = address(this).balance;
        require(balance > 0, "Zero vault balance");

        emit SafeSwept(backupSafeAddress, balance);
        payable(backupSafeAddress).transfer(balance);
    }

    // =========================================================================
    // PANIC BUTTON: RÚT TIỀN KHẨN CẤP PHI LƯU KÝ (NON-CUSTODIAL EMERGENCY EXIT)
    // =========================================================================
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Zero vault balance");

        emit EmergencyWithdrawn(owner, balance);
        payable(owner).transfer(balance);
    }

    receive() external payable override {}
}
