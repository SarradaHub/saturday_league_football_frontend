import { Modal, Button } from "@platform/design-system";
import { Team } from "@/types";

interface SuggestedMatch {
  name: string;
  team_1: Team;
  team_2: Team;
}

interface SuggestedMatchPreviewModalProps {
  isOpen: boolean;
  suggestedMatch: SuggestedMatch | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SuggestedMatchPreviewModal = ({
  isOpen,
  suggestedMatch,
  isSubmitting = false,
  onClose,
  onConfirm,
}: SuggestedMatchPreviewModalProps) => {
  if (!suggestedMatch) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar próxima partida">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p style={{ color: "#737373", margin: 0 }}>
          Confirmar a criação da próxima partida sugerida.
        </p>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ fontWeight: 600 }}>{suggestedMatch.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <span>{suggestedMatch.team_1.name}</span>
            <span>vs</span>
            <span>{suggestedMatch.team_2.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Criar partida
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SuggestedMatchPreviewModal;
