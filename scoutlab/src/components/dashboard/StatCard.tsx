interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent = "#00e87a" }: StatCardProps) {
  return (
    <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
      <p className="text-xs text-white/40 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}
