import { useState } from "react";
import { Modal, Button, Alert } from "@platform/design-system";
import { Championship } from "@/types";

interface DeleteChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  championship: Championship | null;
  isDeleting?: boolean;
}

const DeleteChampionshipModal = ({
  isOpen,
  onClose,
  onConfirm,
  championship,
  isDeleting = false,
}: DeleteChampionshipModalProps) => {
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
          : "Não foi possível excluir a pelada. Verifique se há rodadas ou partidas associadas.",
      );
    }
  };

  if (!championship) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir Pelada">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#404040" }}>
          Tem certeza que deseja excluir a pelada{" "}
          <span style={{ fontWeight: 600 }}>{championship.name}</span>?
        </p>
        <Alert variant="warning">
          <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todas as
          rodadas, times, partidas e estatísticas associadas a esta pelada
          serão permanentemente excluídos.
        </Alert>
        {championship.round_total > 0 && (
          <Alert variant="info">
            Esta pelada possui <strong>{championship.round_total}</strong>{" "}
            rodada{championship.round_total !== 1 ? "s" : ""} cadastrada
            {championship.round_total !== 1 ? "s" : ""}.
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

export default DeleteChampionshipModal;
