// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMarketRegistry} from "./interfaces/IMarketRegistry.sol";

contract MarketRegistry is IMarketRegistry, Ownable {
    uint256 public nextMarketId;

    address public bettingPool;
    address public marketResolution;
    bool public initialized;

    mapping(uint256 => Market) private markets;

    error NotInitialized();
    error AlreadyInitialized();
    error InvalidDates();
    error InvalidTarget();
    error EmptyEndpointPath();
    error EmptyJsonPath();
    error MarketNotFound();
    error MarketNotOpen();
    error MarketNotResolvable();
    error UnauthorizedResolver();

    modifier onlyInitialized() {
        if (!initialized) revert NotInitialized();
        _;
    }

    constructor() Ownable(msg.sender) {}

    function initialize(address _bettingPool, address _marketResolution) external onlyOwner {
        if (initialized) revert AlreadyInitialized();
        bettingPool = _bettingPool;
        marketResolution = _marketResolution;
        initialized = true;
    }

    function createMarket(
        string calldata description,
        string calldata endpointPath,
        string calldata jsonPath,
        uint256 targetValue,
        ComparisonOperator operator,
        uint48 bettingDeadline,
        uint48 resolutionDate
    ) external onlyOwner onlyInitialized returns (uint256) {
        if (bytes(endpointPath).length == 0) revert EmptyEndpointPath();
        if (bytes(jsonPath).length == 0) revert EmptyJsonPath();
        if (targetValue == 0) revert InvalidTarget();
        if (bettingDeadline <= block.timestamp) revert InvalidDates();
        if (resolutionDate <= bettingDeadline) revert InvalidDates();

        uint256 marketId = nextMarketId++;

        markets[marketId] = Market({
            description: description,
            endpointPath: endpointPath,
            jsonPath: jsonPath,
            targetValue: targetValue,
            operator: operator,
            bettingDeadline: bettingDeadline,
            resolutionDate: resolutionDate,
            createdAt: uint48(block.timestamp),
            status: MarketStatus.Open,
            creator: msg.sender
        });

        emit MarketCreated(marketId, endpointPath, jsonPath, targetValue, operator, bettingDeadline, resolutionDate);

        return marketId;
    }

    function cancelMarket(uint256 marketId) external onlyOwner {
        Market storage market = _getExistingMarket(marketId);
        if (market.status != MarketStatus.Open && market.status != MarketStatus.Closed) {
            revert MarketNotOpen();
        }
        market.status = MarketStatus.Cancelled;
        emit MarketStatusUpdated(marketId, MarketStatus.Cancelled);
    }

    function closeMarket(uint256 marketId) external onlyOwner {
        Market storage market = _getExistingMarket(marketId);
        if (market.status != MarketStatus.Open) revert MarketNotOpen();
        market.status = MarketStatus.Closed;
        emit MarketStatusUpdated(marketId, MarketStatus.Closed);
    }

    function resolveMarket(uint256 marketId, bool /*targetMet*/) external onlyInitialized {
        if (msg.sender != marketResolution) revert UnauthorizedResolver();
        Market storage market = _getExistingMarket(marketId);
        if (market.status == MarketStatus.Resolved || market.status == MarketStatus.Cancelled) {
            revert MarketNotResolvable();
        }
        market.status = MarketStatus.Resolved;
        emit MarketStatusUpdated(marketId, MarketStatus.Resolved);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function isMarketOpen(uint256 marketId) external view returns (bool) {
        Market storage market = markets[marketId];
        return market.status == MarketStatus.Open && block.timestamp < market.bettingDeadline;
    }

    function isMarketResolved(uint256 marketId) external view returns (bool) {
        return markets[marketId].status == MarketStatus.Resolved;
    }

    function isMarketCancelled(uint256 marketId) external view returns (bool) {
        return markets[marketId].status == MarketStatus.Cancelled;
    }

    function getTargetValue(uint256 marketId) external view returns (uint256) {
        return markets[marketId].targetValue;
    }

    function _getExistingMarket(uint256 marketId) internal view returns (Market storage) {
        Market storage market = markets[marketId];
        if (market.createdAt == 0) revert MarketNotFound();
        return market;
    }
}
