import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import BaseModal from "@/shared/components/modal/BaseModal";
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
  const targetId = context === "team" ? routeId : (selectedRoundId ?? routeId);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoundFilter, setShowRoundFilter] = useState(false);

  const currentPlayersRef = useRef(currentPlayers);
  currentPlayersRef.current = currentPlayers;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (!championshipId) {
      setExistingPlayers([]);
      return;
    }

    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const players = await playerRepository.list(championshipId);
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
  }, [isOpen, championshipId]);

  const filteredPlayers = useMemo(() => {
    if (!isOpen) return [];
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
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!targetId) {
      setError("Selecione uma rodada antes de continuar.");
      return;
    }

    try {
      if (selectedPlayer) {
        if (context === "round") {
          await playerRepository.addToRound(selectedPlayer.id, targetId);
        } else {
          await playerRepository.addToTeam(selectedPlayer.id, targetId);
        }
        onExistingPlayerAdded?.();
      } else {
        const normalizedName = searchTerm.trim();
        if (!normalizedName) {
          setError("Informe um nome válido para o jogador.");
          return;
        }

        if (!championshipId) {
          setError(
            "Não foi possível identificar a pelada para criar o jogador.",
          );
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
      }
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível concluir a operação.",
      );
    }
  }, [
    championshipId,
    context,
    handleClose,
    onCreate,
    onExistingPlayerAdded,
    searchTerm,
    selectedPlayer,
    targetId,
  ]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        selectedPlayer
          ? `Adicionar Jogador ao ${context === "team" ? "Time" : "Round"}`
          : `Criar Jogador para ${context === "team" ? "Time" : "Round"}`
      }
      formId="create-player-form"
      isSubmitting={isLoading}
      submitDisabled={isLoading || (!selectedPlayer && !searchTerm.trim())}
      submitLabel={
        selectedPlayer
          ? `Adicionar ao ${context === "team" ? "Time" : "Round"}`
          : "Criar Jogador"
      }
    >
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
        <div className="space-y-6">
          <PlayerSearchInput
            searchTerm={searchTerm}
            selectedPlayer={selectedPlayer}
            context={context}
            filteredPlayers={filteredPlayers}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setSelectedPlayer(null);
            }}
            onSelectPlayer={setSelectedPlayer}
            onSubmit={() => void handleSubmit()}
            isLoading={isLoading}
          />
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </form>
    </BaseModal>
  );
};

export default CreatePlayerModal;
