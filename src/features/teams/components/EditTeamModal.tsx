import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@sarradahub/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Team } from "@/types";

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: { name: string }) => Promise<void>;
  team: Team | null;
}

const EditTeamModal = ({
  isOpen,
  onClose,
  onUpdate,
  team,
}: EditTeamModalProps) => {
  const {
    formData,
    setFormData,
    handleChange,
    error,
    isSubmitting,
    resetForm,
  } = useModalForm({
    name: "",
  });

  useEffect(() => {
    if (isOpen && team) {
      setFormData({ name: team.name });
    }
  }, [isOpen, team, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!team) return;

    try {
      await onUpdate(team.id, { name: formData.name.trim() });
      handleClose();
    } catch (submitError) {
      console.error("Error updating team:", submitError);
    }
  };

  if (!team) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Time">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="edit-team-form" onSubmit={handleSubmit}>
          <FormInput
            label="Nome do Time"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Time do Bairro"
            required
          />
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
            form="edit-team-form"
            loading={isSubmitting}
            disabled={!formData.name.trim() || formData.name.trim() === team.name}
            aria-label="Salvar Alterações"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditTeamModal;
