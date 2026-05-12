// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

contract NovaAssetToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals = 18;
    address public immutable issuer;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(
        string memory assetName,
        string memory assetSymbol,
        address issuerAddress,
        uint256 initialSupply,
        address treasury
    ) {
        name = assetName;
        symbol = assetSymbol;
        issuer = issuerAddress;
        totalSupply = initialSupply;
        balanceOf[treasury] = initialSupply;
        emit Transfer(address(0), treasury, initialSupply);
    }
}

contract NovaAssetFactory is RoleManager {
    struct AssetDefinition {
        address assetToken;
        string assetId;
        string assetClass;
        string jurisdiction;
        uint256 issueSize;
        address issuer;
        uint64 createdAt;
    }

    AssetDefinition[] public assets;

    event AssetIssued(address indexed assetToken, string indexed assetId, string assetClass, uint256 issueSize, address issuer);

    constructor(address initialOwner) RoleManager(initialOwner) {}

    function issueAsset(
        string calldata assetId,
        string calldata assetClass,
        string calldata jurisdiction,
        string calldata assetName,
        string calldata assetSymbol,
        uint256 issueSize,
        address treasury
    ) external onlyRole(ASSET_ISSUER_ROLE) returns (address assetToken) {
        NovaAssetToken token = new NovaAssetToken(assetName, assetSymbol, msg.sender, issueSize, treasury);

        assets.push(
            AssetDefinition({
                assetToken: address(token),
                assetId: assetId,
                assetClass: assetClass,
                jurisdiction: jurisdiction,
                issueSize: issueSize,
                issuer: msg.sender,
                createdAt: uint64(block.timestamp)
            })
        );

        emit AssetIssued(address(token), assetId, assetClass, issueSize, msg.sender);
        return address(token);
    }

    function getAssets() external view returns (AssetDefinition[] memory) {
        return assets;
    }
}
