// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StonkFeeRouter
 * @notice Routes the 30% protocol fees collected from Wells to the DrawdownRetire contract.
 * Includes a 48-hour timelock on updating the destination to protect protocol governance.
 */
contract StonkFeeRouter is Ownable {
    using SafeERC20 for IERC20;

    address public drawdownRetire;
    address public pendingDrawdownRetire;
    uint256 public pendingEffectiveTimestamp;
    uint256 public constant TIMELOCK_DELAY = 48 hours;

    event DrawdownRetireProposed(address indexed pending, uint256 effectiveTimestamp);
    event DrawdownRetireUpdated(address indexed target);
    event FeesForwarded(address indexed token, uint256 amount);

    constructor(address _drawdownRetire) Ownable(msg.sender) {
        drawdownRetire = _drawdownRetire;
    }

    function proposeDrawdownRetire(address newTarget) external onlyOwner {
        require(newTarget != address(0), "Invalid target");
        pendingDrawdownRetire = newTarget;
        pendingEffectiveTimestamp = block.timestamp + TIMELOCK_DELAY;
        emit DrawdownRetireProposed(newTarget, pendingEffectiveTimestamp);
    }

    function executeDrawdownRetire() external onlyOwner {
        require(pendingDrawdownRetire != address(0), "No pending update");
        require(block.timestamp >= pendingEffectiveTimestamp, "Timelock active");
        drawdownRetire = pendingDrawdownRetire;
        pendingDrawdownRetire = address(0);
        pendingEffectiveTimestamp = 0;
        emit DrawdownRetireUpdated(drawdownRetire);
    }

    /**
     * @notice Forwards any tokens held by the router to the DrawdownRetire contract.
     */
    function forwardFees(address token) external {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0 && drawdownRetire != address(0)) {
            IERC20(token).safeTransfer(drawdownRetire, bal);
            emit FeesForwarded(token, bal);
        }
    }
}
