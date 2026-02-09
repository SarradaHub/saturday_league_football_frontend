import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";

interface CreateMatchPayload {
  name: string;
  team_1_id: number;
  team_2_id: number;
  round_id: number;
  date?: string;
}

interface TeamOption {
  id: number;
  name: string;
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: CreateMatchPayload) => Promise<void>;
  teams: TeamOption[];
  roundId: number;
}

const CreateMatchModal = ({
  isOpen,
  onClose,
  onCreate,
  teams,
  roundId,
}: CreateMatchModalProps) => {
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
    round_id: roundId,
    date: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      round_id: roundId,
    }));
  }, [roundId, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({
      name: formData.name,
      round_id: roundId,
      team_1_id: Number(formData.team_1_id),
      team_2_id: Number(formData.team_2_id),
      date: formData.date,
    });
    handleClose();
  };

  const submitDisabled =
    !formData.team_1_id ||
    !formData.team_2_id ||
    formData.team_1_id === formData.team_2_id;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Nova Partida">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="match-form" onSubmit={handleSubmit}>
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
            form="match-form"
            loading={isSubmitting}
            disabled={submitDisabled}
            aria-label="Criar Partida"
          >
            Criar Partida
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateMatchModal;
