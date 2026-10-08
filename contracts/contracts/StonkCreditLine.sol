// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWellMinimal {
    function totalAssets() external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title StonkCreditLine
 * @notice Isolated Borrow Desk allowing users to borrow USDG against StonkWell shares.
 * 65% Max LTV with 80% liquidation threshold.
 */
contract StonkCreditLine is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable well;
    address public immutable usdg;

    uint256 public constant MAX_LTV = 6500; // 65% (bps)
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% (bps)
    uint256 public borrowRatePerYear = 800; // 8% APR (bps)
    uint256 public supplyRatePerYear = 550; // 5.5% APR (bps)

    uint256 public totalCash;
    uint256 public totalDebt;
    uint256 public totalCollateralShares;

    struct Account {
        uint256 collateralShares;
        uint256 borrowedUsdg;
    }

    mapping(address => Account) public accounts;

    event CollateralPledged(address indexed user, uint256 shares);
    event CollateralReleased(address indexed user, uint256 shares);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event LiquiditySupplied(address indexed lender, uint256 amount);
    event LiquidityWithdrawn(address indexed lender, uint256 amount);

    constructor(address _well, address _usdg) Ownable(msg.sender) {
        require(_well != address(0) && _usdg != address(0), "Invalid addresses");
        well = _well;
        usdg = _usdg;
    }

    function shareValueInUsdg(uint256 shares) public view returns (uint256) {
        uint256 supply = IWellMinimal(well).totalSupply();
        uint256 assets = IWellMinimal(well).totalAssets();
        if (supply == 0) return 0;
        return (shares * assets) / supply;
    }

    function collateralValue(address user) public view returns (uint256) {
        return shareValueInUsdg(accounts[user].collateralShares);
    }

    function maxBorrow(address user) public view returns (uint256) {
        uint256 cVal = collateralValue(user);
        return (cVal * MAX_LTV) / 10000;
    }

    function borrowable(address user) public view returns (uint256) {
        uint256 maxB = maxBorrow(user);
        uint256 debt = accounts[user].borrowedUsdg;
        if (debt >= maxB) return 0;
        return maxB - debt;
    }

    function healthFactor(address user) public view returns (uint256) {
        uint256 debt = accounts[user].borrowedUsdg;
        if (debt == 0) return type(uint256).max;
        uint256 cVal = collateralValue(user);
        return (cVal * LIQUIDATION_THRESHOLD * 1e18) / (debt * 10000);
    }

    function pledge(uint256 shares) external nonReentrant {
        require(shares > 0, "Zero shares");
        IERC20(well).safeTransferFrom(msg.sender, address(this), shares);
        accounts[msg.sender].collateralShares += shares;
        totalCollateralShares += shares;
        emit CollateralPledged(msg.sender, shares);
    }

    function release(uint256 shares) external nonReentrant {
        require(shares > 0, "Zero shares");
        Account storage acc = accounts[msg.sender];
        require(acc.collateralShares >= shares, "Insufficient collateral");

        acc.collateralShares -= shares;
        totalCollateralShares -= shares;

        if (acc.borrowedUsdg > 0) {
            require(healthFactor(msg.sender) >= 1e18, "Below liquidation threshold");
        }

        IERC20(well).safeTransfer(msg.sender, shares);
        emit CollateralReleased(msg.sender, shares);
    }

    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(borrowable(msg.sender) >= amount, "Exceeds max LTV");
        require(IERC20(usdg).balanceOf(address(this)) >= amount, "Insufficient pool cash");

        accounts[msg.sender].borrowedUsdg += amount;
        totalDebt += amount;
        if (totalCash >= amount) totalCash -= amount;

        IERC20(usdg).safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        Account storage acc = accounts[msg.sender];
        uint256 payAmount = amount > acc.borrowedUsdg ? acc.borrowedUsdg : amount;

        acc.borrowedUsdg -= payAmount;
        totalDebt -= payAmount;
        totalCash += payAmount;

        IERC20(usdg).safeTransferFrom(msg.sender, address(this), payAmount);
        emit Repaid(msg.sender, payAmount);
    }

    function lend(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        IERC20(usdg).safeTransferFrom(msg.sender, address(this), amount);
        totalCash += amount;
        emit LiquiditySupplied(msg.sender, amount);
    }

    function withdrawLend(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= totalCash, "Exceeds cash");
        totalCash -= amount;
        IERC20(usdg).safeTransfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, amount);
    }
}
