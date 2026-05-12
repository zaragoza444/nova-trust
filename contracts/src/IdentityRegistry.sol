// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

contract IdentityRegistry is RoleManager {
    struct Participant {
        bool isActive;
        string participantType;
        string jurisdiction;
        bytes32 kycReference;
        bytes32 kybReference;
        uint64 updatedAt;
    }

    mapping(address => Participant) private participants;

    event ParticipantRegistered(address indexed account, string participantType, string jurisdiction);
    event ParticipantSuspended(address indexed account, string reason);
    event ParticipantReactivated(address indexed account);

    constructor(address initialOwner) RoleManager(initialOwner) {}

    function registerParticipant(
        address account,
        string calldata participantType,
        string calldata jurisdiction,
        bytes32 kycReference,
        bytes32 kybReference
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(account != address(0), "IdentityRegistry: zero account");

        participants[account] = Participant({
            isActive: true,
            participantType: participantType,
            jurisdiction: jurisdiction,
            kycReference: kycReference,
            kybReference: kybReference,
            updatedAt: uint64(block.timestamp)
        });

        emit ParticipantRegistered(account, participantType, jurisdiction);
    }

    function suspendParticipant(address account, string calldata reason) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        participants[account].isActive = false;
        participants[account].updatedAt = uint64(block.timestamp);
        emit ParticipantSuspended(account, reason);
    }

    function reactivateParticipant(address account) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        Participant storage participant = participants[account];
        require(participant.kycReference != bytes32(0) || participant.kybReference != bytes32(0), "IdentityRegistry: unknown account");
        participant.isActive = true;
        participant.updatedAt = uint64(block.timestamp);
        emit ParticipantReactivated(account);
    }

    function getParticipant(address account) external view returns (Participant memory) {
        return participants[account];
    }

    function isEligible(address account) external view returns (bool) {
        return participants[account].isActive;
    }
}
