// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MarketRegistry} from "../src/MarketRegistry.sol";
import {BettingPool} from "../src/BettingPool.sol";
import {MarketResolution} from "../src/MarketResolution.sol";
import {IBettingPool} from "../src/interfaces/IBettingPool.sol";
import {IMarketRegistry} from "../src/interfaces/IMarketRegistry.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract IntegrationTest is Test {
    MarketRegistry public registry;
    BettingPool public pool;
    MarketResolution public resolution;
    ERC20Mock public usdc;

    address public admin = address(this);
    address public forwarder = address(0xF0F0);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xC0C0);

    string constant ENDPOINT = "users/by/username/elonmusk?user.fields=public_metrics";
    string constant JSON_PATH = "data.public_metrics.followers_count";

    function setUp() public {
        usdc = new ERC20Mock("USDC", "USDC", 6);
        registry = new MarketRegistry();
        pool = new BettingPool(address(usdc), address(registry));
        resolution = new MarketResolution(forwarder, address(registry));

        registry.initialize(address(pool), address(resolution));
        pool.setMarketResolution(address(resolution));

        // Fund users
        address[3] memory users = [alice, bob, charlie];
        for (uint256 i = 0; i < users.length; i++) {
            usdc.mint(users[i], 10_000e6);
            vm.prank(users[i]);
            usdc.approve(address(pool), type(uint256).max);
        }
    }

    function test_FullLifecycle_YesWins() public {
        // 1. Create market
        uint256 marketId = registry.createMarket(
            "Will Elon hit 200M?",
            ENDPOINT,
            JSON_PATH,
            200_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        // 2. Place bets
        vm.prank(alice);
        pool.placeBet(marketId, IBettingPool.Side.Yes, 300e6);

        vm.prank(bob);
        pool.placeBet(marketId, IBettingPool.Side.No, 100e6);

        vm.prank(charlie);
        pool.placeBet(marketId, IBettingPool.Side.Yes, 200e6);

        // Verify pool state
        IBettingPool.MarketPool memory p = pool.getPool(marketId);
        assertEq(p.totalYesAmount, 500e6); // 300 + 200
        assertEq(p.totalNoAmount, 100e6);

        // 3. Resolve: target met (YES wins)
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(marketId, uint256(210_000_000)));

        assertTrue(registry.isMarketResolved(marketId));

        // 4. Alice claims: (300/500) * 600 = 360
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claim(marketId);
        assertEq(usdc.balanceOf(alice) - aliceBefore, 360e6);

        // 5. Charlie claims: (200/500) * 600 = 240
        uint256 charlieBefore = usdc.balanceOf(charlie);
        vm.prank(charlie);
        pool.claim(marketId);
        assertEq(usdc.balanceOf(charlie) - charlieBefore, 240e6);

        // 6. Bob (loser) cannot claim
        vm.prank(bob);
        vm.expectRevert(BettingPool.NothingToClaim.selector);
        pool.claim(marketId);
    }

    function test_FullLifecycle_NoWins() public {
        uint256 marketId = registry.createMarket(
            "Will Vitalik hit 10M?",
            "users/by/username/vitalikbuterin?user.fields=public_metrics",
            JSON_PATH,
            10_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        vm.prank(alice);
        pool.placeBet(marketId, IBettingPool.Side.Yes, 200e6);
        vm.prank(bob);
        pool.placeBet(marketId, IBettingPool.Side.No, 300e6);

        // Resolve: target not met (NO wins)
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(marketId, uint256(5_000_000)));

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        pool.claim(marketId);
        // Bob gets entire pool: 500 USDC
        assertEq(usdc.balanceOf(bob) - bobBefore, 500e6);
    }

    function test_FullLifecycle_Cancellation() public {
        uint256 marketId = registry.createMarket(
            "desc",
            "users/by/username/someuser?user.fields=public_metrics",
            JSON_PATH,
            1_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        vm.prank(alice);
        pool.placeBet(marketId, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(marketId, IBettingPool.Side.No, 200e6);

        // Admin cancels
        registry.cancelMarket(marketId);

        // Both get refunds
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.refund(marketId);
        assertEq(usdc.balanceOf(alice) - aliceBefore, 100e6);

        uint256 bobBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        pool.refund(marketId);
        assertEq(usdc.balanceOf(bob) - bobBefore, 200e6);
    }

    function test_MultipleMarketsIndependent() public {
        uint256 m1 = registry.createMarket("d1", "endpoint1", "path1", 100, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 7 days), uint48(block.timestamp + 14 days));
        uint256 m2 = registry.createMarket("d2", "endpoint2", "path2", 200, IMarketRegistry.ComparisonOperator.GreaterThanOrEqual, uint48(block.timestamp + 7 days), uint48(block.timestamp + 14 days));

        vm.prank(alice);
        pool.placeBet(m1, IBettingPool.Side.Yes, 100e6);
        vm.prank(alice);
        pool.placeBet(m2, IBettingPool.Side.No, 100e6);

        vm.prank(bob);
        pool.placeBet(m1, IBettingPool.Side.No, 100e6);
        vm.prank(bob);
        pool.placeBet(m2, IBettingPool.Side.Yes, 100e6);

        // Resolve m1: YES wins, m2: NO wins
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(m1, uint256(150)));
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(m2, uint256(100)));

        // Alice wins both
        vm.prank(alice);
        pool.claim(m1);
        vm.prank(alice);
        pool.claim(m2);

        // Alice: started with 10000, bet 200 total, won 400 total
        assertEq(usdc.balanceOf(alice), 10_200e6);
    }

    function test_IntegrationWithLessThanOperator() public {
        // Market: tweet likes should be less than 1000
        uint256 marketId = registry.createMarket(
            "Will tweet stay under 1000 likes?",
            "tweets/123?tweet.fields=public_metrics",
            "data.public_metrics.like_count",
            1000,
            IMarketRegistry.ComparisonOperator.LessThan,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        vm.prank(alice);
        pool.placeBet(marketId, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(marketId, IBettingPool.Side.No, 100e6);

        // Resolve: 500 likes (< 1000, so target met, YES wins)
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(marketId, uint256(500)));

        assertTrue(resolution.getOutcome(marketId));

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claim(marketId);
        assertEq(usdc.balanceOf(alice) - aliceBefore, 200e6);
    }
}
