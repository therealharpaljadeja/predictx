// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBettingPool {
    enum Side {
        Yes,
        No
    }

    struct MarketPool {
        uint256 totalYesAmount;
        uint256 totalNoAmount;
    }

    struct UserPosition {
        uint256 yesAmount;
        uint256 noAmount;
        bool claimed;
        bool refunded;
    }

    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        Side side,
        uint256 amount,
        uint256 timestamp
    );

    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event RefundClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    function placeBet(uint256 marketId, Side side, uint256 amount) external;
    function claim(uint256 marketId) external;
    function refund(uint256 marketId) external;

    function getPool(uint256 marketId) external view returns (MarketPool memory);
    function getPosition(uint256 marketId, address user) external view returns (UserPosition memory);
    function calculatePotentialPayout(uint256 marketId, Side side, uint256 amount) external view returns (uint256);
}
