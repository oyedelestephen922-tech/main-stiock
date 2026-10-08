// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    function decimals() external view returns (uint8);
}

/**
 * @title StockOracle
 * @notice Price Oracle aggregator with staleness guard for tokenized equities on Robinhood Chain Mainnet.
 */
contract StockOracle is IPriceOracle, Ownable {
    uint256 public constant MAX_STALENESS = 26 hours;

    struct FeedConfig {
        address feed;
        uint256 manualPrice; // 8 decimals USD (fallback/override)
        uint256 manualUpdatedAt;
        bool useManual;
    }

    mapping(address => FeedConfig) public configs;
    mapping(address => bool) public isKeeper;

    event FeedConfigured(address indexed token, address indexed feed);
    event ManualPriceSet(address indexed token, uint256 price, uint256 timestamp);
    event KeeperStatusChanged(address indexed keeper, bool status);

    modifier onlyKeeperOrOwner() {
        require(msg.sender == owner() || isKeeper[msg.sender], "Not keeper or owner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setKeeper(address keeper, bool status) external onlyOwner {
        isKeeper[keeper] = status;
        emit KeeperStatusChanged(keeper, status);
    }

    function setFeed(address token, address feed) external onlyOwner {
        require(token != address(0), "Invalid token");
        configs[token].feed = feed;
        emit FeedConfigured(token, feed);
    }

    function setManualPrice(address token, uint256 price) external onlyKeeperOrOwner {
        require(price > 0, "Price must be > 0");
        configs[token].manualPrice = price;
        configs[token].manualUpdatedAt = block.timestamp;
        configs[token].useManual = true;
        emit ManualPriceSet(token, price, block.timestamp);
    }

    function disableManualPrice(address token) external onlyOwner {
        configs[token].useManual = false;
    }

    /**
     * @notice Returns price in USD (8 decimals) and last updated timestamp.
     */
    function getPrice(address token) external view override returns (uint256 price, uint256 updatedAt) {
        FeedConfig memory cfg = configs[token];

        if (cfg.useManual) {
            require(cfg.manualPrice > 0, "Manual price not set");
            return (cfg.manualPrice, cfg.manualUpdatedAt);
        }

        if (cfg.feed != address(0)) {
            (
                ,
                int256 answer,
                ,
                uint256 feedUpdated,
                
            ) = AggregatorV3Interface(cfg.feed).latestRoundData();

            require(answer > 0, "Invalid feed answer");
            require(block.timestamp - feedUpdated <= MAX_STALENESS, "Stale price feed");

            uint8 feedDecimals = AggregatorV3Interface(cfg.feed).decimals();
            if (feedDecimals == 8) {
                return (uint256(answer), feedUpdated);
            } else if (feedDecimals < 8) {
                return (uint256(answer) * (10 ** (8 - feedDecimals)), feedUpdated);
            } else {
                return (uint256(answer) / (10 ** (feedDecimals - 8)), feedUpdated);
            }
        }

        if (cfg.manualPrice > 0) {
            return (cfg.manualPrice, cfg.manualUpdatedAt);
        }

        revert("No price feed or manual price set for token");
    }
}
