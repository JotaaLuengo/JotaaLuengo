import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMatches } from "../hooks/useCalendar";
import { useReports } from "../hooks/useReports";
import { StatCard } from "../components/dashboard/StatCard";
import { WDLBar } from "../components/dashboard/WDLBar";
import { StreakBadges } from "../components/dashboard/StreakBadges";
import { StatCardSkeleton } from "../components/ui/Skeleton";
import type { Match } from "../types";

const DEMO_BAR_DATA = [
  { label: "J1", goals: 2, possession: 55 },
  { label: "J2", goals: 0, possession: 48 },
  { label: "J3", goals: 3, possession: 61 },
  { label: "J4", goals: 1, possession: 52 },
  { label: "J5", goals: 2, possession: 58 },
];

function toBarData(matches: Match[]) {
  return matches
    .filter((m) => m.result !== "Pendiente")
    .map((m, i) => ({ label: `J${i + 1}`, goals: 0, possession: 50, match: `${m.team} vs ${m.rival}` }));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-white/60 mb-1">{label}</p>
        <p className="text-[#00e87a] font-semibold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: matches, isLoading: loadingMatches } = useMatches();
  const { data: reports, isLoading: loadingReports } = useReports();

  const stats = useMemo(() => {
    if (!matches) return { total: 0, wins: 0, draws: 0, losses: 0, winPct: "0" };
    const played = matches.filter((m) => m.result !== "Pendiente");
    const wins = played.filter((m) => m.result === "Victoria").length;
    const draws = played.filter((m) => m.result === "Empate").length;
    const losses = played.filter((m) => m.result === "Derrota").length;
    const winPct = played.length > 0 ? ((wins / played.length) * 100).toFixed(0) : "0";
    return { total: played.length, wins, draws, losses, winPct };
  }, [matches]);

  const thisMonthReports = useMemo(() => {
    if (!reports) return 0;
    const now = new Date();
    return reports.filter((r) => {
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [reports]);

  const barData = matches && matches.length > 0 ? toBarData(matches) : DEMO_BAR_DATA;
  const resultsList = matches ? matches.map((m) => m.result) : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-[#e4eaf0] mb-1">Dashboard</h1>
      <p className="text-sm text-white/40 mb-8">Resumen de rendimiento</p>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {loadingMatches || loadingReports ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Partidos jugados" value={stats.total} />
            <StatCard label="Victorias" value={stats.wins} accent="#00e87a" />
            <StatCard label="Empates" value={stats.draws} accent="#f0c040" />
            <StatCard label="Derrotas" value={stats.losses} accent="#ff4d6d" />
            <StatCard label="% Victorias" value={`${stats.winPct}%`} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard
          label="Informes generados"
          value={reports?.length ?? 0}
          sub="Total histórico"
        />
        <StatCard
          label="Informes este mes"
          value={thisMonthReports}
          sub={new Date().toLocaleString("es-ES", { month: "long", year: "numeric" })}
        />
      </div>

      {/* W/D/L Bar */}
      <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03] mb-4">
        <p className="text-sm font-medium text-[#e4eaf0] mb-4">Distribución de resultados</p>
        <WDLBar wins={stats.wins} draws={stats.draws} losses={stats.losses} />
      </div>

      {/* Streak */}
      <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03] mb-8">
        <p className="text-sm font-medium text-[#e4eaf0] mb-4">Últimos 5 resultados</p>
        <StreakBadges results={resultsList} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
          <p className="text-sm font-medium text-[#e4eaf0] mb-4">Goles por jornada</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="goals" fill="#00e87a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
          <p className="text-sm font-medium text-[#e4eaf0] mb-4">% Posesión por jornada</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="possession" fill="#00b3ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
