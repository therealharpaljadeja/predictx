// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MarketRegistry} from "../src/MarketRegistry.sol";
import {IMarketRegistry} from "../src/interfaces/IMarketRegistry.sol";

contract MarketRegistryTest is Test {
    MarketRegistry public registry;
    address public admin = address(this);
    address public user = address(0xBEEF);
    address public pool = address(0x1);
    address public resolution = address(0x2);

    string constant ENDPOINT = "users/by/username/elonmusk?user.fields=public_metrics";
    string constant JSON_PATH = "data.public_metrics.followers_count";

    function setUp() public {
        registry = new MarketRegistry();
        registry.initialize(pool, resolution);
    }

    function test_CreateMarket() public {
        uint256 id = registry.createMarket(
            "Will Elon hit 200M followers?",
            ENDPOINT,
            JSON_PATH,
            200_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        assertEq(id, 0);
        assertEq(registry.nextMarketId(), 1);

        IMarketRegistry.Market memory m = registry.getMarket(0);
        assertEq(m.endpointPath, ENDPOINT);
        assertEq(m.jsonPath, JSON_PATH);
        assertEq(m.targetValue, 200_000_000);
        assertEq(uint8(m.operator), uint8(IMarketRegistry.ComparisonOperator.GreaterThanOrEqual));
        assertEq(uint8(m.status), uint8(IMarketRegistry.MarketStatus.Open));
    }

    function test_CreateMultipleMarkets() public {
        registry.createMarket("desc1", "endpoint1", "path1", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        registry.createMarket("desc2", "endpoint2", "path2", 200, IMarketRegistry.ComparisonOperator.LessThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        assertEq(registry.nextMarketId(), 2);
    }

    function test_RevertCreateMarket_NotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
    }

    function test_RevertCreateMarket_EmptyEndpointPath() public {
        vm.expectRevert(MarketRegistry.EmptyEndpointPath.selector);
        registry.createMarket("desc", "", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
    }

    function test_RevertCreateMarket_EmptyJsonPath() public {
        vm.expectRevert(MarketRegistry.EmptyJsonPath.selector);
        registry.createMarket("desc", "endpoint", "", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
    }

    function test_RevertCreateMarket_ZeroTarget() public {
        vm.expectRevert(MarketRegistry.InvalidTarget.selector);
        registry.createMarket("desc", "endpoint", "path", 0, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
    }

    function test_RevertCreateMarket_InvalidDates() public {
        vm.expectRevert(MarketRegistry.InvalidDates.selector);
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp - 1), uint48(block.timestamp + 2 days));
    }

    function test_RevertCreateMarket_ResolutionBeforeDeadline() public {
        vm.expectRevert(MarketRegistry.InvalidDates.selector);
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 2 days), uint48(block.timestamp + 1 days));
    }

    function test_CancelMarket() public {
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        registry.cancelMarket(0);
        assertTrue(registry.isMarketCancelled(0));
    }

    function test_CloseMarket() public {
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        registry.closeMarket(0);
        IMarketRegistry.Market memory m = registry.getMarket(0);
        assertEq(uint8(m.status), uint8(IMarketRegistry.MarketStatus.Closed));
    }

    function test_ResolveMarket() public {
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        vm.prank(resolution);
        registry.resolveMarket(0, true);
        assertTrue(registry.isMarketResolved(0));
    }

    function test_RevertResolveMarket_NotResolution() public {
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        vm.prank(user);
        vm.expectRevert(MarketRegistry.UnauthorizedResolver.selector);
        registry.resolveMarket(0, true);
    }

    function test_IsMarketOpen() public {
        registry.createMarket("desc", "endpoint", "path", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 1 days), uint48(block.timestamp + 2 days));
        assertTrue(registry.isMarketOpen(0));

        // After deadline
        vm.warp(block.timestamp + 2 days);
        assertFalse(registry.isMarketOpen(0));
    }

    function test_RevertInitializeTwice() public {
        vm.expectRevert(MarketRegistry.AlreadyInitialized.selector);
        registry.initialize(pool, resolution);
    }
}
