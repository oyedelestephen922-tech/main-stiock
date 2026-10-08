// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StonkDrawdownRetire
 * @notice Receives protocol fees, executes buy-and-burn for the protocol token ($GAINS),
 * and permanently retires them to the dead address.
 * Can be deployed before the token is launched, with setToken() callable once live.
 */
contract StonkDrawdownRetire is Ownable {
    using SafeERC20 for IERC20;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    address public protocolToken; // $GAINS token address (set when launched)

    event ProtocolTokenSet(address indexed token);
    event Retired(address indexed token, uint256 amount);

    constructor(address _protocolToken) Ownable(msg.sender) {
        protocolToken = _protocolToken;
    }

    function setProtocolToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        protocolToken = _token;
        emit ProtocolTokenSet(_token);
    }

    /**
     * @notice Burns tokens held by sending them to the DEAD address.
     */
    function drawdown(address token) external {
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) {
            IERC20(token).safeTransfer(DEAD, bal);
            emit Retired(token, bal);
        }
    }
}
