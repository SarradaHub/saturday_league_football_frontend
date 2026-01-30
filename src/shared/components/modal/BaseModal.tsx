import { ComponentProps, PropsWithChildren } from "react";
import { Modal } from "@sarradahub/design-system";
import { Button } from "@sarradahub/design-system";

interface BaseModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formId?: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  size?: ComponentProps<typeof Modal>["size"];
}

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  formId,
  submitDisabled,
  isSubmitting,
  submitLabel = "Criar",
  size = "md",
}: BaseModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      {children}
      <div className="mt-8 flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Cancelar"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting}
          disabled={submitDisabled || isSubmitting}
          aria-label={submitLabel}
        >
          {submitLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default BaseModal;
