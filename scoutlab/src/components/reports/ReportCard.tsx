import type { Report } from "../../types";
import { PDFExportButton } from "./PDFExportButton";

interface ReportCardProps {
  report: Report;
  onClick: () => void;
  onDelete: () => void;
}

const typeColors: Record<string, string> = {
  pre:    "text-[#00b3ff] bg-[#00b3ff]/10 border-[#00b3ff]/20",
  post:   "text-[#00e87a] bg-[#00e87a]/10 border-[#00e87a]/20",
  player: "text-[#f0c040] bg-[#f0c040]/10 border-[#f0c040]/20",
};

export function ReportCard({ report, onClick, onDelete }: ReportCardProps) {
  return (
    <div
      className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColors[report.type] ?? ""}`}>
              {report.type_label}
            </span>
            {report.competition && (
              <span className="text-xs text-white/30">{report.competition}</span>
            )}
          </div>
          <p className="font-semibold text-[#e4eaf0] truncate">{report.title}</p>
          <p className="text-xs text-white/40 mt-1">
            {new Date(report.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-white/20 hover:text-[#ff4d6d] transition-colors text-sm flex-shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
        <PDFExportButton report={report} />
      </div>
    </div>
  );
}
