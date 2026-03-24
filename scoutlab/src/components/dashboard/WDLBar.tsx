interface WDLBarProps {
  wins: number;
  draws: number;
  losses: number;
}

export function WDLBar({ wins, draws, losses }: WDLBarProps) {
  const total = wins + draws + losses || 1;
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex text-xs text-white/40 justify-between">
        <span>V {wins}</span>
        <span>E {draws}</span>
        <span>D {losses}</span>
      </div>
      <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
        {wPct > 0 && (
          <div
            className="bg-[#00e87a] transition-all duration-500"
            style={{ width: `${wPct}%` }}
          />
        )}
        {dPct > 0 && (
          <div
            className="bg-[#f0c040] transition-all duration-500"
            style={{ width: `${dPct}%` }}
          />
        )}
        {lPct > 0 && (
          <div
            className="bg-[#ff4d6d] transition-all duration-500"
            style={{ width: `${lPct}%` }}
          />
        )}
      </div>
      <div className="flex text-xs justify-between text-white/30">
        <span>{wPct.toFixed(0)}%</span>
        <span>{dPct.toFixed(0)}%</span>
        <span>{lPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
