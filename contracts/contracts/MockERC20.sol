// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Standard ERC-20 token for tokenized stocks and settlement stablecoins on Robinhood Chain.
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private immutable _customDecimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _customDecimals = decimals_;
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Test faucet allowing claim of test tokens.
     * @param to Recipient address
     * @param amount Token amount to mint
     */
    function faucet(address to, uint256 amount) external {
        require(amount <= 10_000 * (10 ** _customDecimals), "Exceeds max faucet amount");
        _mint(to, amount);
    }
}
