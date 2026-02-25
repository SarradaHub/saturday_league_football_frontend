import { useState } from "react";
import { Modal, Button, Alert } from "@sarradahub/design-system";
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#404040" }}>
          Tem certeza que deseja excluir o time{" "}
          <span style={{ fontWeight: 600 }}>{team.name}</span>?
        </p>
        <Alert variant="warning">
          <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os
          jogadores e partidas associadas a este time serão afetados.
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

export default DeleteTeamModal;
