export type NovaRole =
  | "SUPER_ADMIN"
  | "COMPLIANCE_ADMIN"
  | "TREASURY_OPERATOR"
  | "ASSET_ISSUER"
  | "AUDITOR";

export interface AccessPolicy {
  route: string;
  roles: NovaRole[];
  approvalRequired: boolean;
}

export const accessPolicies: AccessPolicy[] = [
  {
    route: "/api/admin/queue",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
    approvalRequired: true
  },
  {
    route: "/api/admin/overview",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/dashboard",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: false
  },
  {
    route: "/api/assets",
    roles: ["SUPER_ADMIN", "COMPLIANCE_ADMIN", "TREASURY_OPERATOR", "ASSET_ISSUER", "AUDITOR"],
    approvalRequired: true
  },
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
  }
];

export function canAccess(route: string, role: NovaRole): boolean {
  const policy = accessPolicies.find((item) => item.route === route);
  return policy ? policy.roles.includes(role) : false;
}
