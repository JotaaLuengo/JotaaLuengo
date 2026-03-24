import type { MatchResult } from "../../types";

interface StreakBadgesProps {
  results: MatchResult[];
}

const colors: Record<MatchResult, string> = {
  Victoria:  "bg-[#00e87a]/20 text-[#00e87a] border-[#00e87a]/30",
  Empate:    "bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30",
  Derrota:   "bg-[#ff4d6d]/20 text-[#ff4d6d] border-[#ff4d6d]/30",
  Pendiente: "bg-white/5 text-white/40 border-white/10",
};

const labels: Record<MatchResult, string> = {
  Victoria:  "V",
  Empate:    "E",
  Derrota:   "D",
  Pendiente: "P",
};

export function StreakBadges({ results }: StreakBadgesProps) {
  const last5 = results.filter((r) => r !== "Pendiente").slice(-5);

  return (
    <div className="flex gap-2">
      {last5.length === 0 ? (
        <span className="text-xs text-white/30">Sin partidos disputados</span>
      ) : (
        last5.map((r, i) => (
          <span
            key={i}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border ${colors[r]}`}
          >
            {labels[r]}
          </span>
        ))
      )}
    </div>
  );
}
