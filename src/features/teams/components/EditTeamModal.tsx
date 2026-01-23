import { FormEvent, useEffect } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
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
      // Error is handled by the mutation in the parent component
      console.error("Error updating team:", submitError);
    }
  };

  if (!team) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Time"
      formId="edit-team-form"
      isSubmitting={isSubmitting}
      submitDisabled={!formData.name.trim() || formData.name.trim() === team.name}
      submitLabel="Salvar Alterações"
    >
      <form id="edit-team-form" onSubmit={handleSubmit}>
        <FormInput
          label="Nome do Time"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Time do Bairro"
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

export default EditTeamModal;
