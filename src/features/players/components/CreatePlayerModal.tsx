import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Modal, Button, Alert } from "@platform/design-system";
import RoundFilterSection from "@/features/rounds/components/RoundFilterSection";
import PlayerSearchInput from "@/features/players/components/PlayerSearchInput";
import playerRepository from "@/features/players/api/playerRepository";
import { Player, Round } from "@/types";

interface CreatePlayerPayload {
  name: string;
  player_rounds_attributes?: Array<{ round_id: number }>;
  team_id?: number;
  championship_id?: number;
}

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: CreatePlayerPayload) => Promise<void>;
  championshipId?: number;
  currentPlayers: Player[];
  context?: "round" | "team";
  rounds?: Round[];
  playersFromRound?: Player[];
  selectedRoundId?: number | null;
  onRoundChange?: (roundId: number) => void;
  onExistingPlayerAdded?: () => void;
}

const CreatePlayerModal = ({
  isOpen,
  onClose,
  onCreate,
  championshipId,
  currentPlayers,
  context = "round",
  rounds = [],
  playersFromRound = [],
  selectedRoundId = null,
  onRoundChange = () => {},
  onExistingPlayerAdded,
}: CreatePlayerModalProps) => {
  const { id: routeIdParam } = useParams<{ id: string }>();
  const routeId = useMemo(
    () => (routeIdParam ? Number(routeIdParam) : undefined),
    [routeIdParam],
  );
  // targetId is always the current page's round/team (from URL), not the filter
  // Filter is only for viewing players from other rounds
  const targetId = context === "team" ? routeId : routeId;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoundFilter, setShowRoundFilter] = useState(false);

  const currentPlayersRef = useRef(currentPlayers);
  currentPlayersRef.current = currentPlayers;

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      return;
    }
    setError(null);
    setIsSubmitting(false);
    if (!championshipId) {
      setExistingPlayers([]);
      return;
    }

    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        // Use round_id parameter for efficient filtering
        // If filter is active (selectedRoundId), use it; otherwise use targetId (current round)
        let roundIdParam: number | undefined = undefined;
        if (context === "round") {
          if (selectedRoundId && selectedRoundId > 0) {
            // Filter is active - use selected round from filter
            roundIdParam = selectedRoundId;
          } else if (targetId) {
            // No filter - use current round where modal is open
            roundIdParam = targetId;
          }
        }
        
        const players = await playerRepository.list(championshipId, {
          round_id: roundIdParam,
        });
        
        const availablePlayers = players.filter(
          (player) =>
            !currentPlayersRef.current.some((p) => p.id === player.id),
        );

        setExistingPlayers(availablePlayers);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Não foi possível carregar os jogadores.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlayers();
  }, [isOpen, championshipId, context, selectedRoundId]);

  const filteredPlayers = useMemo(() => {
    if (!isOpen) return [];
    
    // For team context, use playersFromRound if available and round is selected
    // Otherwise use existingPlayers (which is already filtered by selected round for round context)
    const candidates =
      context === "team" && selectedRoundId && playersFromRound.length > 0
        ? playersFromRound
        : existingPlayers;

    return candidates.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [
    context,
    existingPlayers,
    isOpen,
    playersFromRound,
    searchTerm,
    selectedRoundId,
  ]);

  const handleClose = useCallback(() => {
    setSearchTerm("");
    setSelectedPlayer(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setError(null);
    if (!targetId) {
      setError("Selecione uma rodada antes de continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPlayer) {
        if (context === "round") {
          await playerRepository.addToRound(selectedPlayer.id, targetId);
        } else {
          await playerRepository.addToTeam(selectedPlayer.id, targetId);
        }
        // Reset selected player and trigger refetch
        setSelectedPlayer(null);
        setSearchTerm("");
        onExistingPlayerAdded?.();
        // Don't close modal - let user see the updated list
        // The useEffect will refetch players automatically
        setIsSubmitting(false);
        return;
      } else {
        const normalizedName = searchTerm.trim();
        if (!normalizedName) {
          setError("Informe um nome válido para o jogador.");
          setIsSubmitting(false);
          return;
        }

        if (!championshipId) {
          setError(
            "Não foi possível identificar a pelada para criar o jogador.",
          );
          setIsSubmitting(false);
          return;
        }

        const payload: CreatePlayerPayload = {
          name: normalizedName,
          championship_id: championshipId,
        };
        if (context === "round") {
          payload.player_rounds_attributes = [{ round_id: targetId }];
        } else {
          payload.team_id = targetId;
        }
        await onCreate(payload);
        handleClose();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    championshipId,
    context,
    handleClose,
    isSubmitting,
    onCreate,
    onExistingPlayerAdded,
    searchTerm,
    selectedPlayer,
    targetId,
  ]);

  const modalTitle = selectedPlayer
    ? `Adicionar Jogador ao ${context === "team" ? "Time" : "Round"}`
    : `Criar Jogador para ${context === "team" ? "Time" : "Round"}`;

  const submitLabel = selectedPlayer
    ? `Adicionar ao ${context === "team" ? "Time" : "Round"}`
    : "Criar Jogador";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form
          id="create-player-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <RoundFilterSection
            context={context}
            rounds={rounds}
            showRoundFilter={showRoundFilter}
            selectedRoundId={selectedRoundId ?? null}
            onToggleFilter={() => setShowRoundFilter((value) => !value)}
            onRoundChange={onRoundChange}
            existingPlayers={existingPlayers}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <PlayerSearchInput
              searchTerm={searchTerm}
              selectedPlayer={selectedPlayer}
              context={context}
              filteredPlayers={filteredPlayers}
              onSearchChange={(value) => {
                setSearchTerm(value);
                // Only clear selectedPlayer if user is typing (not when selecting from list)
                if (selectedPlayer && value !== selectedPlayer.name) {
                  setSelectedPlayer(null);
                }
              }}
              onSelectPlayer={(player) => {
                setSelectedPlayer(player);
                setSearchTerm(player.name);
              }}
              onSubmit={() => void handleSubmit()}
              isLoading={isLoading}
            />
            {error && <Alert variant="error">{error}</Alert>}
          </div>
        </form>
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="create-player-form"
            loading={isSubmitting || isLoading}
            disabled={isSubmitting || isLoading || (!selectedPlayer && !searchTerm.trim())}
            aria-label={submitLabel}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatePlayerModal;
