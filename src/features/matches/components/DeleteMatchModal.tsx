import { useState } from "react";
import { Modal, Button, Alert } from "@sarradahub/design-system";
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#404040" }}>
          Tem certeza que deseja excluir a partida{" "}
          <span style={{ fontWeight: 600 }}>{match.name}</span>?
        </p>
        <Alert variant="warning">
          <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
          estatísticas de jogadores associadas a esta partida serão perdidas.
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

export default DeleteMatchModal;
