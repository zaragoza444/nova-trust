// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

interface IComplianceRegistry {
    function isTransferAllowed(address from, address to, uint256 amount) external view returns (bool);
}

contract NovaSettlementToken is RoleManager {
    string public constant name = "Nova Settlement Token";
    string public constant symbol = "NST";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    IComplianceRegistry public immutable complianceRegistry;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event SettlementMinted(address indexed to, uint256 amount, bytes32 indexed reasonCode);
    event SettlementBurned(address indexed from, uint256 amount, bytes32 indexed reasonCode);

    constructor(address initialOwner, address complianceRegistryAddress) RoleManager(initialOwner) {
        require(complianceRegistryAddress != address(0), "NovaSettlementToken: zero compliance registry");
        complianceRegistry = IComplianceRegistry(complianceRegistryAddress);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= value, "NovaSettlementToken: allowance exceeded");

        allowance[from][msg.sender] = currentAllowance - value;
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value, bytes32 reasonCode) external onlyRole(TREASURY_OPERATOR_ROLE) {
        require(to != address(0), "NovaSettlementToken: zero recipient");
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
        emit SettlementMinted(to, value, reasonCode);
    }

    function burn(address from, uint256 value, bytes32 reasonCode) external onlyRole(TREASURY_OPERATOR_ROLE) {
        require(balanceOf[from] >= value, "NovaSettlementToken: insufficient balance");
        balanceOf[from] -= value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
        emit SettlementBurned(from, value, reasonCode);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "NovaSettlementToken: zero recipient");
        require(balanceOf[from] >= value, "NovaSettlementToken: insufficient balance");
        require(complianceRegistry.isTransferAllowed(from, to, value), "NovaSettlementToken: blocked by compliance");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
