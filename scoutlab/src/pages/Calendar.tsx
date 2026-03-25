import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMatches, useCreateMatch, useUpdateMatch, useDeleteMatch } from "../hooks/useCalendar";
import { MatchCard } from "../components/calendar/MatchCard";
import { MatchModal } from "../components/calendar/MatchModal";
import { ConfirmModal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ReportCardSkeleton } from "../components/ui/Skeleton";
import type { Match } from "../types";
import toast from "react-hot-toast";

export default function Calendar() {
  const { user } = useAuth();
  const { data: matches, isLoading } = useMatches();
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();

  const [modalOpen, setModalOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const upcoming = matches?.filter((m) => m.result === "Pendiente" && m.date >= today) ?? [];
  const played = matches?.filter((m) => m.result !== "Pendiente" || m.date < today) ?? [];

  const handleSubmit = async (data: Omit<Match, "id" | "user_id" | "created_at">) => {
    try {
      if (editMatch) {
        await updateMatch.mutateAsync({ id: editMatch.id, ...data });
        toast.success("Partido actualizado");
      } else {
        await createMatch.mutateAsync({ ...data, user_id: user!.id });
        toast.success("Partido añadido");
      }
      setModalOpen(false);
      setEditMatch(null);
    } catch {
      toast.error("Error al guardar el partido");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMatch.mutateAsync(deleteId);
      toast.success("Partido eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  const openEdit = (match: Match) => {
    setEditMatch(match);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditMatch(null);
    setModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#e4eaf0] mb-1">Calendario</h1>
          <p className="text-sm text-white/40">Gestiona tus partidos</p>
        </div>
        <Button onClick={openNew}>+ Partido</Button>
      </div>

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-4">
          Próximos partidos
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <ReportCardSkeleton key={i} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-white/30 py-4">No hay partidos pendientes.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} onDelete={setDeleteId} onEdit={openEdit} />
            ))}
          </div>
        )}
      </section>

      {/* Played */}
      <section>
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-4">
          Partidos disputados
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <ReportCardSkeleton key={i} />)}
          </div>
        ) : played.length === 0 ? (
          <p className="text-sm text-white/30 py-4">No hay partidos disputados.</p>
        ) : (
          <div className="space-y-3">
            {played.map((m) => (
              <MatchCard key={m.id} match={m} onDelete={setDeleteId} onEdit={openEdit} />
            ))}
          </div>
        )}
      </section>

      <MatchModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMatch(null); }}
        onSubmit={handleSubmit}
        initial={editMatch}
        loading={createMatch.isPending || updateMatch.isPending}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="¿Eliminar partido?"
        message="Esta acción no se puede deshacer. El partido será eliminado permanentemente."
        confirmLabel="Eliminar partido"
        loading={deleteMatch.isPending}
      />
    </div>
  );
}
