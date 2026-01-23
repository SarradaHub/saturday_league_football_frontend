import { useState } from "react";
import { Modal } from "@sarradahub/design-system";
import { Button } from "@sarradahub/design-system";
import { Team } from "@/types";

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  team: Team | null;
  isDeleting?: boolean;
}

const DeleteTeamModal = ({
  isOpen,
  onClose,
  onConfirm,
  team,
  isDeleting = false,
}: DeleteTeamModalProps) => {
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
          : "Não foi possível excluir o time. Verifique se o time possui jogadores ou partidas associadas.",
      );
    }
  };

  if (!team) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Time">
      <div className="space-y-4">
        <p className="text-neutral-700">
          Tem certeza que deseja excluir o time{" "}
          <span className="font-semibold">{team.name}</span>?
        </p>
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-sm text-warning-800">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os
            jogadores e partidas associadas a este time serão afetados.
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

export default DeleteTeamModal;
