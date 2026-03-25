import { useState } from "react";
import { Button } from "../ui/Button";
import { exportReportToPDF } from "../../lib/pdf";
import type { Report } from "../../types";
import toast from "react-hot-toast";

interface PDFExportButtonProps {
  report: Report;
}

type State = "idle" | "loading" | "success";

export function PDFExportButton({ report }: PDFExportButtonProps) {
  const [state, setState] = useState<State>("idle");

  const handleExport = async () => {
    setState("loading");
    try {
      await exportReportToPDF(report);
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      toast.error("Error al generar el PDF");
      setState("idle");
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      loading={state === "loading"}
      disabled={state !== "idle"}
    >
      {state === "success" ? "✓ Descargado" : "⬇ Exportar PDF"}
    </Button>
  );
}
