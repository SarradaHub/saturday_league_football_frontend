import { FormEvent, useEffect } from "react";
import { Modal, Button, Alert } from "@sarradahub/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Player } from "@/types";

interface EditPlayerPayload {
  first_name?: string;
  last_name?: string;
  nickname?: string;
}

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: EditPlayerPayload) => Promise<void>;
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
    first_name: "",
    last_name: "",
    nickname: "",
  });

  useEffect(() => {
    if (isOpen && player) {
      setFormData({
        first_name: player.first_name ?? "",
        last_name: player.last_name ?? "",
        nickname: player.nickname ?? "",
      });
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
      await onUpdate(player.id, {
        first_name: formData.first_name?.trim() || undefined,
        last_name: formData.last_name?.trim() || undefined,
        nickname: formData.nickname?.trim() || undefined,
      });
      handleClose();
    } catch (submitError) {
      console.error("Error updating player:", submitError);
    }
  };

  if (!player) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Jogador">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form id="edit-player-form" onSubmit={handleSubmit}>
          <FormInput
            label="Nome"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Ex: João"
          />
          <FormInput
            label="Sobrenome"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Ex: Silva"
          />
          <FormInput
            label="Apelido"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="Ex: Joãozinho"
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
            disabled={isSubmitting}
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
