export type ReportType = "pre" | "post" | "player";
export type MatchResult = "Victoria" | "Empate" | "Derrota" | "Pendiente";
export type ReportTone = "Técnico / profesional" | "Ejecutivo / conciso" | "Detallado / exhaustivo";

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  type_label: string;
  title: string;
  competition: string;
  date: string;
  sources: string[];
  extra_notes: string;
  tone: ReportTone;
  content: string;
  created_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  team: string;
  rival: string;
  date: string;
  time: string;
  competition: string;
  result: MatchResult;
  notes: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export const SECTIONS: Record<ReportType, string[]> = {
  pre:    ["Sistema táctico rival", "Jugadores clave", "Puntos débiles", "Estrategia a balón parado", "Recomendaciones"],
  post:   ["Resumen del partido", "Rendimiento colectivo", "Rendimiento individual", "Errores detectados", "Conclusiones"],
  player: ["Perfil técnico", "Estadísticas clave", "Análisis físico", "Comparativa liga", "Valoración global"],
};

export const COMPETITIONS = [
  "LaLiga", "Champions League", "Copa del Rey", "Segunda División", "Friendly", "Otra",
];

export const SOURCES = [
  "Wyscout", "InStat", "StatsBomb", "Opta", "Vídeo propio", "GPS / Físico", "Transfermarkt", "FBref",
];
