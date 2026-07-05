interface TokenCapabilities {
  transferable: boolean;
  tradable: boolean;
  swappable: boolean;
  zBankLoadable?: boolean;
}

interface TokenCapabilityBadgesProps {
  capabilities: TokenCapabilities;
}

export function TokenCapabilityBadges({ capabilities }: TokenCapabilityBadgesProps) {
  const items = [
    { key: "transferable", label: "Transferable", enabled: capabilities.transferable },
    { key: "tradable", label: "Tradable", enabled: capabilities.tradable },
    { key: "swappable", label: "Swappable", enabled: capabilities.swappable },
    { key: "zBankLoadable", label: "Z Bank load", enabled: capabilities.zBankLoadable ?? false }
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
