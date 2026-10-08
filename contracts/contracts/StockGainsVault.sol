// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ISwapRouter.sol";

/**
 * @title StockGainsVault
 * @notice Non-custodial take-profit vault for tokenized equities on Robinhood Chain Mainnet.
 */
contract StockGainsVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    enum OrderStatus {
        Active,
        Executed,
        Cancelled
    }

    struct Order {
        uint256 id;
        address owner;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 targetPrice;
        uint256 minAmountOut;
        OrderStatus status;
        uint256 createdAt;
        uint256 executedAt;
        uint256 fillPrice;
    }

    IPriceOracle public oracle;
    ISwapRouter public router;

    uint256 public nextOrderId = 1;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) private _userOrders;

    uint256[] private _activeOrderIds;
    mapping(uint256 => uint256) private _activeOrderIndex;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed owner,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 minAmountOut
    );

    event OrderCancelled(uint256 indexed orderId, address indexed owner);

    event OrderExecuted(
        uint256 indexed orderId,
        address indexed owner,
        address indexed executor,
        uint256 fillPrice,
        uint256 amountIn,
        uint256 amountOut
    );

    event OracleUpdated(address indexed newOracle);
    event RouterUpdated(address indexed newRouter);

    constructor(address _oracle, address _router) Ownable(msg.sender) {
        require(_oracle != address(0), "Invalid oracle");
        require(_router != address(0), "Invalid router");
        oracle = IPriceOracle(_oracle);
        router = ISwapRouter(_router);
    }

    function createOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 orderId) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token");
        require(tokenIn != tokenOut, "Same tokens");
        require(amountIn > 0, "Amount must be > 0");
        require(targetPrice > 0, "Target price must be > 0");

        (uint256 currentPrice, ) = oracle.getPrice(tokenIn);
        require(targetPrice > currentPrice, "Target must exceed current price");

        orderId = nextOrderId++;

        orders[orderId] = Order({
            id: orderId,
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            targetPrice: targetPrice,
            minAmountOut: minAmountOut,
            status: OrderStatus.Active,
            createdAt: block.timestamp,
            executedAt: 0,
            fillPrice: 0
        });

        _userOrders[msg.sender].push(orderId);
        _addActiveOrder(orderId);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        emit OrderCreated(orderId, msg.sender, tokenIn, tokenOut, amountIn, targetPrice, minAmountOut);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.owner == msg.sender, "Not order owner");
        require(order.status == OrderStatus.Active, "Order not active");

        order.status = OrderStatus.Cancelled;
        _removeActiveOrder(orderId);

        IERC20(order.tokenIn).safeTransfer(order.owner, order.amountIn);

        emit OrderCancelled(orderId, msg.sender);
    }

    function executeOrder(uint256 orderId, uint256 minAmountOut) public nonReentrant whenNotPaused returns (uint256 amountOut) {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Active, "Order not active");

        (uint256 currentPrice, ) = oracle.getPrice(order.tokenIn);
        require(currentPrice >= order.targetPrice, "Target price not reached");

        order.status = OrderStatus.Executed;
        order.executedAt = block.timestamp;
        order.fillPrice = currentPrice;

        _removeActiveOrder(orderId);

        uint256 effectiveMinOut = minAmountOut > order.minAmountOut ? minAmountOut : order.minAmountOut;

        IERC20(order.tokenIn).forceApprove(address(router), order.amountIn);

        amountOut = router.swapExactTokensForTokens(
            order.amountIn,
            effectiveMinOut,
            order.tokenIn,
            order.tokenOut,
            order.owner
        );

        emit OrderExecuted(orderId, order.owner, msg.sender, currentPrice, order.amountIn, amountOut);
    }

    function batchExecute(uint256[] calldata orderIds, uint256[] calldata minAmountOuts) external {
        require(orderIds.length == minAmountOuts.length, "Array length mismatch");
        for (uint256 i = 0; i < orderIds.length; i++) {
            executeOrder(orderIds[i], minAmountOuts[i]);
        }
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return _userOrders[user];
    }

    function getActiveOrders() external view returns (uint256[] memory) {
        return _activeOrderIds;
    }

    function activeOrderCount() external view returns (uint256) {
        return _activeOrderIds.length;
    }

    function _addActiveOrder(uint256 orderId) internal {
        _activeOrderIds.push(orderId);
        _activeOrderIndex[orderId] = _activeOrderIds.length;
    }

    function _removeActiveOrder(uint256 orderId) internal {
        uint256 indexPlusOne = _activeOrderIndex[orderId];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _activeOrderIds.length - 1;

        if (index != lastIndex) {
            uint256 lastOrderId = _activeOrderIds[lastIndex];
            _activeOrderIds[index] = lastOrderId;
            _activeOrderIndex[lastOrderId] = index + 1;
        }

        _activeOrderIds.pop();
        delete _activeOrderIndex[orderId];
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        oracle = IPriceOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        router = ISwapRouter(_router);
        emit RouterUpdated(_router);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
