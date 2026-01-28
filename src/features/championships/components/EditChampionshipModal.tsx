import { useEffect, useMemo } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Championship } from "@/types";

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

interface EditChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: ChampionshipPayload) => Promise<void>;
  championship: Championship | null;
}

const EditChampionshipModal = ({
  isOpen,
  onClose,
  onUpdate,
  championship,
}: EditChampionshipModalProps) => {
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
    setFormData,
    handleChange,
    handleSubmit,
    error,
    isSubmitting,
    resetForm,
    isValid,
  } = useModalForm<ChampionshipFormState>(
    {
      name: "",
      description: "",
      min_players_per_team: "5",
      max_players_per_team: "10",
    },
    validationStrategy,
  );

  useEffect(() => {
    if (isOpen && championship) {
      setFormData({
        name: championship.name,
        description: championship.description ?? "",
        min_players_per_team: String(championship.min_players_per_team),
        max_players_per_team: String(championship.max_players_per_team),
      });
    }
  }, [isOpen, championship, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmitForm = async (data: ChampionshipFormState) => {
    if (!championship) return;

    await onUpdate(championship.id, {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      min_players_per_team: Number(data.min_players_per_team),
      max_players_per_team: Number(data.max_players_per_team),
    });
    resetForm();
  };

  const hasChanges = useMemo(() => {
    if (!championship) return false;
    return (
      formData.name.trim() !== championship.name ||
      formData.description.trim() !== (championship.description ?? "") ||
      Number(formData.min_players_per_team) !== championship.min_players_per_team ||
      Number(formData.max_players_per_team) !== championship.max_players_per_team
    );
  }, [formData, championship]);

  if (!championship) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Pelada">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form
          id="edit-championship-form"
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
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
            form="edit-championship-form"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting || !hasChanges}
            aria-label="Salvar Alterações"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditChampionshipModal;
