// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";
import {IMarketRegistry} from "./interfaces/IMarketRegistry.sol";
import {IMarketResolution} from "./interfaces/IMarketResolution.sol";

contract MarketResolution is IMarketResolution, ReceiverTemplate, Ownable {
    IMarketRegistry public immutable registry;

    mapping(uint256 => Resolution) private resolutions;

    error AlreadyResolved();
    error MarketNotFound();

    constructor(
        address _keystoneForwarder,
        address _registry
    ) ReceiverTemplate(_keystoneForwarder) Ownable(msg.sender) {
        registry = IMarketRegistry(_registry);
    }

    /// @notice Admin fallback: emit event so CRE EVM log trigger can pick it up
    function requestSettlement(uint256 marketId) external onlyOwner {
        IMarketRegistry.Market memory market = registry.getMarket(marketId);
        if (market.createdAt == 0) revert MarketNotFound();
        if (resolutions[marketId].resolvedAt != 0) revert AlreadyResolved();

        emit SettlementRequested(
            marketId,
            market.endpointPath,
            market.jsonPath,
            market.targetValue,
            market.operator,
            market.resolutionDate
        );
    }

    /// @notice Processes the signed CRE report
    function _processReport(bytes calldata report) internal override {
        (uint256 marketId, uint256 actualValue) = abi.decode(report, (uint256, uint256));

        if (resolutions[marketId].resolvedAt != 0) revert AlreadyResolved();

        IMarketRegistry.Market memory market = registry.getMarket(marketId);
        if (market.createdAt == 0) revert MarketNotFound();

        bool targetMet = _compare(actualValue, market.targetValue, market.operator);

        resolutions[marketId] = Resolution({
            marketId: marketId,
            actualValue: actualValue,
            targetMet: targetMet,
            resolvedAt: uint48(block.timestamp)
        });

        registry.resolveMarket(marketId, targetMet);

        emit MarketResolved(marketId, actualValue, targetMet);
    }

    function _compare(
        uint256 actual,
        uint256 target,
        IMarketRegistry.ComparisonOperator op
    ) internal pure returns (bool) {
        if (op == IMarketRegistry.ComparisonOperator.GreaterThanOrEqual) return actual >= target;
        if (op == IMarketRegistry.ComparisonOperator.LessThanOrEqual) return actual <= target;
        if (op == IMarketRegistry.ComparisonOperator.GreaterThan) return actual > target;
        if (op == IMarketRegistry.ComparisonOperator.LessThan) return actual < target;
        return actual == target; // Equal
    }

    function getResolution(uint256 marketId) external view returns (Resolution memory) {
        return resolutions[marketId];
    }

    function getOutcome(uint256 marketId) external view returns (bool targetMet) {
        return resolutions[marketId].targetMet;
    }
}
