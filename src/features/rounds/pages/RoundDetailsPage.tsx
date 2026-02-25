import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { format, parse } from "date-fns";
import {
  FaArrowLeft,
  FaEdit,
  FaFutbol,
  FaLock,
  FaLockOpen,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import championshipRepository from "@/features/championships/api/championshipRepository";
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
import SubstitutePlayerModal from "@/features/rounds/components/SubstitutePlayerModal";
import EditRoundModal from "@/features/rounds/components/EditRoundModal";
import DeleteRoundModal from "@/features/rounds/components/DeleteRoundModal";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Alert, Input } from "@sarradahub/design-system";
import { colors } from "@sarradahub/design-system/tokens";
import { Match, Player, Team } from "@/types";

const queryKeys = {
  round: (id: number) => ["round", id] as const,
};

const ROUND_CACHE_STALE_MS = 2 * 60 * 1000;
const CHAMPIONSHIP_CACHE_STALE_MS = 5 * 60 * 1000;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

function getMatchIdFromCreateNextMatchResult(
  result: Match | { match: Match; queue: Team[] } | undefined,
): number | undefined {
  if (!result || typeof result !== "object") return undefined;
  if ("match" in result && result.match?.id != null) return result.match.id;
  if ("id" in result && typeof (result as Match).id === "number") return (result as Match).id;
  return undefined;
}

const RoundDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const roundId = Number(params.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [isPlayerModalGoalkeeperMode, setPlayerModalGoalkeeperMode] = useState(false);
  const [isTeamModalOpen, setTeamModalOpen] = useState(false);
  const [isSubstituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [isEditRoundModalOpen, setEditRoundModalOpen] = useState(false);
  const [isDeleteRoundModalOpen, setDeleteRoundModalOpen] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isNextMatchLoading, setNextMatchLoading] = useState(false);
  const [isWinnerModalOpen, setWinnerModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [winnerCandidates, setWinnerCandidates] = useState<Team[]>([]);
  const [nextOpponent, setNextOpponent] = useState<Team | undefined>(undefined);
  const [winnerSelectionReason, setWinnerSelectionReason] = useState<string | undefined>(undefined);
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
    staleTime: ROUND_CACHE_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const championshipId = round?.championship_id ?? null;
  const { data: championship } = useQuery({
    queryKey: ["championship", championshipId],
    queryFn: () => championshipRepository.findById(championshipId!),
    enabled: !!championshipId && Number.isFinite(championshipId),
    staleTime: CHAMPIONSHIP_CACHE_STALE_MS,
  });
  const {
    data: allRounds,
  } = useQuery({
    queryKey: ["rounds", "championship", championshipId],
    queryFn: async () => {
      if (!championshipId) return [];
      const rounds = await roundRepository.list({ per_page: 100 });
      return Array.isArray(rounds) ? rounds.filter((r) => r.championship_id === championshipId) : [];
    },
    enabled: !!championshipId && Number.isFinite(championshipId) && isPlayerModalOpen,
    staleTime: CHAMPIONSHIP_CACHE_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const invalidateRound = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.round(roundId) });

  useEffect(() => {
    if (!round) return;
    const title = championship?.name
      ? `${round.name} | ${championship.name}`
      : `${round.name} | Pelada`;
    document.title = title;
    return () => {
      document.title = "Saturday League";
    };
  }, [round?.name, championship?.name]);

  const handleExistingPlayerAdded = () => {
    setToast({ open: true, message: "Jogador adicionado com sucesso!" });
    invalidateRound();
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

  const removePlayerMutation = useMutation({
    mutationFn: ({ playerId }: { playerId: number }) =>
      roundRepository.removePlayer(roundId, playerId),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador removido da rodada." });
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao remover jogador da rodada.",
      }),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: ({ playerId }: { playerId: number }) =>
      roundRepository.togglePlayerBlock(roundId, playerId),
    onSuccess: (_, variables) => {
      const wasBlocked = (round?.players ?? []).find((p) => p.id === variables.playerId)?.blocked;
      setToast({
        open: true,
        message: wasBlocked ? "Jogador desbloqueado." : "Jogador bloqueado na rodada.",
      });
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao bloquear/desbloquear jogador.",
      }),
  });

  const handleGenerateNextMatch = async () => {
    if (!Number.isFinite(roundId)) {
      return;
    }

    setNextMatchLoading(true);
    try {
      const suggestion = await roundRepository.suggestNextMatch(roundId);

      setTeamQueue((suggestion.queue ?? []).filter((t) => !t.is_blocked));

      if (suggestion.needs_winner_selection) {
        setWinnerCandidates(suggestion.candidates ?? []);
        setNextOpponent(suggestion.next_opponent);
        setWinnerSelectionReason(suggestion.reason);
        setWinnerModalOpen(true);
        return;
      }

      if (suggestion.suggested_match) {
        setSuggestedMatch(suggestion.suggested_match);
        setPreviewModalOpen(true);
      } else {
        const result = await roundRepository.createNextMatch(roundId);
        setToast({ open: true, message: "Próxima partida criada com sucesso!" });
        invalidateRound();
        const matchId = getMatchIdFromCreateNextMatchResult(result);
        if (matchId != null) navigate(`/matches/${matchId}`);
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
      if (result && typeof result === "object" && "queue" in result) {
        setTeamQueue(((result as { queue: Team[] }).queue ?? []).filter((t) => !t.is_blocked));
      }
      setToast({ open: true, message: "Próxima partida criada com sucesso!" });
      setWinnerModalOpen(false);
      setWinnerCandidates([]);
      setNextOpponent(undefined);
      setWinnerSelectionReason(undefined);
      invalidateRound();
      const matchId = getMatchIdFromCreateNextMatchResult(result);
      if (matchId != null) navigate(`/matches/${matchId}`);
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
      if (result && typeof result === "object" && "queue" in result) {
        setTeamQueue(((result as { queue: Team[] }).queue ?? []).filter((t) => !t.is_blocked));
      }
      setToast({ open: true, message: "Próxima partida criada com sucesso!" });
      setPreviewModalOpen(false);
      setSuggestedMatch(null);
      invalidateRound();
      const matchId = getMatchIdFromCreateNextMatchResult(result);
      if (matchId != null) navigate(`/matches/${matchId}`);
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

  const toggleTeamBlockMutation = useMutation({
    mutationFn: ({ teamId }: { teamId: number }) =>
      teamRepository.toggleTeamBlock(teamId),
    onSuccess: (_, variables) => {
      const wasBlocked = (round?.teams ?? []).find((t) => t.id === variables.teamId)
        ?.is_blocked;
      setToast({
        open: true,
        message: wasBlocked ? "Time desbloqueado." : "Time bloqueado.",
      });
      invalidateRound();
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao bloquear/desbloquear time.",
      }),
  });

  const players = useMemo(() => round?.players ?? [], [round?.players]);
  const teams = useMemo(() => round?.teams ?? [], [round?.teams]);
  const matches = useMemo(() => round?.matches ?? [], [round?.matches]);
  const roundsForModal = useMemo(() => {
    if (allRounds && allRounds.length > 0) return allRounds;
    if (round) return [round];
    return [];
  }, [allRounds, round]);

  const filteredPlayers = useMemo(() => {
    const normalized = playerSearch.trim().toLowerCase();
    if (!normalized) return players;
    return players.filter((player) =>
      player.display_name.toLowerCase().includes(normalized),
    );
  }, [players, playerSearch]);

  const filteredTeams = useMemo(() => {
    const normalized = teamSearch.trim().toLowerCase();
    if (!normalized) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(normalized));
  }, [teams, teamSearch]);

  useEffect(() => {
    if (!round || !Number.isFinite(roundId)) return;

    const finalizedMatches = matches.filter(
      (match) =>
        match.draw === true ||
        match.draw === false ||
        match.winning_team !== null,
    );

    if (finalizedMatches.length > 0 && teams.length >= 2 && !isNextMatchLoading) {
      const updateQueue = async () => {
        try {
          const suggestion = await roundRepository.suggestNextMatch(roundId);
          const queue = (suggestion.queue ?? []).filter((t) => !t.is_blocked);
          setTeamQueue(queue);
        } catch (error) {
          console.warn("Failed to update team queue:", error);
        }
      };
      updateQueue();
    } else if (finalizedMatches.length === 0) {
      setTeamQueue([]);
    }
  }, [round, matches, teams.length, roundId, isNextMatchLoading]);

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
                <nav aria-label="Breadcrumb" style={{ fontSize: "0.875rem", color: "#737373" }}>
                  <Link
                    to={championshipId ? `/championships/${championshipId}` : "#"}
                    style={{ color: "#2563eb", textDecoration: "none" }}
                  >
                    {championship?.name ?? "Pelada"}
                  </Link>
                  <span style={{ margin: "0 0.5rem" }} aria-hidden>›</span>
                  <span style={{ color: "#404040", fontWeight: 500 }}>{round.name}</span>
                </nav>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <CardTitle style={{ fontSize: "1.875rem" }}>{round.name}</CardTitle>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditRoundModalOpen(true)}
                        leftIcon={FaEdit}
                        aria-label="Editar rodada"
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteRoundModalOpen(true)}
                        leftIcon={FaTrash}
                        aria-label="Excluir rodada"
                        disabled={matches.length > 0}
                        title={matches.length > 0 ? "Exclua as partidas antes de excluir a rodada." : undefined}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p style={{ color: "#737373" }}>
                    {format(parse(round.round_date, "yyyy-MM-dd", new Date()), "dd MMMM yyyy")}
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
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={async () => {
                    setIsRebalancing(true);
                    try {
                      const result = await roundRepository.rebalanceTeams(roundId);
                      invalidateRound();
                      setToast({
                        open: true,
                        message: `Times rebalanceados! ${result.teams_after} times com ${result.players_after} jogadores.`,
                      });
                    } catch (error) {
                      setToast({
                        open: true,
                        message: error instanceof Error ? error.message : "Erro ao rebalancear times.",
                      });
                    } finally {
                      setIsRebalancing(false);
                    }
                  }}
                  loading={isRebalancing}
                  disabled={isRebalancing || players.length === 0}
                >
                  Rebalancear Times
                </Button>
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
                            style={{
                              cursor: "pointer",
                              opacity: team.is_blocked ? 0.7 : 1,
                              borderColor: team.is_blocked ? "#f97316" : undefined,
                            }}
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
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                                    <h3 style={{ fontWeight: 600, color: "#171717" }}>
                                      {team.name}
                                    </h3>
                                    {team.is_blocked && (
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          fontWeight: 500,
                                          color: "#9a3412",
                                          backgroundColor: "#ffedd5",
                                          padding: "0.125rem 0.5rem",
                                          borderRadius: "9999px",
                                        }}
                                      >
                                        Bloqueado
                                      </span>
                                    )}
                                  </div>
                                  {team.players && team.players.length > 0 ? (
                                    <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                                      {team.players
                                        .map((player, idx) => `${player.inscription_order ?? idx + 1}. ${player.display_name}`)
                                        .join(", ")}
                                    </p>
                                  ) : (
                                    <p style={{ fontSize: "0.875rem", color: "#a3a3a3", fontStyle: "italic" }}>
                                      Nenhum jogador
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  aria-label={team.is_blocked ? "Desbloquear time" : "Bloquear time"}
                                  leftIcon={team.is_blocked ? FaLockOpen : FaLock}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTeamBlockMutation.mutate({ teamId: team.id });
                                  }}
                                  disabled={toggleTeamBlockMutation.isPending}
                                >
                                  {team.is_blocked ? "Desbloquear time" : "Bloquear time"}
                                </Button>
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
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setPlayerModalGoalkeeperMode(false);
                    setPlayerModalOpen(true);
                  }}
                  leftIcon={FaPlus}
                >
                  Adicionar Jogador
                </Button>
              </div>
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
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                              <span style={{ display: "flex", height: "3rem", width: "3rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", fontSize: "1.125rem", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                                {player.display_name.charAt(0).toUpperCase()}
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h3 style={{ fontWeight: 600, color: "#171717", wordBreak: "break-word" }}>
                                  {player.display_name}
                                </h3>
                                {player.goalkeeper_only && (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      marginTop: "0.25rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 500,
                                      color: "#1e40af",
                                      backgroundColor: "#dbeafe",
                                      padding: "0.125rem 0.5rem",
                                      borderRadius: "9999px",
                                    }}
                                    aria-label="Goleiro"
                                  >
                                    Goleiro
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              {typeof player.player_round_id === "number" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  aria-label={player.blocked ? "Desbloquear jogador" : "Bloquear jogador"}
                                  leftIcon={player.blocked ? FaLockOpen : FaLock}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBlockMutation.mutate({ playerId: player.id });
                                  }}
                                  disabled={toggleBlockMutation.isPending}
                                >
                                  {player.blocked ? "Desbloquear" : "Bloquear"}
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label="Remover da rodada"
                                leftIcon={FaTrash}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePlayerMutation.mutate({ playerId: player.id });
                                }}
                                disabled={removePlayerMutation.isPending}
                              >
                                Remover
                              </Button>
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
          reason={winnerSelectionReason}
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
            setPlayerModalGoalkeeperMode(false);
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
          goalkeeperMode={isPlayerModalGoalkeeperMode}
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

      {isSubstituteModalOpen && (
        <SubstitutePlayerModal
          isOpen={isSubstituteModalOpen}
          onClose={() => setSubstituteModalOpen(false)}
          onSubstitute={() => {
            invalidateRound();
            setToast({ open: true, message: "Substituição realizada com sucesso!" });
          }}
          round={round}
          players={players}
        />
      )}

      {isEditRoundModalOpen && (
        <EditRoundModal
          isOpen={isEditRoundModalOpen}
          onClose={() => setEditRoundModalOpen(false)}
          onUpdate={async (id, data) => {
            await roundRepository.updateRound(id, data);
            invalidateRound();
            setToast({ open: true, message: "Rodada atualizada com sucesso!" });
            setEditRoundModalOpen(false);
          }}
          round={round}
        />
      )}

      {isDeleteRoundModalOpen && (
        <DeleteRoundModal
          isOpen={isDeleteRoundModalOpen}
          onClose={() => setDeleteRoundModalOpen(false)}
          onConfirm={async () => {
            await roundRepository.deleteRound(roundId);
            setToast({ open: true, message: "Rodada excluída com sucesso!" });
            navigate(`/championships/${round.championship_id}`);
          }}
          round={round}
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
