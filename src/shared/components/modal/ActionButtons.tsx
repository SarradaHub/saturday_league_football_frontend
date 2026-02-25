import { Button } from "@sarradahub/design-system";
import { Player } from "@/types";

interface ActionButtonsProps {
  isSubmitting: boolean;
  searchTerm: string;
  selectedPlayer: Player | null;
  context: "round" | "team";
  onClose: () => void;
  onSubmit: () => void;
}

const ActionButtons = ({
  isSubmitting,
  searchTerm,
  selectedPlayer,
  context,
  onClose,
  onSubmit,
}: ActionButtonsProps) => (
  <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
    <Button
      type="button"
      variant="secondary"
      onClick={onClose}
      disabled={isSubmitting}
    >
      Cancelar
    </Button>
    <Button
      type="button"
      variant="primary"
      onClick={onSubmit}
      loading={isSubmitting}
      disabled={isSubmitting || (!searchTerm && !selectedPlayer)}
    >
      {isSubmitting
        ? selectedPlayer
          ? "Adicionando..."
          : "Criando..."
        : selectedPlayer
          ? `Adicionar ao ${context === "team" ? "Time" : "Round"}`
          : "Criar Jogador"}
    </Button>
  </div>
);

export default ActionButtons;
