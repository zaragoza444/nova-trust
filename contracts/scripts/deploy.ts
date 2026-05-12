async function main() {
  console.log("Deploy Nova contracts in this order:");
  console.log("1. RoleManager or owner accounts");
  console.log("2. IdentityRegistry");
  console.log("3. ComplianceRegistry");
  console.log("4. NovaSettlementToken");
  console.log("5. NovaAssetFactory");
  console.log("6. TreasuryController");
  console.log("7. AuditEvents");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
