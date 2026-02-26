// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Interface for Chainlink CRE report receiver contracts
interface IReceiver {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
