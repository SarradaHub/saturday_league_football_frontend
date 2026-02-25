import { useState, useEffect } from "react";
import { Modal, Button, Alert, Card, CardContent } from "@sarradahub/design-system";
import roundRepository from "@/features/rounds/api/roundRepository";
import { Player, Round } from "@/types";

interface SubstitutePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubstitute: () => void;
  round: Round | null;
  players: Player[];
  matchId?: number;
}

const SubstitutePlayerModal = ({
  isOpen,
  onClose,
  onSubstitute,
  round,
  players,
  matchId,
}: SubstitutePlayerModalProps) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedReplacement, setSuggestedReplacement] = useState<{
    id: number;
    display_name: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerId(null);
      setError(null);
      setSuggestedReplacement(null);
    }
  }, [isOpen]);

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!round || !selectedPlayerId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await roundRepository.substitutePlayer(round.id, selectedPlayerId, matchId);
      setSuggestedReplacement({
        id: result.replacement_player_id,
        display_name: result.replacement_player_name,
      });
      setTimeout(() => {
        onSubstitute();
        handleClose();
      }, 1500);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao realizar substituição"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayerId(null);
    setError(null);
    setSuggestedReplacement(null);
    onClose();
  };

  if (!round) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Substituir Jogador"
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {suggestedReplacement ? (
          <Alert variant="success">
            <p>
              <strong>{suggestedReplacement.display_name}</strong> foi adicionado como substituto.
            </p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
              Os times serão rebalanceados automaticamente.
            </p>
          </Alert>
        ) : (
          <>
            <p style={{ fontSize: "0.875rem", color: "#737373", marginBottom: "1rem" }}>
              Selecione o jogador que deseja substituir. O sistema encontrará automaticamente o próximo jogador disponível.
            </p>

            {error && <Alert variant="error">{error}</Alert>}

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {players.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {players.map((player) => (
                    <Card
                      key={player.id}
                      variant="outlined"
                      padding="sm"
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedPlayerId === player.id ? "#dbeafe" : "transparent",
                        borderColor: selectedPlayerId === player.id ? "#2563eb" : undefined,
                      }}
                      onClick={() => handlePlayerSelect(player.id)}
                    >
                      <CardContent>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <input
                            type="radio"
                            checked={selectedPlayerId === player.id}
                            onChange={() => handlePlayerSelect(player.id)}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ fontWeight: selectedPlayerId === player.id ? 600 : 400 }}>
                            {player.display_name}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "2rem 0" }}>
                  Nenhum jogador disponível na rodada
                </p>
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {suggestedReplacement ? "Fechar" : "Cancelar"}
          </Button>
          {!suggestedReplacement && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!selectedPlayerId || isSubmitting}
            >
              Confirmar Substituição
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SubstitutePlayerModal;
