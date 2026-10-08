// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IPriceOracle.sol";

interface IUniswapV3Pool {
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function fee() external view returns (uint24);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
}

interface IUniswapV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title StockGainsUniswapRouter
 * @notice Swap router for Robinhood Chain Mainnet connecting to liquidity pools with oracle fallback.
 */
contract StockGainsUniswapRouter is ISwapRouter, Ownable {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public swapRouter; // Canonical Uniswap v3 SwapRouter on Robinhood Chain
    IPriceOracle public oracle;

    uint24[] public defaultFeeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1.0%

    event SwapCompleted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed to
    );

    constructor(
        address _factory,
        address _swapRouter,
        address _oracle
    ) Ownable(msg.sender) {
        factory = _factory;
        swapRouter = _swapRouter;
        oracle = IPriceOracle(_oracle);
    }

    function setSwapRouter(address _swapRouter) external onlyOwner {
        swapRouter = _swapRouter;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = IPriceOracle(_oracle);
    }

    /**
     * @notice Executes exact input swap on Robinhood Chain.
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to
    ) external override returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be > 0");
        require(to != address(0), "Invalid recipient");

        // Pull tokenIn from caller
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // 1. If canonical SwapRouter is configured, try executing via SwapRouter
        if (swapRouter != address(0)) {
            IERC20(tokenIn).forceApprove(swapRouter, amountIn);

            uint24 fee = 3000;
            if (factory != address(0)) {
                for (uint256 i = 0; i < defaultFeeTiers.length; i++) {
                    address pool = IUniswapV3Factory(factory).getPool(tokenIn, tokenOut, defaultFeeTiers[i]);
                    if (pool != address(0)) {
                        fee = defaultFeeTiers[i];
                        break;
                    }
                }
            }

            try IUniswapV3SwapRouter(swapRouter).exactInputSingle(
                IUniswapV3SwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: fee,
                    recipient: to,
                    deadline: block.timestamp + 300,
                    amountIn: amountIn,
                    amountOutMinimum: amountOutMin,
                    sqrtPriceLimitX96: 0
                })
            ) returns (uint256 received) {
                amountOut = received;
                emit SwapCompleted(tokenIn, tokenOut, amountIn, amountOut, to);
                return amountOut;
            } catch {
                // If Uniswap v3 reverts, fall back to oracle-backed direct execution
            }
        }

        // 2. Oracle-backed Direct Liquidity Fallback
        require(address(oracle) != address(0), "No oracle configured");
        (uint256 priceIn, ) = oracle.getPrice(tokenIn);
        (uint256 priceOut, ) = oracle.getPrice(tokenOut);

        // Calculate expected output:
        // Equity tokens typically 18 decimals, USDG/USDC 6 decimals
        uint256 valueInUSD = (amountIn * priceIn) / 1e18;
        amountOut = (valueInUSD * 1e6) / priceOut;

        require(amountOut >= amountOutMin, "Slippage exceeded");
        require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "Insufficient router reserves");

        IERC20(tokenOut).safeTransfer(to, amountOut);
        emit SwapCompleted(tokenIn, tokenOut, amountIn, amountOut, to);
    }

    /**
     * @notice Deposit liquidity reserves to back trades.
     */
    function fundReserves(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Admin can withdraw tokens.
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
