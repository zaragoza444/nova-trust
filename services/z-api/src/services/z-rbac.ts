export type ZRole =
  | "SUPER_ADMIN"
  | "COMPLIANCE_ADMIN"
  | "TREASURY_OPERATOR"
  | "ASSET_ISSUER"
  | "AUDITOR";

export interface AccessPolicy {
  route: string;
  roles: ZRole[];
  approvalRequired: boolean;
}

export const accessPolicies: AccessPolicy[] = [
  {
    route: "/api/trading/tokens",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/zbank/integration",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/zbank/load-funds",
    roles: ["SUPER_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER"],
    approvalRequired: true
  },
  {
    route: "/api/z-chain/chart",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/networks/multi",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/networks/health",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/networks/international",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/custody/integration",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/custody/health",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR"],
    approvalRequired: false
  },
  {
    route: "/api/oracle/prices",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/z-wallet/overview",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/z-wallet/balances",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/z-wallet/transfer",
    roles: ["SUPER_ADMIN", "TREASURY_OPERATOR"],
    approvalRequired: true
  },
  {
    route: "/api/z-ecosystem/overview",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/zswap/pools",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/ztrade/markets",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/zchart/markets",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  }
];

export function canAccess(route: string, role: ZRole): boolean {
  const policy = accessPolicies.find((item) => item.route === route);
  return policy ? policy.roles.includes(role) : false;
}
