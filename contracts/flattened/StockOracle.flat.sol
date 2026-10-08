// Sources flattened with hardhat v2.29.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/interfaces/IPriceOracle.sol

// Original license: SPDX_License_Identifier: MIT
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


// File contracts/StockOracle.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;


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
