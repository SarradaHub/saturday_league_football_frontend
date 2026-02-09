import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Match } from "@/types";

interface TeamOption {
  id: number;
  name: string;
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: number,
    data: {
      name: string;
      team_1_id: number;
      team_2_id: number;
      team_1_goals?: number;
      team_2_goals?: number;
    },
  ) => Promise<void>;
  match: Match | null;
  teams: TeamOption[];
}

const EditMatchModal = ({
  isOpen,
  onClose,
  onUpdate,
  match,
  teams,
}: EditMatchModalProps) => {
  const {
    formData,
    setFormData,
    handleChange,
    error,
    isSubmitting,
    resetForm,
  } = useModalForm({
    name: "",
    team_1_id: "",
    team_2_id: "",
    team_1_goals: "",
    team_2_goals: "",
  });

  useEffect(() => {
    if (isOpen && match) {
      setFormData({
        name: match.name,
        team_1_id: String(match.team_1.id),
        team_2_id: String(match.team_2.id),
        team_1_goals: String(match.team_1_goals ?? 0),
        team_2_goals: String(match.team_2_goals ?? 0),
      });
    }
  }, [isOpen, match, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!match) return;

    try {
      await onUpdate(match.id, {
        name: formData.name.trim(),
        team_1_id: Number(formData.team_1_id),
        team_2_id: Number(formData.team_2_id),
        team_1_goals: formData.team_1_goals
          ? Number(formData.team_1_goals)
          : undefined,
        team_2_goals: formData.team_2_goals
          ? Number(formData.team_2_goals)
          : undefined,
      });
      handleClose();
    } catch (submitError) {
      console.error("Error updating match:", submitError);
    }
  };

  if (!match) return null;

  const team1Goals = formData.team_1_goals ? Number(formData.team_1_goals) : 0;
  const team2Goals = formData.team_2_goals ? Number(formData.team_2_goals) : 0;
  const hasChanges =
    formData.name.trim() !== match.name ||
    Number(formData.team_1_id) !== match.team_1.id ||
    Number(formData.team_2_id) !== match.team_2.id ||
    team1Goals !== (match.team_1_goals ?? 0) ||
    team2Goals !== (match.team_2_goals ?? 0);

  const submitDisabled =
    !formData.team_1_id ||
    !formData.team_2_id ||
    formData.team_1_id === formData.team_2_id ||
    !hasChanges;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Partida">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="edit-match-form" onSubmit={handleSubmit}>
          <FormInput
            label="Nome da Partida"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Final do Campeonato"
            required
          />
          <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <FormInput
              label="Time 1"
              name="team_1_id"
              value={formData.team_1_id}
              onChange={handleChange}
              placeholder="Selecione um time"
              type="select"
              options={teams.map((team) => ({ id: team.id, name: team.name }))}
              required
            />
            <FormInput
              label="Time 2"
              name="team_2_id"
              value={formData.team_2_id}
              onChange={handleChange}
              placeholder="Selecione um time"
              type="select"
              options={teams.map((team) => ({ id: team.id, name: team.name }))}
              required
            />
          </div>
          <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <FormInput
              label="Gols do Time 1"
              name="team_1_goals"
              value={formData.team_1_goals}
              onChange={handleChange}
              placeholder="0"
              type="number"
              min="0"
            />
            <FormInput
              label="Gols do Time 2"
              name="team_2_goals"
              value={formData.team_2_goals}
              onChange={handleChange}
              placeholder="0"
              type="number"
              min="0"
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
        </form>
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="edit-match-form"
            loading={isSubmitting}
            disabled={submitDisabled}
            aria-label="Salvar Alterações"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditMatchModal;
