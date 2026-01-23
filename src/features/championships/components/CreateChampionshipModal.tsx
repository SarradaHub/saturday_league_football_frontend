import { useMemo } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";

export interface ChampionshipPayload {
  name: string;
  description?: string;
  min_players_per_team: number;
  max_players_per_team: number;
}

interface ChampionshipFormState extends Record<string, string> {
  name: string;
  description: string;
  min_players_per_team: string;
  max_players_per_team: string;
}

interface CreateChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: ChampionshipPayload) => Promise<void>;
}

const initialState: ChampionshipFormState = {
  name: "",
  description: "",
  min_players_per_team: "5",
  max_players_per_team: "10",
};

const CreateChampionshipModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateChampionshipModalProps) => {
  const validationStrategy = useMemo(
    () => ({
      validate(data: ChampionshipFormState) {
        const errors: string[] = [];

        if (!data.name.trim()) {
          errors.push("O nome da pelada é obrigatório.");
        }

        const min = Number(data.min_players_per_team);
        const max = Number(data.max_players_per_team);

        if (Number.isNaN(min) || min < 0) {
          errors.push(
            "O mínimo por time deve ser um número maior ou igual a zero.",
          );
        }

        if (Number.isNaN(max) || max <= 0) {
          errors.push("O máximo por time deve ser um número maior que zero.");
        }

        if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
          errors.push("O máximo por time deve ser maior ou igual ao mínimo.");
        }

        return { isValid: errors.length === 0, errors };
      },
    }),
    [],
  );

  const {
    formData,
    handleChange,
    handleSubmit,
    error,
    isSubmitting,
    resetForm,
    isValid,
  } = useModalForm<ChampionshipFormState>(initialState, validationStrategy);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitForm = async (data: ChampionshipFormState) => {
    await onCreate({
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      min_players_per_team: Number(data.min_players_per_team),
      max_players_per_team: Number(data.max_players_per_team),
    });
    resetForm();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Nova Pelada"
      formId="championship-form"
      isSubmitting={isSubmitting}
      submitLabel="Criar Pelada"
      submitDisabled={!isValid || isSubmitting}
    >
      <form
        id="championship-form"
        onSubmit={(event) => handleSubmit(handleSubmitForm, event)}
      >
        <FormInput
          label="Nome da Pelada"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Pelada da Empresa"
          required
        />
        <FormInput
          label="Descrição (Opcional)"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Adicione uma descrição para sua pelada"
          type="textarea"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            label="Mínimo de jogadores por time"
            name="min_players_per_team"
            value={formData.min_players_per_team}
            onChange={handleChange}
            placeholder="Mínimo"
            type="number"
            inputProps={{ min: 0 }}
            required
          />
          <FormInput
            label="Máximo de jogadores por time"
            name="max_players_per_team"
            value={formData.max_players_per_team}
            onChange={handleChange}
            placeholder="Máximo"
            type="number"
            inputProps={{ min: 1 }}
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

export default CreateChampionshipModal;
