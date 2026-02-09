import { useState } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#404040" }}>
          Tem certeza que deseja excluir o jogador{" "}
          <span style={{ fontWeight: 600 }}>{player.display_name}</span>?
        </p>
        <Alert variant="warning">
          <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
          estatísticas e vínculos associados a este jogador serão perdidos.
        </Alert>
        {error && <Alert variant="error">{error}</Alert>}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
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
