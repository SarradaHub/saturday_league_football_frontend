import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Modal, Button, Alert, Checkbox } from "@platform/design-system";
import RoundFilterSection from "@/features/rounds/components/RoundFilterSection";
import PlayerSearchInput from "@/features/players/components/PlayerSearchInput";
import playerRepository from "@/features/players/api/playerRepository";
import { Player, Round } from "@/types";

interface CreatePlayerPayload {
  first_name?: string;
  last_name?: string;
  nickname?: string;
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
  goalkeeperMode?: boolean;
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
  goalkeeperMode = false,
}: CreatePlayerModalProps) => {
  const { id: routeIdParam } = useParams<{ id: string }>();
  const routeId = useMemo(
    () => (routeIdParam ? Number(routeIdParam) : undefined),
    [routeIdParam],
  );
  const targetId = context === "team" ? routeId : routeId;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoundFilter, setShowRoundFilter] = useState(false);
  const [goalkeeperOnly, setGoalkeeperOnly] = useState(false);

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
        let roundIdParam: number | undefined = undefined;
        if (context === "round") {
          if (showRoundFilter && selectedRoundId && selectedRoundId > 0) {
            roundIdParam = selectedRoundId;
          }
        } else if (context === "team" && targetId) {
          roundIdParam = targetId;
        }
        const params: { round_id?: number; per_page?: number } = {};
        if (roundIdParam != null) params.round_id = roundIdParam;
        if (context === "round" && !roundIdParam) params.per_page = 500;
        const players = await playerRepository.list(championshipId, params);
        
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
  }, [isOpen, championshipId, context, selectedRoundId, showRoundFilter, targetId]);

  const filteredPlayers = useMemo(() => {
    if (!isOpen) return [];

    const candidates =
      context === "team" && selectedRoundId && playersFromRound.length > 0
        ? playersFromRound
        : existingPlayers;

    return candidates.filter((player) =>
      player.display_name.toLowerCase().includes(searchTerm.toLowerCase()),
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
    setGoalkeeperOnly(false);
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
          await playerRepository.addToRound(selectedPlayer.id, targetId, goalkeeperOnly);
        } else {
          await playerRepository.addToTeam(selectedPlayer.id, targetId);
        }
        setSelectedPlayer(null);
        setSearchTerm("");
        onExistingPlayerAdded?.();
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

        const parts = normalizedName.split(/\s+/, 2);
        const payload: CreatePlayerPayload = {
          first_name: parts[0],
          last_name: parts[1],
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
    goalkeeperOnly,
  ]);

  const isRoundContext = context === "round";

  const modalTitle = goalkeeperMode && isRoundContext
    ? selectedPlayer
      ? "Adicionar Goleiro à Rodada"
      : "Criar Jogador Goleiro para a Rodada"
    : selectedPlayer
      ? `Adicionar Jogador ao ${context === "team" ? "Time" : "Round"}`
      : `Criar Jogador para ${context === "team" ? "Time" : "Round"}`;

  const submitLabel = goalkeeperMode && isRoundContext
    ? selectedPlayer
      ? "Adicionar como Goleiro"
      : "Criar Jogador Goleiro"
    : selectedPlayer
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
          {goalkeeperMode && isRoundContext && (
            <p style={{ fontSize: "0.875rem", color: "#737373", marginBottom: "0.5rem" }}>
              Selecione um jogador existente e marque a opção de apenas goleiro para que ele não entre no sorteio dos times desta rodada.
            </p>
          )}
          <RoundFilterSection
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
                if (selectedPlayer && value !== selectedPlayer.display_name) {
                  setSelectedPlayer(null);
                }
              }}
              onSelectPlayer={(player) => {
                setSelectedPlayer(player);
                setSearchTerm(player.display_name);
              }}
              onSubmit={() => void handleSubmit()}
              isLoading={isLoading}
            />
            {selectedPlayer && context === "round" && (
              <Checkbox
                id="goalkeeper-only"
                checked={goalkeeperOnly}
                onChange={(e) => setGoalkeeperOnly(e.target.checked)}
                label="Apenas goleiro (não entra no sorteio dos times)"
              />
            )}
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
