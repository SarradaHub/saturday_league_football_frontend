import { useState } from "react";
import { Modal } from "@sarradahub/design-system";
import { Button } from "@sarradahub/design-system";
import { Player } from "@/types";

interface DeletePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  player: Player | null;
  isDeleting?: boolean;
}

const DeletePlayerModal = ({
  isOpen,
  onClose,
  onConfirm,
  player,
  isDeleting = false,
}: DeletePlayerModalProps) => {
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
          : "Não foi possível excluir o jogador. Verifique se o jogador possui estatísticas ou vínculos que impedem a exclusão.",
      );
    }
  };

  if (!player) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Jogador">
      <div className="space-y-4">
        <p className="text-neutral-700">
          Tem certeza que deseja excluir o jogador{" "}
          <span className="font-semibold">{player.name}</span>?
        </p>
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-sm text-warning-800">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
            estatísticas e vínculos associados a este jogador serão perdidos.
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

export default DeletePlayerModal;
