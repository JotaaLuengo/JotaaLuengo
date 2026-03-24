import { useState } from "react";
import { useReports, useDeleteReport } from "../hooks/useReports";
import { ReportCard } from "../components/reports/ReportCard";
import { ReportSection } from "../components/reports/ReportSection";
import { ConfirmModal } from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import { PDFExportButton } from "../components/reports/PDFExportButton";
import { ReportCardSkeleton } from "../components/ui/Skeleton";
import type { Report } from "../types";
import { SECTIONS } from "../types";
import toast from "react-hot-toast";

const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "pre", label: "Pre-Partido" },
  { value: "post", label: "Post-Partido" },
  { value: "player", label: "Jugador" },
];

function parseReportSections(content: string, type: Report["type"]): { title: string; content: string }[] {
  const sectionTitles = SECTIONS[type];
  const result: { title: string; content: string }[] = [];

  for (let i = 0; i < sectionTitles.length; i++) {
    const title = sectionTitles[i];
    const nextTitle = sectionTitles[i + 1];
    const pattern = new RegExp(`##\\s*${title}([\\s\\S]*?)${nextTitle ? `##\\s*${nextTitle}` : "$"}`, "i");
    const match = content.match(pattern);
    result.push({ title, content: match ? match[1].trim() : "" });
  }

  return result;
}

export default function Reports() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: reports, isLoading } = useReports({
    type: typeFilter || undefined,
    search: search || undefined,
  });

  const deleteReport = useDeleteReport();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReport.mutateAsync(deleteId);
      if (selectedReport?.id === deleteId) setSelectedReport(null);
      toast.success("Informe eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List panel */}
      <div className="flex-1 min-w-0 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-[#e4eaf0] mb-1">Historial</h1>
        <p className="text-sm text-white/40 mb-6">Todos tus informes generados</p>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select
            value={typeFilter}
            options={TYPE_OPTIONS}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <ReportCardSkeleton key={i} />)}
          </div>
        ) : !reports?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-[#e4eaf0]/60 font-medium">Genera tu primer informe</p>
            <p className="text-sm text-white/30 mt-1">Los informes generados aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onClick={() => setSelectedReport(r)}
                onDelete={() => setDeleteId(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedReport && (
        <div className="hidden md:flex flex-col w-[480px] border-l border-white/[0.07] overflow-y-auto">
          <div className="sticky top-0 bg-[#07090d]/95 backdrop-blur px-6 py-4 border-b border-white/[0.07] flex items-start justify-between gap-4 z-10">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#e4eaf0] truncate">{selectedReport.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{selectedReport.type_label}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <PDFExportButton report={selectedReport} />
              <button
                onClick={() => setSelectedReport(null)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {parseReportSections(selectedReport.content, selectedReport.type).map((s) => (
              <ReportSection key={s.title} title={s.title} content={s.content} />
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar informe?"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar informe"
        loading={deleteReport.isPending}
      />
    </div>
  );
}
