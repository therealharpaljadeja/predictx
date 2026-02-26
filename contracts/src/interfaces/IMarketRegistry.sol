// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMarketRegistry {
    enum MarketStatus {
        Open,
        Closed,
        Resolved,
        Cancelled
    }

    enum ComparisonOperator {
        GreaterThanOrEqual,
        LessThanOrEqual,
        GreaterThan,
        LessThan,
        Equal
    }

    struct Market {
        string description;
        string endpointPath;
        string jsonPath;
        uint256 targetValue;
        ComparisonOperator operator;
        uint48 bettingDeadline;
        uint48 resolutionDate;
        uint48 createdAt;
        MarketStatus status;
        address creator;
    }

    event MarketCreated(
        uint256 indexed marketId,
        string endpointPath,
        string jsonPath,
        uint256 targetValue,
        ComparisonOperator operator,
        uint48 bettingDeadline,
        uint48 resolutionDate
    );

    event MarketStatusUpdated(uint256 indexed marketId, MarketStatus status);

    function createMarket(
        string calldata description,
        string calldata endpointPath,
        string calldata jsonPath,
        uint256 targetValue,
        ComparisonOperator operator,
        uint48 bettingDeadline,
        uint48 resolutionDate
    ) external returns (uint256);

    function cancelMarket(uint256 marketId) external;
    function closeMarket(uint256 marketId) external;
    function resolveMarket(uint256 marketId, bool targetMet) external;

    function getMarket(uint256 marketId) external view returns (Market memory);
    function isMarketOpen(uint256 marketId) external view returns (bool);
    function isMarketResolved(uint256 marketId) external view returns (bool);
    function isMarketCancelled(uint256 marketId) external view returns (bool);
    function getTargetValue(uint256 marketId) external view returns (uint256);
    function nextMarketId() external view returns (uint256);
}
