// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISwapRouter {
    /**
     * @notice Swaps exact amount of input tokens for output tokens.
     * @param amountIn Amount of tokenIn to swap.
     * @param amountOutMin Minimum acceptable amount of tokenOut.
     * @param tokenIn Input token address.
     * @param tokenOut Output token address.
     * @param to Recipient address for tokenOut.
     * @return amountOut The actual amount of tokenOut received.
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut,
        address to
    ) external returns (uint256 amountOut);
}
