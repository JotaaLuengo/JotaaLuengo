import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input, Textarea, Select } from "../ui/Input";
import { Button } from "../ui/Button";
import type { Match, MatchResult } from "../../types";
import { COMPETITIONS } from "../../types";

type MatchFormData = Omit<Match, "id" | "user_id" | "created_at">;

const RESULTS: { value: MatchResult; label: string }[] = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Victoria",  label: "Victoria"  },
  { value: "Empate",    label: "Empate"    },
  { value: "Derrota",   label: "Derrota"   },
];

const competitionOptions = COMPETITIONS.map((c) => ({ value: c, label: c }));

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MatchFormData) => Promise<void>;
  initial?: Match | null;
  loading?: boolean;
}

const EMPTY: MatchFormData = {
  team: "",
  rival: "",
  date: "",
  time: "",
  competition: "Otra",
  result: "Pendiente",
  notes: "",
};

export function MatchModal({ open, onClose, onSubmit, initial, loading }: MatchModalProps) {
  const [form, setForm] = useState<MatchFormData>(EMPTY);

  useEffect(() => {
    setForm(initial ? { team: initial.team, rival: initial.rival, date: initial.date, time: initial.time, competition: initial.competition, result: initial.result, notes: initial.notes } : EMPTY);
  }, [initial, open]);

  const set = (key: keyof MatchFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.team || !form.rival || !form.date) return;
    await onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar partido" : "Nuevo partido"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!form.team || !form.rival || !form.date}>
            {initial ? "Guardar cambios" : "Añadir partido"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Equipo propio" value={form.team} onChange={(e) => set("team", e.target.value)} placeholder="Ej: Barcelona" />
          <Input label="Rival" value={form.rival} onChange={(e) => set("rival", e.target.value)} placeholder="Ej: Real Madrid" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          <Input label="Hora" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </div>
        <Select
          label="Competición"
          value={form.competition}
          options={competitionOptions}
          onChange={(e) => set("competition", e.target.value)}
        />
        <Select
          label="Resultado"
          value={form.result}
          options={RESULTS}
          onChange={(e) => set("result", e.target.value as MatchResult)}
        />
        <Textarea
          label="Notas"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Observaciones del partido..."
        />
      </div>
    </Modal>
  );
}
