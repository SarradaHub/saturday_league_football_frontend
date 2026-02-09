import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Alert, Card, CardContent, Input } from "@platform/design-system";
import { FaSearch } from "react-icons/fa";
import { Match, Player } from "@/types";
import playerRepository from "@/features/players/api/playerRepository";
import playerStatsRepository from "@/features/player-stats/api/playerStatsRepository";

function filterPlayersBySearch(players: Player[], search: string): Player[] {
  if (!search.trim()) return players;
  const q = search.trim().toLowerCase();
  return players.filter((p) => p.display_name.toLowerCase().includes(q));
}

interface AddGoalkeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  match: Match | null;
}

const AddGoalkeeperModal = ({
  isOpen,
  onClose,
  onAdd,
  match,
}: AddGoalkeeperModalProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundPlayers, setRoundPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [goalkeeperSearch, setGoalkeeperSearch] = useState("");

  useEffect(() => {
    if (isOpen && match?.round_id) {
      setIsLoadingPlayers(true);
      setError(null);
      playerRepository
        .list(undefined, { round_id: match.round_id })
        .then((players) => {
          setRoundPlayers(Array.isArray(players) ? players : []);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Erro ao carregar jogadores");
          setRoundPlayers([]);
        })
        .finally(() => {
          setIsLoadingPlayers(false);
        });
    } else if (!isOpen) {
      setSelectedTeamId(null);
      setSelectedPlayerId(null);
      setGoalkeeperSearch("");
      setError(null);
      setRoundPlayers([]);
    }
  }, [isOpen, match?.round_id]);

  const matchPlayerIds = useMemo(() => {
    if (!match) return new Set<number>();
    const ids = new Set<number>();
    const t1 = match.team_1_players ?? match.team_1?.players ?? [];
    const t2 = match.team_2_players ?? match.team_2?.players ?? [];
    t1.forEach((p) => ids.add(p.id));
    t2.forEach((p) => ids.add(p.id));
    return ids;
  }, [match]);

  const availablePlayers = useMemo(() => {
    if (!selectedTeamId || !match) return [];
    return roundPlayers.filter((player) => !matchPlayerIds.has(player.id));
  }, [roundPlayers, selectedTeamId, match, matchPlayerIds]);

  const filteredAvailablePlayers = useMemo(
    () => filterPlayersBySearch(availablePlayers, goalkeeperSearch),
    [availablePlayers, goalkeeperSearch],
  );

  const handleSubmit = async () => {
    if (!match || !selectedTeamId || !selectedPlayerId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await playerStatsRepository.addGoalkeeper(
        match.id,
        selectedTeamId,
        selectedPlayerId,
      );
      onAdd();
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao adicionar jogador ao time"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTeamId(null);
    setSelectedPlayerId(null);
    setError(null);
    onClose();
  };

  if (!match) return null;

  const team1Id = match.team_1?.id;
  const team2Id = match.team_2?.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Goleiro"
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ fontSize: "0.875rem", color: "#737373", marginBottom: "1rem" }}>
          Selecione o time e o jogador da rodada para adicionar como goleiro. O jogador será adicionado ao time e você poderá marcá-lo como goleiro nas estatísticas depois.
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
            Time
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {team1Id && (
              <Card
                variant="outlined"
                padding="sm"
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedTeamId === team1Id ? "#dbeafe" : "transparent",
                  borderColor: selectedTeamId === team1Id ? "#2563eb" : undefined,
                  flex: 1,
                }}
                onClick={() => {
                  setSelectedTeamId(team1Id);
                  setSelectedPlayerId(null);
                }}
              >
                <CardContent>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      checked={selectedTeamId === team1Id}
                      onChange={() => {
                        setSelectedTeamId(team1Id);
                        setSelectedPlayerId(null);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: selectedTeamId === team1Id ? 600 : 400 }}>
                      {match.team_1?.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            {team2Id && (
              <Card
                variant="outlined"
                padding="sm"
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedTeamId === team2Id ? "#dbeafe" : "transparent",
                  borderColor: selectedTeamId === team2Id ? "#2563eb" : undefined,
                  flex: 1,
                }}
                onClick={() => {
                  setSelectedTeamId(team2Id);
                  setSelectedPlayerId(null);
                }}
              >
                <CardContent>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      checked={selectedTeamId === team2Id}
                      onChange={() => {
                        setSelectedTeamId(team2Id);
                        setSelectedPlayerId(null);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: selectedTeamId === team2Id ? 600 : 400 }}>
                      {match.team_2?.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {selectedTeamId && (
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
              Jogador da Rodada
            </p>
            {availablePlayers.length > 0 && (
              <div style={{ marginBottom: "0.75rem", position: "relative" }}>
                <Input
                  type="search"
                  value={goalkeeperSearch}
                  onChange={(e) => setGoalkeeperSearch(e.target.value)}
                  placeholder="Buscar goleiro..."
                  style={{ paddingLeft: "2.25rem" }}
                  aria-label="Buscar goleiro"
                />
                <FaSearch
                  style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }}
                  aria-hidden
                />
              </div>
            )}
            {isLoadingPlayers ? (
              <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "2rem 0" }}>
                Carregando jogadores...
              </p>
            ) : availablePlayers.length > 0 ? (
              filteredAvailablePlayers.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "2rem 0" }}>
                  {goalkeeperSearch.trim()
                    ? `Nenhum jogador encontrado para "${goalkeeperSearch}"`
                    : "Nenhum jogador disponível para adicionar a este time"}
                </p>
              ) : (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {filteredAvailablePlayers.map((player) => (
                      <Card
                        key={player.id}
                        variant="outlined"
                        padding="sm"
                        style={{
                          cursor: "pointer",
                          backgroundColor: selectedPlayerId === player.id ? "#dbeafe" : "transparent",
                          borderColor: selectedPlayerId === player.id ? "#2563eb" : undefined,
                        }}
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <CardContent>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <input
                              type="radio"
                              checked={selectedPlayerId === player.id}
                              onChange={() => setSelectedPlayerId(player.id)}
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
                </div>
              )
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "2rem 0" }}>
                Nenhum jogador disponível para adicionar a este time
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedTeamId || !selectedPlayerId || isSubmitting}
            aria-label="Adicionar Goleiro"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddGoalkeeperModal;
