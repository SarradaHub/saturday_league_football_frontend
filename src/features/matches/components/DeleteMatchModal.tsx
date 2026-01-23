import { useState } from "react";
import { Modal } from "@sarradahub/design-system";
import { Button } from "@sarradahub/design-system";
import { Match } from "@/types";

interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  match: Match | null;
  isDeleting?: boolean;
}

const DeleteMatchModal = ({
  isOpen,
  onClose,
  onConfirm,
  match,
  isDeleting = false,
}: DeleteMatchModalProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Não foi possível excluir a partida. Verifique se a partida possui estatísticas de jogadores associadas.",
      );
    }
  };

  if (!match) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Partida">
      <div className="space-y-4">
        <p className="text-neutral-700">
          Tem certeza que deseja excluir a partida{" "}
          <span className="font-semibold">{match.name}</span>?
        </p>
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-sm text-warning-800">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
            estatísticas de jogadores associadas a esta partida serão perdidas.
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-error-100 bg-error-50 p-3">
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}
        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            aria-label="Excluir"
          >
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteMatchModal;
