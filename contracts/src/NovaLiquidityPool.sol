// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface INovaPoolToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract NovaLiquidityPool {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    address public immutable token0;
    address public immutable token1;
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares);
    event Swap(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut, address indexed recipient);

    constructor(address token0Address, address token1Address, string memory poolName, string memory poolSymbol) {
        require(token0Address != address(0), "NovaLiquidityPool: zero token0");
        require(token1Address != address(0), "NovaLiquidityPool: zero token1");
        require(token0Address != token1Address, "NovaLiquidityPool: duplicate tokens");

        token0 = token0Address;
        token1 = token1Address;
        name = poolName;
        symbol = poolSymbol;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        require(spender != address(0), "NovaLiquidityPool: zero spender");
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
        require(currentAllowance >= value, "NovaLiquidityPool: allowance exceeded");

        allowance[from][msg.sender] = currentAllowance - value;
        _transfer(from, to, value);
        return true;
    }

    function addLiquidity(uint256 amount0, uint256 amount1, address recipient) external returns (uint256 shares) {
        require(recipient != address(0), "NovaLiquidityPool: zero recipient");
        require(amount0 > 0 && amount1 > 0, "NovaLiquidityPool: zero liquidity");

        if (totalSupply == 0) {
            shares = _sqrt(amount0 * amount1);
        } else {
            shares = _min((amount0 * totalSupply) / reserve0, (amount1 * totalSupply) / reserve1);
        }

        require(shares > 0, "NovaLiquidityPool: zero shares");
        _safeTransferFrom(token0, msg.sender, address(this), amount0);
        _safeTransferFrom(token1, msg.sender, address(this), amount1);

        _mint(recipient, shares);
        _sync();

        emit LiquidityAdded(recipient, amount0, amount1, shares);
    }

    function removeLiquidity(uint256 shares, address recipient) external returns (uint256 amount0, uint256 amount1) {
        require(recipient != address(0), "NovaLiquidityPool: zero recipient");
        require(balanceOf[msg.sender] >= shares, "NovaLiquidityPool: insufficient shares");
        require(shares > 0, "NovaLiquidityPool: zero shares");

        amount0 = (shares * reserve0) / totalSupply;
        amount1 = (shares * reserve1) / totalSupply;
        require(amount0 > 0 && amount1 > 0, "NovaLiquidityPool: zero output");

        _burn(msg.sender, shares);
        _safeTransfer(token0, recipient, amount0);
        _safeTransfer(token1, recipient, amount1);
        _sync();

        emit LiquidityRemoved(msg.sender, amount0, amount1, shares);
    }

    function swapExactInput(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(recipient != address(0), "NovaLiquidityPool: zero recipient");
        require(amountIn > 0, "NovaLiquidityPool: zero input");
        require(reserve0 > 0 && reserve1 > 0, "NovaLiquidityPool: empty pool");

        bool zeroForOne = tokenIn == token0;
        require(zeroForOne || tokenIn == token1, "NovaLiquidityPool: unsupported token");

        (address tokenOut, uint256 reserveIn, uint256 reserveOut) =
            zeroForOne ? (token1, reserve0, reserve1) : (token0, reserve1, reserve0);

        uint256 amountInWithFee = amountIn * 997;
        amountOut = (reserveOut * amountInWithFee) / ((reserveIn * 1000) + amountInWithFee);
        require(amountOut >= minAmountOut, "NovaLiquidityPool: slippage exceeded");
        require(amountOut < reserveOut, "NovaLiquidityPool: insufficient liquidity");

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        _safeTransfer(tokenOut, recipient, amountOut);
        _sync();

        emit Swap(msg.sender, tokenIn, amountIn, amountOut, recipient);
    }

    function quoteExactInput(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "NovaLiquidityPool: unsupported token");
        require(amountIn > 0, "NovaLiquidityPool: zero input");

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        if (reserveIn == 0 || reserveOut == 0) {
            return 0;
        }

        uint256 amountInWithFee = amountIn * 997;
        return (reserveOut * amountInWithFee) / ((reserveIn * 1000) + amountInWithFee);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "NovaLiquidityPool: zero recipient");
        require(balanceOf[from] >= value, "NovaLiquidityPool: insufficient balance");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        balanceOf[from] -= value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
    }

    function _sync() internal {
        reserve0 = INovaPoolToken(token0).balanceOf(address(this));
        reserve1 = INovaPoolToken(token1).balanceOf(address(this));
    }

    function _safeTransfer(address token, address to, uint256 value) internal {
        require(INovaPoolToken(token).transfer(to, value), "NovaLiquidityPool: transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) internal {
        require(INovaPoolToken(token).transferFrom(from, to, value), "NovaLiquidityPool: transferFrom failed");
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = (y / 2) + 1;
            while (x < z) {
                z = x;
                x = ((y / x) + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
