import { FormEvent, useEffect } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Jogador"
      formId="edit-player-form"
      isSubmitting={isSubmitting}
      submitDisabled={!formData.name.trim() || formData.name.trim() === player.name}
      submitLabel="Salvar Alterações"
    >
      <form id="edit-player-form" onSubmit={handleSubmit}>
        <FormInput
          label="Nome do Jogador"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: João Silva"
          required
        />
        {error && (
          <div className="mb-6 rounded-lg border border-error-100 bg-error-50 p-3">
            <span className="text-sm text-error-600">{error}</span>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default EditPlayerModal;
