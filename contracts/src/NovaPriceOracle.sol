// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

contract NovaPriceOracle is RoleManager {
    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");

    struct PriceFeed {
        uint256 priceUsd8;
        uint64 updatedAt;
        bool active;
    }

    mapping(address => PriceFeed) public feedsByToken;

    event PriceUpdated(address indexed token, uint256 priceUsd8, uint64 updatedAt);
    event PriceFeedStatusChanged(address indexed token, bool active);

    constructor(address initialOwner) RoleManager(initialOwner) {}

    function setPrice(address token, uint256 priceUsd8) public onlyRole(ORACLE_OPERATOR_ROLE) {
        require(token != address(0), "NovaPriceOracle: zero token");
        require(priceUsd8 > 0, "NovaPriceOracle: zero price");

        feedsByToken[token] = PriceFeed({
            priceUsd8: priceUsd8,
            updatedAt: uint64(block.timestamp),
            active: true
        });

        emit PriceUpdated(token, priceUsd8, uint64(block.timestamp));
    }

    function setPrices(address[] calldata tokens, uint256[] calldata pricesUsd8) external {
        require(tokens.length == pricesUsd8.length, "NovaPriceOracle: length mismatch");

        for (uint256 index = 0; index < tokens.length; index++) {
            setPrice(tokens[index], pricesUsd8[index]);
        }
    }

    function deactivatePriceFeed(address token) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        require(token != address(0), "NovaPriceOracle: zero token");
        feedsByToken[token].active = false;
        emit PriceFeedStatusChanged(token, false);
    }

    function getPrice(address token) external view returns (uint256 priceUsd8, uint64 updatedAt, bool active) {
        PriceFeed memory feed = feedsByToken[token];
        return (feed.priceUsd8, feed.updatedAt, feed.active);
    }
}
