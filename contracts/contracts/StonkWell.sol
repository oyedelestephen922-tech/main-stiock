// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPriceOracle.sol";

interface IStonkPosition {
    function setRange(int24 lower, int24 upper, uint128 liq, int24 currentTick, uint160 sqrtPrice) external;
}

/**
 * @title StonkWell
 * @notice ERC-4626 single-sided liquidity vault for tokenized equities on Robinhood Chain.
 * Users deposit USDG to mint yield-bearing shares (w[Stock]).
 * 70% of swap fees compound directly to share value; 30% routes to protocol fee router.
 */
contract StonkWell is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable equityToken;
    address public immutable usdg;
    address public oracle;
    address public position;
    address public feeRouter;
    address public keeper;

    uint256 public heldValueCap = 50_000 * 1e6; // $50,000 USDG initial cap
    uint256 public constant protocolShareBps = 3000; // 30%
    bool public paused;

    event DepositAssets(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
    event WithdrawAssets(address indexed caller, address indexed receiver, uint256 assets, uint256 shares);
    event RedeemInKind(address indexed receiver, uint256 shares, uint256 equityOut, uint256 usdgOut);
    event FeesHarvested(uint256 equityFees, uint256 usdgFees, uint256 protocolEquity, uint256 protocolUsdg);
    event CapUpdated(uint256 newCap);
    event PausedUpdated(bool isPaused);
    event KeeperUpdated(address newKeeper);

    modifier onlyKeeperOrOwner() {
        require(msg.sender == owner() || msg.sender == keeper, "Not keeper or owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _equityToken,
        address _usdg,
        address _oracle,
        address _feeRouter,
        address _keeper
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_equityToken != address(0) && _usdg != address(0), "Invalid tokens");
        equityToken = _equityToken;
        usdg = _usdg;
        oracle = _oracle;
        feeRouter = _feeRouter;
        keeper = _keeper;
    }

    function setPosition(address _position) external onlyOwner {
        position = _position;
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
        emit KeeperUpdated(_keeper);
    }

    function setFeeRouter(address _feeRouter) external onlyOwner {
        feeRouter = _feeRouter;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setHeldValueCap(uint256 _cap) external onlyOwner {
        heldValueCap = _cap;
        emit CapUpdated(_cap);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedUpdated(_paused);
    }

    function holdings() public view returns (uint256 equityHeld, uint256 usdgHeld) {
        equityHeld = IERC20(equityToken).balanceOf(address(this));
        usdgHeld = IERC20(usdg).balanceOf(address(this));
    }

    function totalAssets() public view returns (uint256) {
        (uint256 equityHeld, uint256 usdgHeld) = holdings();
        uint256 equityValueUsdg = 0;
        if (equityHeld > 0 && oracle != address(0)) {
            try IPriceOracle(oracle).getPrice(equityToken) returns (uint256 price, uint256) {
                // equityHeld is 18 decimals, price is 8 decimals USD -> USDG (6 decimals)
                equityValueUsdg = (equityHeld * price) / (1e8 * 1e12);
            } catch {}
        }
        return usdgHeld + equityValueUsdg;
    }

    function priceFresh() public view returns (bool) {
        if (oracle == address(0)) return false;
        try IPriceOracle(oracle).getPrice(equityToken) returns (uint256 price, uint256 updatedAt) {
            return price > 0 && (block.timestamp - updatedAt <= 26 hours);
        } catch {
            return false;
        }
    }

    function deposit(uint256 assets, address receiver) external nonReentrant returns (uint256 shares) {
        require(!paused, "Vault is paused");
        require(assets > 0, "Zero deposit");
        require(priceFresh(), "Oracle price stale");

        uint256 total = totalAssets();
        require(total + assets <= heldValueCap, "Exceeds held value cap");

        uint256 supply = totalSupply();
        if (supply == 0 || total == 0) {
            shares = assets * 1e12; // 6 decimals USDG -> 18 decimals shares
        } else {
            shares = (assets * supply) / total;
        }

        IERC20(usdg).safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);

        emit DepositAssets(msg.sender, receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address ownerAccount) external nonReentrant returns (uint256 shares) {
        require(!paused, "Vault is paused");
        require(assets > 0, "Zero withdrawal");

        uint256 total = totalAssets();
        uint256 supply = totalSupply();
        require(supply > 0 && total > 0, "No assets");

        shares = (assets * supply) / total;
        if (msg.sender != ownerAccount) {
            uint256 allowed = allowance(ownerAccount, msg.sender);
            require(allowed >= shares, "Insufficient allowance");
            _approve(ownerAccount, msg.sender, allowed - shares);
        }

        _burn(ownerAccount, shares);
        IERC20(usdg).safeTransfer(receiver, assets);

        emit WithdrawAssets(msg.sender, receiver, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address ownerAccount) external nonReentrant returns (uint256 assets) {
        require(!paused, "Vault is paused");
        require(shares > 0, "Zero shares");

        uint256 total = totalAssets();
        uint256 supply = totalSupply();
        require(supply > 0, "No shares");

        assets = (shares * total) / supply;
        if (msg.sender != ownerAccount) {
            uint256 allowed = allowance(ownerAccount, msg.sender);
            require(allowed >= shares, "Insufficient allowance");
            _approve(ownerAccount, msg.sender, allowed - shares);
        }

        _burn(ownerAccount, shares);
        IERC20(usdg).safeTransfer(receiver, assets);

        emit WithdrawAssets(msg.sender, receiver, assets, shares);
    }

    /**
     * @notice Emergency in-kind redemption allowing users to retrieve proportional equity and USDG directly,
     * even if the vault is paused or the oracle is offline.
     */
    function redeemInKind(uint256 shares, address receiver) external nonReentrant returns (uint256 equityOut, uint256 usdgOut) {
        require(shares > 0, "Zero shares");
        uint256 supply = totalSupply();
        require(supply > 0, "No shares");

        (uint256 equityHeld, uint256 usdgHeld) = holdings();
        equityOut = (shares * equityHeld) / supply;
        usdgOut = (shares * usdgHeld) / supply;

        _burn(msg.sender, shares);

        if (equityOut > 0) {
            IERC20(equityToken).safeTransfer(receiver, equityOut);
        }
        if (usdgOut > 0) {
            IERC20(usdg).safeTransfer(receiver, usdgOut);
        }

        emit RedeemInKind(receiver, shares, equityOut, usdgOut);
    }

    /**
     * @notice Harvests fees, splits 70% to vault shares and forwards 30% to the fee router.
     */
    function harvest(uint256 equityFees, uint256 usdgFees) external onlyKeeperOrOwner nonReentrant {
        uint256 protocolEquity = (equityFees * protocolShareBps) / 10000;
        uint256 protocolUsdg = (usdgFees * protocolShareBps) / 10000;

        if (feeRouter != address(0)) {
            if (protocolEquity > 0) {
                IERC20(equityToken).safeTransfer(feeRouter, protocolEquity);
            }
            if (protocolUsdg > 0) {
                IERC20(usdg).safeTransfer(feeRouter, protocolUsdg);
            }
        }

        emit FeesHarvested(equityFees, usdgFees, protocolEquity, protocolUsdg);
    }
}
