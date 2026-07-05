interface TokenCapabilities {
  transferable: boolean;
  tradable: boolean;
  swappable: boolean;
  bankLoadable?: boolean;
}

interface TokenCapabilityBadgesProps {
  capabilities: TokenCapabilities;
}

export function TokenCapabilityBadges({ capabilities }: TokenCapabilityBadgesProps) {
  const items = [
    { key: "transferable", label: "Transferable", enabled: capabilities.transferable },
    { key: "tradable", label: "Tradable", enabled: capabilities.tradable },
    { key: "swappable", label: "Swappable", enabled: capabilities.swappable },
    { key: "bankLoadable", label: "Bank load", enabled: capabilities.bankLoadable ?? false }
  ];

  return (
    <div className="capabilityBadges">
      {items.map((item) => (
        <span key={item.key} className={`statusBadge ${item.enabled ? "approved" : "pending"}`}>
          {item.label}
        </span>
      ))}
    </div>
  );
}
