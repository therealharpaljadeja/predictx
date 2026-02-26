// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MarketRegistry} from "../src/MarketRegistry.sol";
import {BettingPool} from "../src/BettingPool.sol";
import {MarketResolution} from "../src/MarketResolution.sol";
import {IMarketRegistry} from "../src/interfaces/IMarketRegistry.sol";
import {IMarketResolution} from "../src/interfaces/IMarketResolution.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract MarketResolutionTest is Test {
    MarketRegistry public registry;
    BettingPool public pool;
    MarketResolution public resolution;
    ERC20Mock public usdc;

    address public admin = address(this);
    address public forwarder = address(0xF0F0);

    string constant ENDPOINT = "users/by/username/elonmusk?user.fields=public_metrics";
    string constant JSON_PATH = "data.public_metrics.followers_count";

    function setUp() public {
        usdc = new ERC20Mock("USDC", "USDC", 6);
        registry = new MarketRegistry();
        pool = new BettingPool(address(usdc), address(registry));
        resolution = new MarketResolution(forwarder, address(registry));

        registry.initialize(address(pool), address(resolution));
        pool.setMarketResolution(address(resolution));

        registry.createMarket(
            "Will Elon hit 200M?",
            ENDPOINT,
            JSON_PATH,
            200_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );
    }

    function test_ProcessReport_TargetMet() public {
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));

        IMarketResolution.Resolution memory r = resolution.getResolution(0);
        assertEq(r.actualValue, 250_000_000);
        assertTrue(r.targetMet);
        assertTrue(r.resolvedAt > 0);
        assertTrue(registry.isMarketResolved(0));
    }

    function test_ProcessReport_TargetNotMet() public {
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(150_000_000)));

        IMarketResolution.Resolution memory r = resolution.getResolution(0);
        assertFalse(r.targetMet);
    }

    function test_ProcessReport_ExactTarget() public {
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(200_000_000)));

        assertTrue(resolution.getOutcome(0));
    }

    function test_RevertProcessReport_NotForwarder() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert();
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));
    }

    function test_RevertProcessReport_DoubleResolve() public {
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));

        vm.prank(forwarder);
        vm.expectRevert(MarketResolution.AlreadyResolved.selector);
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));
    }

    function test_RequestSettlement() public {
        resolution.requestSettlement(0);
    }

    function test_RevertRequestSettlement_NotOwner() public {
        vm.prank(address(0xBEEF));
        vm.expectRevert();
        resolution.requestSettlement(0);
    }

    // --- Comparison operator tests ---

    function _createMarketWithOperator(IMarketRegistry.ComparisonOperator op) internal returns (uint256) {
        return registry.createMarket(
            "Comparison test",
            "tweets/123?tweet.fields=public_metrics",
            "data.public_metrics.like_count",
            100,
            op,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );
    }

    function test_ComparisonOperator_GreaterThanOrEqual_Met() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.GreaterThanOrEqual);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(100)));
        assertTrue(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_GreaterThanOrEqual_NotMet() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.GreaterThanOrEqual);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(99)));
        assertFalse(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_LessThanOrEqual_Met() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.LessThanOrEqual);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(100)));
        assertTrue(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_LessThanOrEqual_NotMet() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.LessThanOrEqual);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(101)));
        assertFalse(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_GreaterThan_Met() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.GreaterThan);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(101)));
        assertTrue(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_GreaterThan_NotMet() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.GreaterThan);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(100)));
        assertFalse(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_LessThan_Met() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.LessThan);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(99)));
        assertTrue(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_LessThan_NotMet() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.LessThan);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(100)));
        assertFalse(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_Equal_Met() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.Equal);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(100)));
        assertTrue(resolution.getOutcome(id));
    }

    function test_ComparisonOperator_Equal_NotMet() public {
        uint256 id = _createMarketWithOperator(IMarketRegistry.ComparisonOperator.Equal);
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(id, uint256(101)));
        assertFalse(resolution.getOutcome(id));
    }
}
