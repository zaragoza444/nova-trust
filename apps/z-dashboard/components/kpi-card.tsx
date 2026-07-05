interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
}

export function KpiCard({ label, value, delta }: KpiCardProps) {
  return (
    <article className="card">
      <span className="eyebrow">{label}</span>
      <strong className="metricValue">{value}</strong>
      <span className="metricDelta">{delta}</span>
    </article>
  );
}
