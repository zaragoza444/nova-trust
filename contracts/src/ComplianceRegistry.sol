// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

interface IIdentityRegistry {
    function isEligible(address account) external view returns (bool);
}

contract ComplianceRegistry is RoleManager {
    struct ComplianceStatus {
        bool isSanctioned;
        bool isFrozen;
        uint256 dailyTransferLimit;
        string jurisdiction;
        uint64 updatedAt;
    }

    IIdentityRegistry public immutable identityRegistry;
    mapping(address => ComplianceStatus) private statuses;
    mapping(address => bool) public approvedLiquidityVenues;

    event ComplianceStatusUpdated(address indexed account, bool isSanctioned, bool isFrozen, uint256 dailyTransferLimit);
    event LiquidityVenueUpdated(address indexed venue, bool approved);

    constructor(address initialOwner, address identityRegistryAddress) RoleManager(initialOwner) {
        require(identityRegistryAddress != address(0), "ComplianceRegistry: zero identity registry");
        identityRegistry = IIdentityRegistry(identityRegistryAddress);
    }

    function setStatus(
        address account,
        bool isSanctioned,
        bool isFrozen,
        uint256 dailyTransferLimit,
        string calldata jurisdiction
    ) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(account != address(0), "ComplianceRegistry: zero account");

        statuses[account] = ComplianceStatus({
            isSanctioned: isSanctioned,
            isFrozen: isFrozen,
            dailyTransferLimit: dailyTransferLimit,
            jurisdiction: jurisdiction,
            updatedAt: uint64(block.timestamp)
        });

        emit ComplianceStatusUpdated(account, isSanctioned, isFrozen, dailyTransferLimit);
    }

    function getStatus(address account) external view returns (ComplianceStatus memory) {
        return statuses[account];
    }

    function setLiquidityVenue(address venue, bool approved) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(venue != address(0), "ComplianceRegistry: zero venue");
        approvedLiquidityVenues[venue] = approved;
        emit LiquidityVenueUpdated(venue, approved);
    }

    function isTransferAllowed(address from, address to, uint256 amount) external view returns (bool) {
        ComplianceStatus memory sender = statuses[from];
        ComplianceStatus memory receiver = statuses[to];
        bool senderIsLiquidityVenue = approvedLiquidityVenues[from];
        bool receiverIsLiquidityVenue = approvedLiquidityVenues[to];

        if (!senderIsLiquidityVenue && !identityRegistry.isEligible(from)) {
            return false;
        }

        if (!receiverIsLiquidityVenue && !identityRegistry.isEligible(to)) {
            return false;
        }

        if (sender.isSanctioned || sender.isFrozen || receiver.isSanctioned || receiver.isFrozen) {
            return false;
        }

        if (sender.dailyTransferLimit > 0 && amount > sender.dailyTransferLimit) {
            return false;
        }

        return true;
    }
}
