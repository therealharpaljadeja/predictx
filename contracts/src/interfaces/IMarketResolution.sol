// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IMarketRegistry} from "./IMarketRegistry.sol";

interface IMarketResolution {
    struct Resolution {
        uint256 marketId;
        uint256 actualValue;
        bool targetMet;
        uint48 resolvedAt;
    }

    event SettlementRequested(
        uint256 indexed marketId,
        string endpointPath,
        string jsonPath,
        uint256 targetValue,
        IMarketRegistry.ComparisonOperator operator,
        uint48 resolutionDate
    );

    event MarketResolved(
        uint256 indexed marketId,
        uint256 actualValue,
        bool targetMet
    );

    function requestSettlement(uint256 marketId) external;
    function getResolution(uint256 marketId) external view returns (Resolution memory);
    function getOutcome(uint256 marketId) external view returns (bool targetMet);
}
