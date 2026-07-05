// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WrappedNRWWorldToken {
    string public constant name = "Wrapped NRW World";
    string public constant symbol = "WNRW";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Deposit(address indexed account, uint256 value);
    event Withdrawal(address indexed account, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        require(msg.value > 0, "WrappedNRWWorldToken: zero deposit");

        totalSupply += msg.value;
        balanceOf[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value);
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function withdraw(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "WrappedNRWWorldToken: insufficient balance");

        balanceOf[msg.sender] -= value;
        totalSupply -= value;

        emit Transfer(msg.sender, address(0), value);
        emit Withdrawal(msg.sender, value);

        (bool sent, ) = payable(msg.sender).call{value: value}("");
        require(sent, "WrappedNRWWorldToken: native transfer failed");
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "WrappedNRWWorldToken: zero spender");
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
        require(currentAllowance >= value, "WrappedNRWWorldToken: allowance exceeded");

        allowance[from][msg.sender] = currentAllowance - value;
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "WrappedNRWWorldToken: zero recipient");
        require(balanceOf[from] >= value, "WrappedNRWWorldToken: insufficient balance");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
