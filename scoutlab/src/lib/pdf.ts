import jsPDF from "jspdf";
import type { Report } from "../types";

export async function exportReportToPDF(report: Report): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  const contentWidth = W - margin * 2 - 4;

  // ── COVER PAGE ──────────────────────────────────────────────────
  doc.setFillColor(7, 9, 13);
  doc.rect(0, 0, W, 297, "F");

  // Green left accent bar
  doc.setFillColor(0, 232, 122);
  doc.rect(0, 0, 4, 297, "F");

  // Logo SCOUTLAB
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(0, 232, 122);
  doc.text("SCOUT", margin + 2, 36);
  const scoutW = doc.getTextWidth("SCOUT");
  doc.setTextColor(255, 255, 255);
  doc.text("LAB", margin + 2 + scoutW, 36);

  // Report type
  doc.setFontSize(9);
  doc.setTextColor(0, 232, 122);
  doc.text(`▸ ${report.type_label.toUpperCase()}`, margin + 2, 58);

  // Title
  doc.setFontSize(26);
  doc.setTextColor(240, 245, 250);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(report.title, contentWidth);
  titleLines.forEach((line: string, i: number) => doc.text(line, margin + 2, 72 + i * 11));

  // Meta info
  doc.setFontSize(10);
  doc.setTextColor(100, 110, 120);
  doc.setFont("helvetica", "normal");
  const metaItems = [
    report.competition,
    report.date,
    report.sources.slice(0, 3).join(", "),
  ].filter(Boolean);
  metaItems.forEach((m, i) => doc.text(m, margin + 2, 96 + i * 7));

  // Generation date
  doc.setFontSize(8);
  doc.setTextColor(60, 70, 80);
  const genDate = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generado con ScoutLab · ${genDate}`, margin + 2, 280);

  // ── CONTENT PAGES ───────────────────────────────────────────────
  // Parse markdown into sections (## heading = new section)
  const lines = report.content.split("\n");
  let currentPage = 1;
  let y = 30;
  const pageHeight = 270;

  const addPage = () => {
    // Footer on current page
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 80);
    doc.text(`ScoutLab · ${report.title}`, margin + 2, 290);
    doc.text(String(currentPage), W - margin, 290, { align: "right" });

    doc.addPage();
    currentPage++;

    // Dark background + accent bar
    doc.setFillColor(7, 9, 13);
    doc.rect(0, 0, W, 297, "F");
    doc.setFillColor(0, 232, 122);
    doc.rect(0, 0, 4, 297, "F");
    y = 30;
  };

  addPage();

  for (const line of lines) {
    if (y >= pageHeight) addPage();

    if (line.startsWith("## ")) {
      // Section heading
      if (y > 40) y += 6;
      doc.setFontSize(13);
      doc.setTextColor(0, 232, 122);
      doc.setFont("helvetica", "bold");
      const heading = line.replace(/^## /, "").toUpperCase();
      doc.text(heading, margin + 2, y);
      // Underline
      const headW = doc.getTextWidth(heading);
      doc.setDrawColor(0, 232, 122);
      doc.setLineWidth(0.3);
      doc.line(margin + 2, y + 1.5, margin + 2 + headW, y + 1.5);
      y += 10;
    } else if (line.startsWith("### ")) {
      y += 2;
      doc.setFontSize(10);
      doc.setTextColor(200, 210, 220);
      doc.setFont("helvetica", "bold");
      doc.text(line.replace(/^### /, ""), margin + 2, y);
      y += 7;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      doc.setFontSize(9);
      doc.setTextColor(180, 190, 200);
      doc.setFont("helvetica", "normal");
      const bulletText = line.replace(/^[-*] /, "");
      const wrapped = doc.splitTextToSize(`• ${bulletText}`, contentWidth - 4);
      wrapped.forEach((wl: string) => {
        if (y >= pageHeight) addPage();
        doc.text(wl, margin + 6, y);
        y += 5;
      });
    } else if (line.trim() === "") {
      y += 3;
    } else {
      doc.setFontSize(9.5);
      doc.setTextColor(200, 210, 220);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(line, contentWidth);
      wrapped.forEach((wl: string) => {
        if (y >= pageHeight) addPage();
        doc.text(wl, margin + 2, y);
        y += 5.5;
      });
    }
  }

  // Footer on last content page
  doc.setFontSize(8);
  doc.setTextColor(60, 70, 80);
  doc.text(`ScoutLab · ${report.title}`, margin + 2, 290);
  doc.text(String(currentPage), W - margin, 290, { align: "right" });

  const filename = `ScoutLab_${report.title
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")}_${report.date || new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
