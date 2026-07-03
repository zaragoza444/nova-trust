import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const contractsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readContract(contractPath: string) {
  return readFileSync(path.resolve(contractsRoot, "src", contractPath), "utf8");
}

describe("Nova contract suite design", () => {
  it("documents the core module list", () => {
    const modules = [
      "RoleManager",
      "IdentityRegistry",
      "ComplianceRegistry",
      "NovaSettlementToken",
      "WrappedChain138Token",
      "NovaAssetFactory",
      "TreasuryController",
      "AuditEvents"
    ];

    assert.equal(modules.length, 8);
  });

  it("keeps issued asset tokens compatible with liquidity pool routers", () => {
    const source = readContract("NovaAssetFactory.sol");

    assert.match(source, /mapping\(address => mapping\(address => uint256\)\) public allowance;/);
    assert.match(source, /function approve\(address spender, uint256 value\) external returns \(bool\)/);
    assert.match(source, /function transfer\(address to, uint256 value\) external returns \(bool\)/);
    assert.match(source, /function transferFrom\(address from, address to, uint256 value\) external returns \(bool\)/);
  });

  it("provides W138 for native Chain 138 liquidity pairs", () => {
    const source = readContract("WrappedChain138Token.sol");

    assert.match(source, /string public constant symbol = "W138";/);
    assert.match(source, /receive\(\) external payable/);
    assert.match(source, /function deposit\(\) public payable/);
    assert.match(source, /function withdraw\(uint256 value\) external/);
  });

  it("supports approved liquidity venues without disabling compliance checks", () => {
    const source = readContract("ComplianceRegistry.sol");

    assert.match(source, /mapping\(address => bool\) public approvedLiquidityVenues;/);
    assert.match(source, /function setLiquidityVenue\(address venue, bool approved\) external onlyRole\(COMPLIANCE_ADMIN_ROLE\)/);
    assert.match(source, /senderIsLiquidityVenue/);
    assert.match(source, /receiverIsLiquidityVenue/);
  });
});
