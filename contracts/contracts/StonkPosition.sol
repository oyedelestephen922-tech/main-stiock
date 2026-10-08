// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StonkPosition
 * @notice Manages concentrated liquidity position bounds on Uniswap for a StonkWell.
 */
contract StonkPosition {
    address public immutable well;
    address public immutable keeper;

    int24 public tickLower;
    int24 public tickUpper;
    uint128 public liquidity;

    struct Slot0 {
        uint160 sqrtPriceX96;
        int24 tick;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        uint8 feeProtocol;
        bool unlocked;
    }

    Slot0 private _slot0;

    event Rebalanced(int24 tickLower, int24 tickUpper, uint128 liquidity);

    error Unauthorized();

    modifier onlyAuthorized() {
        if (msg.sender != well && msg.sender != keeper) revert Unauthorized();
        _;
    }

    constructor(address _well, address _keeper) {
        well = _well;
        keeper = _keeper;
        tickLower = -887220;
        tickUpper = 887220;
    }

    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        )
    {
        return (
            _slot0.sqrtPriceX96,
            _slot0.tick,
            _slot0.observationIndex,
            _slot0.observationCardinality,
            _slot0.observationCardinalityNext,
            _slot0.feeProtocol,
            _slot0.unlocked
        );
    }

    function spotUsdgValue(uint256 equityAmount) external pure returns (uint256) {
        return equityAmount / 1e12; // 18 decimals -> 6 decimals base conversion
    }

    function setRange(
        int24 lower,
        int24 upper,
        uint128 liq,
        int24 currentTick,
        uint160 sqrtPrice
    ) external onlyAuthorized {
        tickLower = lower;
        tickUpper = upper;
        liquidity = liq;
        _slot0.tick = currentTick;
        _slot0.sqrtPriceX96 = sqrtPrice;
        emit Rebalanced(lower, upper, liq);
    }
}
