// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReceiver} from "./IReceiver.sol";

/// @notice Base contract for receiving Chainlink CRE signed reports via KeystoneForwarder.
/// @dev Derived from cre-bootcamp-2026 reference implementation.
abstract contract ReceiverTemplate is IReceiver {
    address public immutable keystoneForwarder;

    error UnauthorizedForwarder();

    constructor(address _keystoneForwarder) {
        keystoneForwarder = _keystoneForwarder;
    }

    /// @notice Called by KeystoneForwarder with the signed report.
    function onReport(bytes calldata metadata, bytes calldata report) external override {
        if (msg.sender != keystoneForwarder) revert UnauthorizedForwarder();
        _processReport(report);
    }

    /// @notice Override this to handle the decoded report payload.
    function _processReport(bytes calldata report) internal virtual;
}
