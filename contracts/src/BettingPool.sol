// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IMarketRegistry} from "./interfaces/IMarketRegistry.sol";
import {IBettingPool} from "./interfaces/IBettingPool.sol";
import {IMarketResolution} from "./interfaces/IMarketResolution.sol";

contract BettingPool is IBettingPool, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable bettingToken;
    IMarketRegistry public immutable registry;
    IMarketResolution public marketResolution;

    address public immutable owner;

    mapping(uint256 => MarketPool) private pools;
    mapping(uint256 => mapping(address => UserPosition)) private positions;

    error Unauthorized();
    error MarketNotOpen();
    error BettingDeadlinePassed();
    error ZeroAmount();
    error MarketNotResolved();
    error MarketNotCancelled();
    error AlreadyClaimed();
    error AlreadyRefunded();
    error NoPosition();
    error NothingToClaim();
    error ResolutionAlreadySet();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _bettingToken, address _registry) {
        bettingToken = IERC20(_bettingToken);
        registry = IMarketRegistry(_registry);
        owner = msg.sender;
    }

    function setMarketResolution(address _marketResolution) external onlyOwner {
        if (address(marketResolution) != address(0)) revert ResolutionAlreadySet();
        marketResolution = IMarketResolution(_marketResolution);
    }

    function placeBet(uint256 marketId, Side side, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!registry.isMarketOpen(marketId)) revert MarketNotOpen();

        IMarketRegistry.Market memory market = registry.getMarket(marketId);
        if (block.timestamp >= market.bettingDeadline) revert BettingDeadlinePassed();

        bettingToken.safeTransferFrom(msg.sender, address(this), amount);

        MarketPool storage pool = pools[marketId];
        UserPosition storage position = positions[marketId][msg.sender];

        if (side == Side.Yes) {
            pool.totalYesAmount += amount;
            position.yesAmount += amount;
        } else {
            pool.totalNoAmount += amount;
            position.noAmount += amount;
        }

        emit BetPlaced(marketId, msg.sender, side, amount, block.timestamp);
    }

    function claim(uint256 marketId) external nonReentrant {
        if (!registry.isMarketResolved(marketId)) revert MarketNotResolved();

        UserPosition storage position = positions[marketId][msg.sender];
        if (position.claimed) revert AlreadyClaimed();
        if (position.yesAmount == 0 && position.noAmount == 0) revert NoPosition();

        bool targetMet = marketResolution.getOutcome(marketId);
        MarketPool storage pool = pools[marketId];

        uint256 totalPool = pool.totalYesAmount + pool.totalNoAmount;
        uint256 userWinningBet;
        uint256 winningPool;

        if (targetMet) {
            userWinningBet = position.yesAmount;
            winningPool = pool.totalYesAmount;
        } else {
            userWinningBet = position.noAmount;
            winningPool = pool.totalNoAmount;
        }

        if (userWinningBet == 0) revert NothingToClaim();

        uint256 payout = (userWinningBet * totalPool) / winningPool;

        position.claimed = true;
        bettingToken.safeTransfer(msg.sender, payout);

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    function refund(uint256 marketId) external nonReentrant {
        if (!registry.isMarketCancelled(marketId)) revert MarketNotCancelled();

        UserPosition storage position = positions[marketId][msg.sender];
        if (position.refunded) revert AlreadyRefunded();

        uint256 totalUserBet = position.yesAmount + position.noAmount;
        if (totalUserBet == 0) revert NoPosition();

        position.refunded = true;
        bettingToken.safeTransfer(msg.sender, totalUserBet);

        emit RefundClaimed(marketId, msg.sender, totalUserBet);
    }

    function getPool(uint256 marketId) external view returns (MarketPool memory) {
        return pools[marketId];
    }

    function getPosition(uint256 marketId, address user) external view returns (UserPosition memory) {
        return positions[marketId][user];
    }

    function calculatePotentialPayout(
        uint256 marketId,
        Side side,
        uint256 amount
    ) external view returns (uint256) {
        MarketPool storage pool = pools[marketId];
        uint256 totalPool = pool.totalYesAmount + pool.totalNoAmount + amount;

        if (side == Side.Yes) {
            uint256 winningPool = pool.totalYesAmount + amount;
            return (amount * totalPool) / winningPool;
        } else {
            uint256 winningPool = pool.totalNoAmount + amount;
            return (amount * totalPool) / winningPool;
        }
    }
}
