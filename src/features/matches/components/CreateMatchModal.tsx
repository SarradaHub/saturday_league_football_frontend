import { FormEvent, useEffect } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
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
    setFormData({
      ...formData,
      round_id: roundId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Nova Partida"
      formId="match-form"
      isSubmitting={isSubmitting}
      submitDisabled={submitDisabled}
      submitLabel="Criar Partida"
    >
      <form id="match-form" onSubmit={handleSubmit}>
        <FormInput
          label="Nome da Partida"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Final do Campeonato"
          required
        />
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        {error && (
          <div className="mb-6 rounded-lg border border-error-100 bg-error-50 p-3">
            <span className="text-sm text-error-600">{error}</span>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default CreateMatchModal;
