import { FormEvent, useEffect } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
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
    setFormData({ ...formData, round_id: roundId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Novo Time"
      formId="team-form"
      isSubmitting={isSubmitting}
      submitDisabled={!formData.name}
      submitLabel="Criar Time"
    >
      <form id="team-form" onSubmit={handleSubmit}>
        <FormInput
          label="Nome do Time"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Time do Bairro"
          required
        />
        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3">
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default CreateTeamModal;
