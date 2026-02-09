import { Modal, Button, Alert } from "@platform/design-system";
import { Team } from "@/types";

interface SelectMatchWinnerModalProps {
  isOpen: boolean;
  candidates: Team[];
  nextOpponent?: Team;
  reason?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSelect: (winnerTeamId: number) => void;
}

const SelectMatchWinnerModal = ({
  isOpen,
  candidates,
  nextOpponent,
  reason,
  isSubmitting = false,
  onClose,
  onSelect,
}: SelectMatchWinnerModalProps) => {
  const validCandidates = candidates.length === 2;
  const isPenaltyShootout = reason === "first_match_draw_one_next_team";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escolher Vencedor">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p style={{ color: "#737373", margin: 0 }}>
          A primeira partida terminou empatada e há apenas um time completo
          aguardando. Escolha o vencedor para seguir a sequência automática.
        </p>
        {isPenaltyShootout && (
          <p style={{ color: "#171717", margin: 0, fontWeight: 500 }}>
            A decisão será por disputa de pênaltis: selecione o time vencedor da cobrança.
          </p>
        )}
        {nextOpponent && (
          <div style={{ color: "#111827", fontWeight: 500 }}>
            Próximo adversário: {nextOpponent.name}
          </div>
        )}
        {!validCandidates && (
          <Alert variant="error">
            Não foi possível carregar os times para seleção.
          </Alert>
        )}
        {validCandidates && (
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {candidates.map((team) => (
              <Button
                key={team.id}
                type="button"
                variant="primary"
                onClick={() => onSelect(team.id)}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {team.name}
              </Button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectMatchWinnerModal;
