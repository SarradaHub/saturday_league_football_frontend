import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  FaArrowLeft,
  FaFutbol,
  FaPlus,
  FaSearch,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import roundRepository from "@/features/rounds/api/roundRepository";
import matchRepository from "@/features/matches/api/matchRepository";
import playerRepository from "@/features/players/api/playerRepository";
import teamRepository from "@/features/teams/api/teamRepository";
import CreateMatchModal from "@/features/matches/components/CreateMatchModal";
import CreatePlayerModal from "@/features/players/components/CreatePlayerModal";
import CreateTeamModal from "@/features/teams/components/CreateTeamModal";
import SelectMatchWinnerModal from "@/features/rounds/components/SelectMatchWinnerModal";
import SuggestedMatchPreviewModal from "@/features/rounds/components/SuggestedMatchPreviewModal";
import RoundStatisticsSection from "@/features/rounds/components/RoundStatisticsSection";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Alert, Input } from "@platform/design-system";
import { colors } from "@platform/design-system/tokens";
import { Match, Player, Team } from "@/types";

const queryKeys = {
  round: (id: number) => ["round", id] as const,
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const RoundDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const roundId = Number(params.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isNextMatchLoading, setNextMatchLoading] = useState(false);
  const [isWinnerModalOpen, setWinnerModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [winnerCandidates, setWinnerCandidates] = useState<Team[]>([]);
  const [nextOpponent, setNextOpponent] = useState<Team | undefined>(undefined);
  const [teamQueue, setTeamQueue] = useState<Team[]>([]);
  const [suggestedMatch, setSuggestedMatch] = useState<{
    name: string;
    team_1: Team;
    team_2: Team;
  } | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [selectedRoundIdForFilter, setSelectedRoundIdForFilter] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const {
    data: round,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.round(roundId),
    queryFn: () => roundRepository.findById(roundId),
    enabled: Number.isFinite(roundId),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  // Fetch all rounds from the championship for player filtering (only when modal is open)
  const championshipId = round?.championship_id ?? null;
  const {
    data: allRounds,
    isLoading: isLoadingRounds,
  } = useQuery({
    queryKey: ["rounds", "championship", championshipId],
    queryFn: async () => {
      if (!championshipId) return [];
      // Use a reasonable page size instead of 1000 to avoid timeout
      const rounds = await roundRepository.list({ per_page: 100 });
      // Filter rounds by championship_id on frontend since API doesn't support it directly
      return Array.isArray(rounds) ? rounds.filter((r) => r.championship_id === championshipId) : [];
    },
    enabled: !!championshipId && Number.isFinite(championshipId) && isPlayerModalOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent unnecessary refetches
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Only refetch if data is stale
  });

  const invalidateRound = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.round(roundId) });
  const handleExistingPlayerAdded = () => {
    setToast({ open: true, message: "Jogador adicionado com sucesso!" });
    invalidateRound();
    // Also invalidate players queries to refresh the modal's player list
    queryClient.invalidateQueries({ queryKey: ["players"] });
  };

  const matchMutation = useMutation({
    mutationFn: matchRepository.createMatch.bind(matchRepository),
    onSuccess: () => {
      setToast({ open: true, message: "Partida criada com sucesso!" });
      setMatchModalOpen(false);
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar partida.",
      }),
  });

  const handleGenerateNextMatch = async () => {
    if (!Number.isFinite(roundId)) {
      return;
    }

    setNextMatchLoading(true);
    try {
      const suggestion = await roundRepository.suggestNextMatch(roundId);

      // Store queue from suggestion
      setTeamQueue(suggestion.queue ?? []);

      if (suggestion.needs_winner_selection) {
        setWinnerCandidates(suggestion.candidates ?? []);
        setNextOpponent(suggestion.next_opponent);
        setWinnerModalOpen(true);
        return;
      }

      if (suggestion.suggested_match) {
        setSuggestedMatch(suggestion.suggested_match);
        setPreviewModalOpen(true);
      } else {
        await roundRepository.createNextMatch(roundId);
        setToast({ open: true, message: "Próxima partida criada com sucesso!" });
        invalidateRound();
      }
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : "Erro ao gerar próxima partida.",
      });
    } finally {
      setNextMatchLoading(false);
    }
  };

  const handleWinnerSelected = async (winnerTeamId: number) => {
    setNextMatchLoading(true);
    try {
      const result = await roundRepository.createNextMatch(roundId, winnerTeamId);
      // Update queue if returned in response
      if (result && typeof result === 'object' && 'queue' in result) {
        setTeamQueue((result as { queue: Team[] }).queue ?? []);
      }
      setToast({ open: true, message: "Próxima partida criada com sucesso!" });
      setWinnerModalOpen(false);
      setWinnerCandidates([]);
      setNextOpponent(undefined);
      invalidateRound();
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : "Erro ao criar próxima partida.",
      });
    } finally {
      setNextMatchLoading(false);
    }
  };

  const handleConfirmSuggestedMatch = async () => {
    setNextMatchLoading(true);
    try {
      const result = await roundRepository.createNextMatch(roundId);
      // Update queue if returned in response
      if (result && typeof result === 'object' && 'queue' in result) {
        setTeamQueue((result as { queue: Team[] }).queue ?? []);
      }
      setToast({ open: true, message: "Próxima partida criada com sucesso!" });
      setPreviewModalOpen(false);
      setSuggestedMatch(null);
      invalidateRound();
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : "Erro ao criar próxima partida.",
      });
    } finally {
      setNextMatchLoading(false);
    }
  };

  const playerMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof playerRepository.createPlayer>[0],
    ) => playerRepository.createPlayer(payload),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador criado com sucesso!" });
      setPlayerModalOpen(false);
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar jogador.",
      }),
  });

  const teamMutation = useMutation({
    mutationFn: (payload: Parameters<typeof teamRepository.createTeam>[0]) =>
      teamRepository.createTeam(payload),
    onSuccess: () => {
      setToast({ open: true, message: "Time criado com sucesso!" });
      setTeamModalOpen(false);
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao criar time.",
      }),
  });

  const players = useMemo(() => round?.players ?? [], [round?.players]);
  const teams = useMemo(() => round?.teams ?? [], [round?.teams]);
  const matches = useMemo(() => round?.matches ?? [], [round?.matches]);
  const roundsForModal = useMemo(() => {
    if (allRounds && allRounds.length > 0) return allRounds;
    if (round) return [round];
    return [];
  }, [allRounds, round?.id, round]); // Include round for the fallback case

  const filteredPlayers = useMemo(() => {
    const normalized = playerSearch.trim().toLowerCase();
    if (!normalized) return players;
    return players.filter((player) =>
      player.name.toLowerCase().includes(normalized),
    );
  }, [players, playerSearch]);

  const filteredTeams = useMemo(() => {
    const normalized = teamSearch.trim().toLowerCase();
    if (!normalized) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(normalized));
  }, [teams, teamSearch]);

  // Auto-update team queue when round is updated (e.g., after match is finalized)
  useEffect(() => {
    if (!round || !Number.isFinite(roundId) || isNextMatchLoading) return;

    // Check if there are any finalized matches (with winner or draw set)
    const finalizedMatches = matches.filter(
      (match) => match.draw === true || match.draw === false || match.winning_team !== null
    );

    // Only update queue if there are finalized matches and we have teams
    if (finalizedMatches.length > 0 && teams.length >= 2) {
      const updateQueue = async () => {
        try {
          const suggestion = await roundRepository.suggestNextMatch(roundId);
          setTeamQueue(suggestion.queue ?? []);
        } catch (error) {
          // Silently fail - queue update is not critical
          console.warn("Failed to update team queue:", error);
        }
      };

      updateQueue();
    } else if (finalizedMatches.length === 0) {
      // Clear queue if no matches are finalized
      setTeamQueue([]);
    }
  }, [
    round?.id,
    // Create a string representation of finalized matches to detect changes
    matches.map((m) => `${m.id}:${m.winning_team?.id ?? null}:${m.draw}`).join(","),
    teams.length,
    roundId,
    isNextMatchLoading,
  ]);

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(roundId)) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">Identificador de rodada inválido.</Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (error || !round) {
    const message =
      error instanceof Error
        ? error.message
        : round
          ? "Ocorreu um erro inesperado."
          : "Rodada não encontrada.";
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">{message}</Alert>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "6rem", minHeight: "100vh", backgroundColor: "#fafafa", padding: "2rem 0" }}>
      <Container>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem" }}>
          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  leftIcon={FaArrowLeft}
                >
                  Voltar
                </Button>
                <CardHeader>
                  <CardTitle style={{ fontSize: "1.875rem" }}>{round.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: "#737373" }}>
                    {format(new Date(round.round_date), "dd MMMM yyyy")}
                  </p>
                </CardContent>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#1e40af" }}>
                {matches.length} partidas
              </span>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaFutbol style={{ color: "#16a34a" }} aria-hidden />
                Partidas
              </CardTitle>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleGenerateNextMatch}
                  loading={isNextMatchLoading}
                  disabled={isNextMatchLoading}
                  title="Regra: empate na primeira partida com apenas 1 time completo de próximo requer escolha do vencedor."
                >
                  Gerar próxima partida
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setMatchModalOpen(true)}
                  leftIcon={FaPlus}
                >
                  Criar Partida
                </Button>
              </div>
            </div>
            <CardContent>
              {matches.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {matches.map((match: Match) => (
                    <motion.div
                      key={match.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Card
                        variant="outlined"
                        padding="md"
                        style={{ cursor: "pointer", width: "100%" }}
                        onClick={() => navigate(`/matches/${match.id}`)}
                      >
                        <CardContent>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem", color: "#737373", marginBottom: "0.75rem" }}>
                            <span>
                              {format(new Date(match.created_at), "dd/MM/yyyy")}
                            </span>
                            <span>{match.name}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", alignItems: "center", gap: "1rem", textAlign: "center" }}>
                            <p style={{ fontWeight: 500, textAlign: "right" }}>
                              {match.team_1.name}
                            </p>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#737373" }}>
                              {match.team_1_goals} x {match.team_2_goals}
                            </div>
                            <p style={{ fontWeight: 500, textAlign: "left" }}>
                              {match.team_2.name}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card variant="outlined" padding="lg" style={{ textAlign: "center", color: "#737373" }}>
                  <CardContent>
                    Nenhuma partida cadastrada.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaUsers style={{ color: "#a78bfa" }} aria-hidden />
                Times
              </CardTitle>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setTeamModalOpen(true)}
                leftIcon={FaPlus}
              >
                Criar Time
              </Button>
            </div>
            <div style={{ marginBottom: "1.5rem", position: "relative" }}>
              <Input
                type="search"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                placeholder="Buscar time..."
                style={{ paddingLeft: "2.5rem" }}
              />
              <FaSearch
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }}
                aria-hidden
              />
            </div>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <CardTitle style={{ fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <FaUsers style={{ color: "#7c3aed" }} aria-hidden />
                    Fila de Times (Próximos)
                  </CardTitle>
                  {teamQueue.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {teamQueue.map((team, index) => (
                        <div
                          key={team.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "0.75rem",
                            backgroundColor: index === 0 ? "#f3f4f6" : "#ffffff",
                            borderRadius: "0.5rem",
                            border: index === 0 ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "9999px",
                              backgroundColor: index === 0 ? "#7c3aed" : "#e5e7eb",
                              color: index === 0 ? "#ffffff" : "#6b7280",
                              fontWeight: 600,
                              fontSize: "0.875rem",
                            }}
                          >
                            {index + 1}
                          </span>
                          <span style={{ fontWeight: index === 0 ? 600 : 500, color: "#171717" }}>
                            {team.name}
                          </span>
                          {index === 0 && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: "0.75rem",
                                color: "#7c3aed",
                                fontWeight: 600,
                              }}
                            >
                              Próximo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card variant="outlined" padding="md" style={{ textAlign: "center", color: "#737373" }}>
                      <CardContent>
                        Nenhum time na fila.
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div>
                  <CardTitle style={{ fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <FaUsers style={{ color: "#a78bfa" }} aria-hidden />
                    Lista de Times
                  </CardTitle>
                  {filteredTeams.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                      {filteredTeams.map((team: Team) => (
                        <motion.div
                          key={team.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <Card
                            variant="outlined"
                            padding="md"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/teams/${team.id}`, {
                                state: { roundId },
                              })
                            }
                          >
                            <CardContent>
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ display: "flex", height: "3rem", width: "3rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#ede9fe", fontSize: "1.125rem", fontWeight: 700, color: "#7c3aed" }}>
                                  {team.name.charAt(0).toUpperCase()}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ fontWeight: 600, color: "#171717", marginBottom: "0.25rem" }}>
                                    {team.name}
                                  </h3>
                                  {team.players && team.players.length > 0 ? (
                                    <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                                      {team.players.map((player) => player.name).join(", ")}
                                    </p>
                                  ) : (
                                    <p style={{ fontSize: "0.875rem", color: "#a3a3a3", fontStyle: "italic" }}>
                                      Nenhum jogador
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card variant="outlined" padding="lg" style={{ textAlign: "center", color: "#737373" }}>
                      <CardContent>
                        Nenhum time encontrado.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <CardTitle style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaUser style={{ color: "#2563eb" }} aria-hidden />
                Jogadores
              </CardTitle>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setPlayerModalOpen(true)}
                leftIcon={FaPlus}
              >
                Adicionar Jogador
              </Button>
            </div>
            <div style={{ marginBottom: "1.5rem", position: "relative" }}>
              <Input
                type="search"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Buscar jogador..."
                style={{ paddingLeft: "2.5rem" }}
              />
              <FaSearch
                style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }}
                aria-hidden
              />
            </div>
            <CardContent>
              {filteredPlayers.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                  {filteredPlayers.map((player: Player) => (
                    <motion.div
                      key={player.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Card
                        variant="outlined"
                        padding="md"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <CardContent>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span style={{ display: "flex", height: "3rem", width: "3rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", fontSize: "1.125rem", fontWeight: 700, color: "#2563eb" }}>
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <h3 style={{ fontWeight: 600, color: "#171717" }}>
                                {player.name}
                              </h3>
                              <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                                Participou de {player.rounds?.length ?? 0} rodadas
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card variant="outlined" padding="lg" style={{ textAlign: "center", color: "#737373" }}>
                  <CardContent>
                    Nenhum jogador encontrado.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <CardHeader>
              <CardTitle style={{ fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FaFutbol style={{ color: "#2563eb" }} aria-hidden />
                Estatísticas da Rodada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RoundStatisticsSection roundId={roundId} />
            </CardContent>
          </Card>
        </div>
      </Container>

      {isMatchModalOpen && (
        <CreateMatchModal
          isOpen={isMatchModalOpen}
          onClose={() => setMatchModalOpen(false)}
          onCreate={async (payload) => {
            await matchMutation.mutateAsync(payload);
          }}
          teams={teams}
          roundId={roundId}
        />
      )}

      {isWinnerModalOpen && (
        <SelectMatchWinnerModal
          isOpen={isWinnerModalOpen}
          candidates={winnerCandidates}
          nextOpponent={nextOpponent}
          isSubmitting={isNextMatchLoading}
          onClose={() => setWinnerModalOpen(false)}
          onSelect={handleWinnerSelected}
        />
      )}

      {isPreviewModalOpen && (
        <SuggestedMatchPreviewModal
          isOpen={isPreviewModalOpen}
          suggestedMatch={suggestedMatch}
          isSubmitting={isNextMatchLoading}
          onClose={() => setPreviewModalOpen(false)}
          onConfirm={handleConfirmSuggestedMatch}
        />
      )}
      {isPlayerModalOpen && (
        <CreatePlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => {
            setPlayerModalOpen(false);
            setSelectedRoundIdForFilter(null);
          }}
          onCreate={async (payload) => {
            await playerMutation.mutateAsync(payload);
          }}
          championshipId={round.championship_id}
          currentPlayers={players}
          rounds={roundsForModal}
          selectedRoundId={selectedRoundIdForFilter ?? roundId}
          onRoundChange={(roundId) => setSelectedRoundIdForFilter(roundId > 0 ? roundId : null)}
          onExistingPlayerAdded={handleExistingPlayerAdded}
        />
      )}
      {isTeamModalOpen && (
        <CreateTeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setTeamModalOpen(false)}
          onCreate={async (payload) => {
            await teamMutation.mutateAsync(payload);
          }}
          roundId={roundId}
        />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        message={toast.message}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: toast.message?.includes("sucesso")
              ? colors.primary[600]
              : colors.error[700],
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

export default RoundDetailsPage;
