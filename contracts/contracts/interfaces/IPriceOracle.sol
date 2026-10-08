// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracle {
    /**
     * @notice Returns the latest price for a token in USD (standardized to 8 decimals).
     * @param token Address of the token.
     * @return price Price in USD with 8 decimals (e.g., $125.50 = 12550000000).
     * @return updatedAt Timestamp when the price was last updated.
     */
    function getPrice(address token) external view returns (uint256 price, uint256 updatedAt);
}
