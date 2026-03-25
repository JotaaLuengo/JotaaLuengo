import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCreateReport } from "../hooks/useReports";
import { generateReport } from "../lib/claude";
import type { ReportFormData } from "../lib/claude";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ReportSection } from "../components/reports/ReportSection";
import { PDFExportButton } from "../components/reports/PDFExportButton";
import type { Report, ReportType, ReportTone } from "../types";
import { SECTIONS, SOURCES, COMPETITIONS } from "../types";
import toast from "react-hot-toast";

const TYPE_LABELS: Record<ReportType, string> = {
  pre:    "Pre-Partido",
  post:   "Post-Partido",
  player: "Jugador",
};

const TONE_OPTIONS: { value: ReportTone; label: string }[] = [
  { value: "Técnico / profesional",  label: "Técnico / profesional"  },
  { value: "Ejecutivo / conciso",    label: "Ejecutivo / conciso"    },
  { value: "Detallado / exhaustivo", label: "Detallado / exhaustivo" },
];

const COMPETITION_OPTIONS = COMPETITIONS.map((c) => ({ value: c, label: c }));

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${s < step ? "bg-[#00e87a] text-[#07090d]" : s === step ? "bg-[#00e87a]/20 text-[#00e87a] border border-[#00e87a]/40" : "bg-white/5 text-white/30 border border-white/10"}`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 3 && (
            <div className={`h-px w-8 transition-all ${s < step ? "bg-[#00e87a]" : "bg-white/10"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-white/40">
        {step === 1 ? "Tipo de informe" : step === 2 ? "Formulario" : "Resultado"}
      </span>
    </div>
  );
}

interface TypeCardProps {
  icon: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function TypeCard({ icon, label, description, selected, onClick }: TypeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-xl border text-left transition-all duration-150 w-full
        ${selected
          ? "border-[#00e87a]/50 bg-[#00e87a]/5"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
        }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-semibold text-[#e4eaf0] text-sm mb-1">{label}</p>
      <p className="text-xs text-white/40">{description}</p>
    </button>
  );
}

export default function NewReport() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const createReport = useCreateReport();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ReportType>("pre");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    team: "",
    rival: "",
    playerName: "",
    position: "",
    competition: "Otra",
    date: "",
    sources: [] as string[],
    extra_notes: "",
    tone: "Técnico / profesional" as ReportTone,
  });

  // Pre-fill from query params (calendar navigation)
  useEffect(() => {
    const qType = searchParams.get("type") as ReportType | null;
    if (qType) { setType(qType); setStep(2); }
    setForm((prev) => ({
      ...prev,
      team:        searchParams.get("team")        ?? prev.team,
      rival:       searchParams.get("rival")       ?? prev.rival,
      competition: searchParams.get("competition") ?? prev.competition,
      date:        searchParams.get("date")        ?? prev.date,
    }));
  }, [searchParams]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSource = (s: string) =>
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.includes(s)
        ? prev.sources.filter((x) => x !== s)
        : [...prev.sources, s],
    }));

  const getTitle = () => {
    if (type === "player") return form.playerName ? `Informe — ${form.playerName}` : "Informe de jugador";
    return form.rival
      ? `${TYPE_LABELS[type]} vs ${form.rival}`
      : `Informe ${TYPE_LABELS[type]}`;
  };

  const handleGenerate = async () => {
    setStep(3);
    setGenerating(true);
    setProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 90));
    }, 400);

    try {
      const data: ReportFormData = {
        type,
        title: getTitle(),
        team: form.team,
        rival: form.rival,
        playerName: form.playerName,
        position: form.position,
        competition: form.competition,
        date: form.date,
        sources: form.sources,
        extra_notes: form.extra_notes,
        tone: form.tone,
      };

      const content = await generateReport(data);
      clearInterval(interval);
      setProgress(100);

      const reportData = {
        user_id: user!.id,
        type,
        type_label: TYPE_LABELS[type],
        title: getTitle(),
        competition: form.competition,
        date: form.date,
        sources: form.sources,
        extra_notes: form.extra_notes,
        tone: form.tone,
        content,
      };

      const saved = await createReport.mutateAsync(reportData);
      setGeneratedReport(saved);
      toast.success("✓ Informe guardado");
    } catch (err) {
      clearInterval(interval);
      toast.error("Error al generar el informe. Comprueba tu API key.");
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReport) return;
    await navigator.clipboard.writeText(generatedReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStep(1);
    setType("pre");
    setGeneratedReport(null);
    setProgress(0);
    setForm({ team: "", rival: "", playerName: "", position: "", competition: "Otra", date: "", sources: [], extra_notes: "", tone: "Técnico / profesional" });
  };

  const sections = SECTIONS[type];
  const parsedSections = generatedReport
    ? sections.map((title, i) => {
        const next = sections[i + 1];
        const pattern = new RegExp(`##\\s*${title}([\\s\\S]*?)${next ? `##\\s*${next}` : "$"}`, "i");
        const match = generatedReport.content.match(pattern);
        return { title, content: match ? match[1].trim() : "" };
      })
    : [];

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-[#e4eaf0] mb-1">Nuevo informe</h1>
      <p className="text-sm text-white/40 mb-6">Generado con IA</p>

      <ProgressBar step={step} />

      {/* STEP 1 — Type selection */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-white/60 mb-4">¿Qué tipo de informe quieres generar?</p>
          <TypeCard
            icon="⚔️"
            label="Pre-Partido"
            description="Scouting del rival antes del partido"
            selected={type === "pre"}
            onClick={() => setType("pre")}
          />
          <TypeCard
            icon="📊"
            label="Post-Partido"
            description="Análisis propio tras el partido"
            selected={type === "post"}
            onClick={() => setType("post")}
          />
          <TypeCard
            icon="👤"
            label="Jugador"
            description="Seguimiento individual de un jugador"
            selected={type === "player"}
            onClick={() => setType("player")}
          />
          <div className="pt-2">
            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 — Form */}
      {step === 2 && (
        <div className="space-y-5">
          {type !== "player" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Equipo propio" value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Ej: Barcelona" />
                <Input label="Rival" value={form.rival} onChange={(e) => set("rival", e.target.value)} placeholder="Ej: Real Madrid" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                <Select label="Competición" value={form.competition} options={COMPETITION_OPTIONS} onChange={(e) => set("competition", e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <Input label="Nombre del jugador" value={form.playerName} onChange={(e) => set("playerName", e.target.value)} placeholder="Ej: Pedri" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Posición" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Ej: MC" />
                <Select label="Competición" value={form.competition} options={COMPETITION_OPTIONS} onChange={(e) => set("competition", e.target.value)} />
              </div>
            </>
          )}

          {/* Sources */}
          <div>
            <p className="text-sm font-medium text-[#e4eaf0]/70 mb-2">Fuentes</p>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all
                    ${form.sources.includes(s)
                      ? "bg-[#00e87a]/10 border-[#00e87a]/40 text-[#00e87a]"
                      : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:border-white/20"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Observaciones del analista"
            value={form.extra_notes}
            onChange={(e) => set("extra_notes", e.target.value)}
            rows={4}
            placeholder="Añade contexto, patrones observados, indicaciones específicas..."
          />

          <Select
            label="Tono del informe"
            value={form.tone}
            options={TONE_OPTIONS}
            onChange={(e) => set("tone", e.target.value as ReportTone)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>← Atrás</Button>
            <Button className="flex-1" onClick={handleGenerate}>
              Generar informe ✦
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Result */}
      {step === 3 && (
        <div>
          {generating ? (
            <div className="text-center py-16 space-y-6">
              <div className="w-12 h-12 border-3 border-[#00e87a]/30 border-t-[#00e87a] rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
              <div>
                <p className="text-[#e4eaf0] font-medium mb-1">Analizando…</p>
                <p className="text-sm text-white/40">Claude está generando tu informe</p>
              </div>
              <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#00e87a] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : generatedReport ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                <p className="font-bold text-[#e4eaf0] text-lg mb-2">{generatedReport.title}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#00e87a]/10 text-[#00e87a] border border-[#00e87a]/20">
                    {generatedReport.type_label}
                  </span>
                  {generatedReport.competition && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                      {generatedReport.competition}
                    </span>
                  )}
                  {generatedReport.date && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                      {generatedReport.date}
                    </span>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {parsedSections.map((s) => (
                  <ReportSection key={s.title} title={s.title} content={s.content} />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                  {copied ? "✓ Copiado" : "Copiar"}
                </Button>
                <PDFExportButton report={generatedReport} />
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Nuevo informe
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
