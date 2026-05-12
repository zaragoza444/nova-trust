// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

contract AuditEvents is RoleManager {
    event AuditTrail(
        bytes32 indexed actionId,
        string indexed actionType,
        address indexed actor,
        address subject,
        uint256 value,
        bytes32 metadataHash,
        uint64 timestamp
    );

    constructor(address initialOwner) RoleManager(initialOwner) {}

    function recordAction(
        bytes32 actionId,
        string calldata actionType,
        address subject,
        uint256 value,
        bytes32 metadataHash
    ) external onlyRole(AUDITOR_ROLE) {
        emit AuditTrail(actionId, actionType, msg.sender, subject, value, metadataHash, uint64(block.timestamp));
    }
}
