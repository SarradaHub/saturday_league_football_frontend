import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Alert, Card, CardContent, Input } from "@platform/design-system";
import { FaSearch } from "react-icons/fa";
import { Match, Player } from "@/types";
import matchRepository from "@/features/matches/api/matchRepository";
import playerRepository from "@/features/players/api/playerRepository";

function filterPlayersBySearch(players: Player[], search: string): Player[] {
  if (!search.trim()) return players;
  const q = search.trim().toLowerCase();
  return players.filter((p) => p.display_name.toLowerCase().includes(q));
}

interface SubstitutePlayerInMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubstitute: () => void;
  match: Match | null;
}

const SubstitutePlayerInMatchModal = ({
  isOpen,
  onClose,
  onSubstitute,
  match,
}: SubstitutePlayerInMatchModalProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundPlayers, setRoundPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [substitutionResult, setSubstitutionResult] = useState<{
    removed_player_name: string;
    replacement_player_name: string;
  } | null>(null);
  const [playerToReplaceSearch, setPlayerToReplaceSearch] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");

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
      setSelectedReplacementId(null);
      setPlayerToReplaceSearch("");
      setReplacementSearch("");
      setError(null);
      setRoundPlayers([]);
      setSubstitutionResult(null);
    }
  }, [isOpen, match?.round_id]);

  const teamPlayers = useMemo(() => {
    if (!selectedTeamId || !match) return [];
    const isTeam1 = selectedTeamId === match.team_1?.id;
    return isTeam1
      ? (match.team_1_players ?? match.team_1?.players ?? [])
      : (match.team_2_players ?? match.team_2?.players ?? []);
  }, [selectedTeamId, match]);

  const matchPlayerIds = useMemo(() => {
    if (!match) return new Set<number>();
    const ids = new Set<number>();
    const t1 = match.team_1_players ?? match.team_1?.players ?? [];
    const t2 = match.team_2_players ?? match.team_2?.players ?? [];
    t1.forEach((p) => ids.add(p.id));
    t2.forEach((p) => ids.add(p.id));
    return ids;
  }, [match]);

  const availableReplacementPlayers = useMemo(() => {
    if (!match) return [];
    return roundPlayers.filter((player) => !matchPlayerIds.has(player.id));
  }, [roundPlayers, match, matchPlayerIds]);

  const filteredTeamPlayers = useMemo(
    () => filterPlayersBySearch(teamPlayers, playerToReplaceSearch),
    [teamPlayers, playerToReplaceSearch],
  );
  const filteredReplacementPlayers = useMemo(
    () => filterPlayersBySearch(availableReplacementPlayers, replacementSearch),
    [availableReplacementPlayers, replacementSearch],
  );

  const handleSubmit = async () => {
    if (!match || !selectedTeamId || !selectedPlayerId || !selectedReplacementId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await matchRepository.substitutePlayer(
        match.id,
        selectedPlayerId,
        selectedReplacementId,
        selectedTeamId
      );
      setSubstitutionResult({
        removed_player_name: result.removed_player_name,
        replacement_player_name: result.replacement_player_name,
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
    setSelectedTeamId(null);
    setSelectedPlayerId(null);
    setSelectedReplacementId(null);
    setError(null);
    setSubstitutionResult(null);
    onClose();
  };

  if (!match) return null;

  const team1Id = match.team_1?.id;
  const team2Id = match.team_2?.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Substituir Jogador na Partida"
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {substitutionResult ? (
          <Alert variant="success">
            <p>
              <strong>{substitutionResult.removed_player_name}</strong> foi substituído por{" "}
              <strong>{substitutionResult.replacement_player_name}</strong>.
            </p>
          </Alert>
        ) : (
          <>
            <p style={{ fontSize: "0.875rem", color: "#737373", marginBottom: "1rem" }}>
              Selecione o time, o jogador a substituir e o jogador substituto da rodada.
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
                      setSelectedReplacementId(null);
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
                            setSelectedReplacementId(null);
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
                      setSelectedReplacementId(null);
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
                            setSelectedReplacementId(null);
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
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
                    Jogador a Substituir
                  </p>
                  {teamPlayers.length > 0 && (
                    <div style={{ marginBottom: "0.75rem", position: "relative" }}>
                      <Input
                        type="search"
                        value={playerToReplaceSearch}
                        onChange={(e) => setPlayerToReplaceSearch(e.target.value)}
                        placeholder="Buscar jogador..."
                        style={{ paddingLeft: "2.25rem" }}
                        aria-label="Buscar jogador a substituir"
                      />
                      <FaSearch
                        style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }}
                        aria-hidden
                      />
                    </div>
                  )}
                  {teamPlayers.length > 0 ? (
                    filteredTeamPlayers.length === 0 ? (
                      <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "1rem 0" }}>
                        {playerToReplaceSearch.trim() ? `Nenhum jogador encontrado para "${playerToReplaceSearch}"` : "Nenhum jogador no time"}
                      </p>
                    ) : (
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {filteredTeamPlayers.map((player) => (
                          <Card
                            key={player.id}
                            variant="outlined"
                            padding="sm"
                            style={{
                              cursor: "pointer",
                              backgroundColor: selectedPlayerId === player.id ? "#dbeafe" : "transparent",
                              borderColor: selectedPlayerId === player.id ? "#2563eb" : undefined,
                            }}
                            onClick={() => {
                              setSelectedPlayerId(player.id);
                              setSelectedReplacementId(null);
                            }}
                          >
                            <CardContent>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <input
                                  type="radio"
                                  checked={selectedPlayerId === player.id}
                                  onChange={() => {
                                    setSelectedPlayerId(player.id);
                                    setSelectedReplacementId(null);
                                  }}
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
                      Nenhum jogador no time selecionado
                    </p>
                  )}
                </div>

                {selectedPlayerId && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
                      Jogador Substituto
                    </p>
                    {availableReplacementPlayers.length > 0 && (
                      <div style={{ marginBottom: "0.75rem", position: "relative" }}>
                        <Input
                          type="search"
                          value={replacementSearch}
                          onChange={(e) => setReplacementSearch(e.target.value)}
                          placeholder="Buscar jogador substituto..."
                          style={{ paddingLeft: "2.25rem" }}
                          aria-label="Buscar jogador substituto"
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
                    ) : availableReplacementPlayers.length > 0 ? (
                      filteredReplacementPlayers.length === 0 ? (
                        <p style={{ fontSize: "0.875rem", color: "#737373", textAlign: "center", padding: "1rem 0" }}>
                          {replacementSearch.trim() ? `Nenhum jogador encontrado para "${replacementSearch}"` : "Nenhum jogador disponível para substituição"}
                        </p>
                      ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {filteredReplacementPlayers.map((player) => (
                            <Card
                              key={player.id}
                              variant="outlined"
                              padding="sm"
                              style={{
                                cursor: "pointer",
                                backgroundColor: selectedReplacementId === player.id ? "#dbeafe" : "transparent",
                                borderColor: selectedReplacementId === player.id ? "#2563eb" : undefined,
                              }}
                              onClick={() => setSelectedReplacementId(player.id)}
                            >
                              <CardContent>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <input
                                    type="radio"
                                    checked={selectedReplacementId === player.id}
                                    onChange={() => setSelectedReplacementId(player.id)}
                                    style={{ cursor: "pointer" }}
                                  />
                                  <span style={{ fontWeight: selectedReplacementId === player.id ? 600 : 400 }}>
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
                        Nenhum jogador disponível para substituição
                      </p>
                    )}
                  </div>
                )}
              </>
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
                disabled={!selectedTeamId || !selectedPlayerId || !selectedReplacementId || isSubmitting}
                aria-label="Confirmar Substituição"
              >
                Confirmar Substituição
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SubstitutePlayerInMatchModal;
