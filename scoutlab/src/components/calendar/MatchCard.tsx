import { useNavigate } from "react-router-dom";
import type { Match, MatchResult } from "../../types";
import { Button } from "../ui/Button";

interface MatchCardProps {
  match: Match;
  onDelete: (id: string) => void;
  onEdit: (match: Match) => void;
}

const resultColors: Record<MatchResult, string> = {
  Victoria:  "bg-[#00e87a]/20 text-[#00e87a] border-[#00e87a]/30",
  Empate:    "bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30",
  Derrota:   "bg-[#ff4d6d]/20 text-[#ff4d6d] border-[#ff4d6d]/30",
  Pendiente: "bg-white/5 text-white/50 border-white/10",
};

export function MatchCard({ match, onDelete, onEdit }: MatchCardProps) {
  const navigate = useNavigate();
  const isPending = match.result === "Pendiente";

  return (
    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${resultColors[match.result]}`}>
              {match.result}
            </span>
            {match.competition && (
              <span className="text-xs text-white/30">{match.competition}</span>
            )}
          </div>
          <p className="font-semibold text-[#e4eaf0] truncate">
            {match.team} <span className="text-white/40">vs</span> {match.rival}
          </p>
          <p className="text-xs text-white/40 mt-1">
            {match.date}{match.time ? ` · ${match.time}` : ""}
          </p>
          {match.notes && (
            <p className="text-xs text-white/30 mt-1 truncate">{match.notes}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(match.id)}
          className="text-white/20 hover:text-[#ff4d6d] transition-colors text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        {isPending ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(
                `/reports/new?type=pre&team=${encodeURIComponent(match.team)}&rival=${encodeURIComponent(match.rival)}&competition=${encodeURIComponent(match.competition)}&date=${encodeURIComponent(match.date)}`
              )
            }
          >
            Informe Pre ✦
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(
                `/reports/new?type=post&team=${encodeURIComponent(match.team)}&rival=${encodeURIComponent(match.rival)}&competition=${encodeURIComponent(match.competition)}&date=${encodeURIComponent(match.date)}`
              )
            }
          >
            Informe Post ✦
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(match)}>
          Editar
        </Button>
      </div>
    </div>
  );
}
