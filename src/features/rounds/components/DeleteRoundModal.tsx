import { useState } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import { Round } from "@/types";

interface DeleteRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  round: Round | null;
  isDeleting?: boolean;
}

const DeleteRoundModal = ({
  isOpen,
  onClose,
  onConfirm,
  round,
  isDeleting = false,
}: DeleteRoundModalProps) => {
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
          : "Não foi possível excluir a rodada. Verifique se há partidas associadas.",
      );
    }
  };

  if (!round) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Rodada">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#404040" }}>
          Tem certeza que deseja excluir a rodada{" "}
          <span style={{ fontWeight: 600 }}>{round.name}</span>?
        </p>
        <Alert variant="warning">
          <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
          partidas, times e estatísticas associadas a esta rodada serão permanentemente excluídos.
        </Alert>
        {round.matches && round.matches.length > 0 && (
          <Alert variant="info">
            Esta rodada possui <strong>{round.matches.length}</strong>{" "}
            partida{round.matches.length !== 1 ? "s" : ""} cadastrada
            {round.matches.length !== 1 ? "s" : ""}.
          </Alert>
        )}
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

export default DeleteRoundModal;
