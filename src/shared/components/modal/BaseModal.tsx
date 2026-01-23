import { ComponentProps, PropsWithChildren, useEffect } from "react";
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
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

const maxWidthValues = {
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
  full: "100%",
};

const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  formId,
  submitDisabled,
  isSubmitting,
  submitLabel = "Criar",
  size = "lg",
  maxWidth = "2xl",
}: BaseModalProps) => {
  useEffect(() => {
    if (isOpen && maxWidth) {
      // Encontra o elemento do modal após renderização
      const findModalElement = () => {
        const modalElements = document.querySelectorAll(
          '.relative.bg-white.dark\\:bg-neutral-800.rounded-lg.shadow-xl'
        );
        
        // Pega o último (mais recente) modal aberto
        const modalElement = Array.from(modalElements).pop() as HTMLElement;
        
        if (modalElement) {
          // Remove classes de max-width existentes do Tailwind
          modalElement.classList.forEach((cls) => {
            if (cls.startsWith('max-w-')) {
              modalElement.classList.remove(cls);
            }
          });
          
          // Aplica o novo max-width via estilo inline
          modalElement.style.maxWidth = maxWidthValues[maxWidth];
        }
      };

      // Usa setTimeout para garantir que o DOM foi atualizado
      const timeoutId = setTimeout(findModalElement, 0);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, maxWidth]);

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
          variant="primary"
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
