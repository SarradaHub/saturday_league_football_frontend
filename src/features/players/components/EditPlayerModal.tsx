import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Player } from "@/types";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: { name: string }) => Promise<void>;
  player: Player | null;
}

const EditPlayerModal = ({
  isOpen,
  onClose,
  onUpdate,
  player,
}: EditPlayerModalProps) => {
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
    if (isOpen && player) {
      setFormData({ name: player.name });
    }
  }, [isOpen, player, setFormData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!player) return;

    try {
      await onUpdate(player.id, { name: formData.name.trim() });
      handleClose();
    } catch (submitError) {
      // Error is handled by the mutation in the parent component
      console.error("Error updating player:", submitError);
    }
  };

  if (!player) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Jogador">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="edit-player-form" onSubmit={handleSubmit}>
          <FormInput
            label="Nome do Jogador"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: João Silva"
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
            form="edit-player-form"
            loading={isSubmitting}
            disabled={!formData.name.trim() || formData.name.trim() === player.name}
            aria-label="Salvar Alterações"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditPlayerModal;
