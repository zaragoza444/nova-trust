// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RoleManager {
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");
    bytes32 public constant TREASURY_OPERATOR_ROLE = keccak256("TREASURY_OPERATOR_ROLE");
    bytes32 public constant ASSET_ISSUER_ROLE = keccak256("ASSET_ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    address public owner;
    mapping(bytes32 => mapping(address => bool)) private roles;

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed grantedBy);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed revokedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "RoleManager: owner only");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "RoleManager: missing role");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "RoleManager: zero owner");
        owner = initialOwner;
        _grantRole(SUPER_ADMIN_ROLE, initialOwner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "RoleManager: zero owner");
        address previousOwner = owner;
        owner = newOwner;
        _grantRole(SUPER_ADMIN_ROLE, newOwner);
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function grantRole(bytes32 role, address account) external onlyOwner {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) external onlyOwner {
        roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[role][account];
    }

    function _grantRole(bytes32 role, address account) internal {
        require(account != address(0), "RoleManager: zero account");
        roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
}
