// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MarketRegistry} from "../src/MarketRegistry.sol";
import {BettingPool} from "../src/BettingPool.sol";
import {MarketResolution} from "../src/MarketResolution.sol";
import {IBettingPool} from "../src/interfaces/IBettingPool.sol";
import {IMarketRegistry} from "../src/interfaces/IMarketRegistry.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract BettingPoolTest is Test {
    MarketRegistry public registry;
    BettingPool public pool;
    ERC20Mock public usdc;

    address public admin = address(this);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public forwarder = address(0xF0F0);
    MarketResolution public resolution;

    uint256 constant MARKET_ID = 0;
    uint256 constant BET_AMOUNT = 100e6; // 100 USDC

    function setUp() public {
        usdc = new ERC20Mock("USDC", "USDC", 6);
        registry = new MarketRegistry();
        pool = new BettingPool(address(usdc), address(registry));
        resolution = new MarketResolution(forwarder, address(registry));

        registry.initialize(address(pool), address(resolution));
        pool.setMarketResolution(address(resolution));

        // Create a market
        registry.createMarket(
            "Will Elon hit 200M?",
            "users/by/username/elonmusk?user.fields=public_metrics",
            "data.public_metrics.followers_count",
            200_000_000,
            IMarketRegistry.ComparisonOperator.GreaterThanOrEqual,
            uint48(block.timestamp + 7 days),
            uint48(block.timestamp + 14 days)
        );

        // Fund users
        usdc.mint(alice, 1000e6);
        usdc.mint(bob, 1000e6);

        vm.prank(alice);
        usdc.approve(address(pool), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(pool), type(uint256).max);
    }

    function test_PlaceBetYes() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, BET_AMOUNT);

        IBettingPool.MarketPool memory p = pool.getPool(MARKET_ID);
        assertEq(p.totalYesAmount, BET_AMOUNT);
        assertEq(p.totalNoAmount, 0);

        IBettingPool.UserPosition memory pos = pool.getPosition(MARKET_ID, alice);
        assertEq(pos.yesAmount, BET_AMOUNT);
    }

    function test_PlaceBetNo() public {
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, BET_AMOUNT);

        IBettingPool.MarketPool memory p = pool.getPool(MARKET_ID);
        assertEq(p.totalNoAmount, BET_AMOUNT);
    }

    function test_RevertPlaceBet_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(BettingPool.ZeroAmount.selector);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 0);
    }

    function test_RevertPlaceBet_AfterDeadline() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(alice);
        vm.expectRevert(BettingPool.MarketNotOpen.selector);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, BET_AMOUNT);
    }

    function test_CalculatePotentialPayout() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, 100e6);

        // If alice adds another 100 USDC YES bet: totalPool=300, yesPool=200, payout=150
        uint256 payout = pool.calculatePotentialPayout(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        assertEq(payout, 150e6);
    }

    function test_ClaimWinnings_YesWins() public {
        // Alice bets YES, Bob bets NO
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, 100e6);

        // Resolve: target met (YES wins)
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));

        // Alice claims
        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claim(MARKET_ID);
        uint256 balAfter = usdc.balanceOf(alice);

        // Alice should get entire pool (200 USDC)
        assertEq(balAfter - balBefore, 200e6);
    }

    function test_ClaimWinnings_NoWins() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, 100e6);

        // Resolve: target NOT met (NO wins)
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(150_000_000)));

        uint256 balBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        pool.claim(MARKET_ID);
        assertEq(usdc.balanceOf(bob) - balBefore, 200e6);
    }

    function test_RevertClaim_NotResolved() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, BET_AMOUNT);

        vm.prank(alice);
        vm.expectRevert(BettingPool.MarketNotResolved.selector);
        pool.claim(MARKET_ID);
    }

    function test_RevertClaim_Loser() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, 100e6);

        // NO wins
        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(100_000_000)));

        vm.prank(alice);
        vm.expectRevert(BettingPool.NothingToClaim.selector);
        pool.claim(MARKET_ID);
    }

    function test_RevertClaim_Double() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);
        vm.prank(bob);
        pool.placeBet(MARKET_ID, IBettingPool.Side.No, 100e6);

        vm.prank(forwarder);
        resolution.onReport("", abi.encode(uint256(0), uint256(250_000_000)));

        vm.prank(alice);
        pool.claim(MARKET_ID);

        vm.prank(alice);
        vm.expectRevert(BettingPool.AlreadyClaimed.selector);
        pool.claim(MARKET_ID);
    }

    function test_Refund() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);

        registry.cancelMarket(MARKET_ID);

        uint256 balBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.refund(MARKET_ID);
        assertEq(usdc.balanceOf(alice) - balBefore, 100e6);
    }

    function test_RevertRefund_NotCancelled() public {
        vm.prank(alice);
        pool.placeBet(MARKET_ID, IBettingPool.Side.Yes, 100e6);

        vm.prank(alice);
        vm.expectRevert(BettingPool.MarketNotCancelled.selector);
        pool.refund(MARKET_ID);
    }
}
