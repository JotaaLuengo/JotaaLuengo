import type { ReportType, ReportTone } from "../types";
import { SECTIONS } from "../types";

interface FormData {
  type: ReportType;
  title: string;
  team?: string;
  rival?: string;
  playerName?: string;
  position?: string;
  competition: string;
  date?: string;
  sources: string[];
  extra_notes: string;
  tone: ReportTone;
}

const toneInstructions: Record<ReportTone, string> = {
  "Técnico / profesional":
    "Usa un lenguaje técnico y preciso, orientado a profesionales del fútbol. Incluye terminología táctica y estadística avanzada.",
  "Ejecutivo / conciso":
    "Sé conciso y directo. Resume los puntos clave en párrafos cortos. Enfócate en conclusiones accionables.",
  "Detallado / exhaustivo":
    "Sé exhaustivo y minucioso. Incluye todos los detalles posibles, subcategorías y ejemplos concretos.",
};

export function buildPrompt(data: FormData): string {
  const sections = SECTIONS[data.type];
  const sectionsStr = sections.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const sourcesStr = data.sources.length > 0 ? data.sources.join(", ") : "No especificadas";

  const contextBlock =
    data.type === "player"
      ? `Jugador analizado: ${data.playerName}\nPosición: ${data.position}\nCompetición: ${data.competition}`
      : `Equipo propio: ${data.team}\nRival: ${data.rival}\nFecha: ${data.date || "No especificada"}\nCompetición: ${data.competition}`;

  return `Eres un analista de fútbol profesional de élite. Genera un informe de scouting completo y riguroso.

TIPO DE INFORME: ${data.type === "pre" ? "Pre-Partido (Scouting del rival)" : data.type === "post" ? "Post-Partido (Análisis propio)" : "Jugador (Seguimiento individual)"}

CONTEXTO:
${contextBlock}

FUENTES UTILIZADAS: ${sourcesStr}

TONO REQUERIDO: ${data.tone}
${toneInstructions[data.tone]}

OBSERVACIONES DEL ANALISTA:
${data.extra_notes || "Sin observaciones adicionales."}

ESTRUCTURA DEL INFORME:
Genera el informe con exactamente estas secciones, usando ## como encabezado de cada sección:
${sectionsStr}

INSTRUCCIONES:
- Escribe en español
- Sé específico y usa datos concretos cuando sea posible
- Cada sección debe tener al menos 2-3 párrafos sustanciales
- Incluye subbullets donde sea apropiado para mayor claridad
- El informe debe ser de alto valor para el cuerpo técnico`;
}
