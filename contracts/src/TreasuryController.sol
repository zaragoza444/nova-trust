// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

interface ISettlementToken {
    function mint(address to, uint256 value, bytes32 reasonCode) external;
    function burn(address from, uint256 value, bytes32 reasonCode) external;
}

contract TreasuryController is RoleManager {
    enum ActionType {
        Mint,
        Burn,
        Rebalance
    }

    struct TreasuryAction {
        ActionType actionType;
        address target;
        uint256 amount;
        bytes32 reasonCode;
        bool executed;
        uint64 createdAt;
    }

    ISettlementToken public immutable settlementToken;
    TreasuryAction[] public pendingActions;

    event TreasuryActionProposed(uint256 indexed actionId, ActionType indexed actionType, address indexed target, uint256 amount);
    event TreasuryActionExecuted(uint256 indexed actionId, ActionType indexed actionType, address indexed target, uint256 amount);

    constructor(address initialOwner, address settlementTokenAddress) RoleManager(initialOwner) {
        require(settlementTokenAddress != address(0), "TreasuryController: zero settlement token");
        settlementToken = ISettlementToken(settlementTokenAddress);
    }

    function proposeAction(
        ActionType actionType,
        address target,
        uint256 amount,
        bytes32 reasonCode
    ) external onlyRole(TREASURY_OPERATOR_ROLE) returns (uint256 actionId) {
        pendingActions.push(
            TreasuryAction({
                actionType: actionType,
                target: target,
                amount: amount,
                reasonCode: reasonCode,
                executed: false,
                createdAt: uint64(block.timestamp)
            })
        );

        actionId = pendingActions.length - 1;
        emit TreasuryActionProposed(actionId, actionType, target, amount);
    }

    function executeAction(uint256 actionId) external onlyRole(SUPER_ADMIN_ROLE) {
        TreasuryAction storage action = pendingActions[actionId];
        require(!action.executed, "TreasuryController: already executed");

        action.executed = true;

        if (action.actionType == ActionType.Mint) {
            settlementToken.mint(action.target, action.amount, action.reasonCode);
        } else if (action.actionType == ActionType.Burn) {
            settlementToken.burn(action.target, action.amount, action.reasonCode);
        }

        emit TreasuryActionExecuted(actionId, action.actionType, action.target, action.amount);
    }

    function getPendingActions() external view returns (TreasuryAction[] memory) {
        return pendingActions;
    }
}
