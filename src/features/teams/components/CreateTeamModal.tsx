import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@sarradahub/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: { name: string; round_id: number }) => Promise<void>;
  roundId: number;
}

const CreateTeamModal = ({
  isOpen,
  onClose,
  onCreate,
  roundId,
}: CreateTeamModalProps) => {
  const {
    formData,
    setFormData,
    handleChange,
    error,
    isSubmitting,
    resetForm,
  } = useModalForm({
    name: "",
    round_id: roundId,
  });

  useEffect(() => {
    setFormData((prev: typeof formData) => ({ ...prev, round_id: roundId }));
  }, [roundId, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreate({ name: formData.name, round_id: roundId });
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Time">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="team-form" onSubmit={handleSubmit}>
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
            form="team-form"
            loading={isSubmitting}
            disabled={!formData.name}
            aria-label="Criar Time"
          >
            Criar Time
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTeamModal;
