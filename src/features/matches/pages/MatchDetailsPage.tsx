import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FaArrowLeft, FaFutbol, FaEdit, FaTrash, FaChartLine, FaTrophy, FaUserPlus, FaExchangeAlt } from "react-icons/fa";
import matchRepository from "@/features/matches/api/matchRepository";
import roundRepository from "@/features/rounds/api/roundRepository";
import playerStatsRepository from "@/features/player-stats/api/playerStatsRepository";
import EditMatchModal from "@/features/matches/components/EditMatchModal";
import EditMatchStatsModal from "@/features/matches/components/EditMatchStatsModal";
import DeleteMatchModal from "@/features/matches/components/DeleteMatchModal";
import AddGoalkeeperModal from "@/features/matches/components/AddGoalkeeperModal";
import SubstitutePlayerInMatchModal from "@/features/matches/components/SubstitutePlayerInMatchModal";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Alert } from "@platform/design-system";
import { colors } from "@platform/design-system/tokens";
import { Match, Player } from "@/types";

const queryKeys = {
  match: (id: number) => ["match", id] as const,
  round: (id: number) => ["round", id] as const,
};

interface TeamBreakdown {
  name: string;
  players: Player[];
  goals: number;
  assists: Player[];
  goalsScorer: Player[];
  ownGoals: Player[];
  goalkeepers: Player[];
}

const buildTeamBreakdown = (
  match: Match,
  teamSide: "team_1" | "team_2",
): TeamBreakdown => {
  const opponentSide = teamSide === "team_1" ? "team_2" : "team_1";
  return {
    name: match[teamSide].name,
    players: match[`${teamSide}_players`] ?? [],
    goals: match[`${teamSide}_goals`] ?? 0,
    assists: (match[`${teamSide}_assists`] as Player[]) ?? [],
    goalsScorer: (match[`${teamSide}_goals_scorer`] as Player[]) ?? [],
    ownGoals: (match[`${opponentSide}_own_goals_scorer`] as Player[]) ?? [],
    goalkeepers: (match[`${teamSide}_goalkeepers`] as Player[]) ?? [],
  };
};

const MatchDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const matchId = Number(params.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditStatsModalOpen, setIsEditStatsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddGoalkeeperModalOpen, setIsAddGoalkeeperModalOpen] = useState(false);
  const [isSubstitutePlayerModalOpen, setIsSubstitutePlayerModalOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const {
    data: match,
    isLoading,
    error,
    refetch: refetchMatch,
  } = useQuery({
    queryKey: queryKeys.match(matchId),
    queryFn: () => matchRepository.findById(matchId),
    enabled: Number.isFinite(matchId),
  });

  const {
    data: round,
    isLoading: isLoadingRound,
  } = useQuery({
    queryKey: queryKeys.round(match?.round_id ?? 0),
    queryFn: () => roundRepository.findById(match!.round_id),
    enabled: !!match?.round_id,
  });

  const team1 = useMemo(
    () => (match ? buildTeamBreakdown(match, "team_1") : null),
    [match],
  );
  const team2 = useMemo(
    () => (match ? buildTeamBreakdown(match, "team_2") : null),
    [match],
  );

  const availableTeams = useMemo(() => {
    if (!round?.teams) return [];
    return round.teams.map((team) => ({ id: team.id, name: team.name }));
  }, [round?.teams]);

  const updateMatchMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        team_1_id: number;
        team_2_id: number;
        team_1_goals?: number;
        team_2_goals?: number;
      };
    }) => {
      const team1Goals = data.team_1_goals ?? 0;
      const team2Goals = data.team_2_goals ?? 0;
      const isDraw = team1Goals === team2Goals;
      const winningTeamId =
        !isDraw && team1Goals > team2Goals
          ? data.team_1_id
          : !isDraw && team2Goals > team1Goals
            ? data.team_2_id
            : null;

      return matchRepository.updateMatch(id, {
        name: data.name,
        team_1: { id: data.team_1_id } as Match["team_1"],
        team_2: { id: data.team_2_id } as Match["team_2"],
        winning_team: winningTeamId
          ? { id: winningTeamId } as Match["winning_team"]
          : null,
        draw: isDraw,
      });
    },
    onSuccess: () => {
      setToast({ open: true, message: "Partida atualizada com sucesso!" });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
      if (match?.round_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.round(match.round_id),
        });
      }
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar partida.",
      }),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (id: number) => matchRepository.deleteMatch(id),
    onSuccess: () => {
      setToast({ open: true, message: "Partida excluída com sucesso!" });
      setIsDeleteModalOpen(false);
      if (match?.round_id) {
        navigate(`/rounds/${match.round_id}`);
      } else {
        navigate(-1);
      }
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao excluir partida. Verifique se a partida possui estatísticas de jogadores associadas.",
      }),
  });

  const updateStatsMutation = useMutation({
    mutationFn: (playerStats: Array<{
      player_id: number;
      team_id: number;
      goals: number;
      assists: number;
      own_goals: number;
      was_goalkeeper: boolean;
    }>) => playerStatsRepository.bulkUpdate(matchId, playerStats.map(stat => ({
      ...stat,
      match_id: matchId,
    }))),
    onSuccess: async () => {
      setToast({ open: true, message: "Estatísticas atualizadas com sucesso!" });
      setIsEditStatsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
      const updatedMatch = await refetchMatch();
      if (updatedMatch.data?.round_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.round(updatedMatch.data.round_id),
        });
      }
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar estatísticas.",
      }),
  });

  const finalizeMatchMutation = useMutation({
    mutationFn: () => matchRepository.finalizeMatch(matchId),
    onSuccess: async () => {
      setToast({ open: true, message: "Partida finalizada com sucesso!" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
      await refetchMatch();
      if (match?.round_id) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.round(match.round_id),
        });
      }
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao finalizar partida.",
      }),
  });

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(matchId)) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">Identificador de partida inválido.</Alert>
      </div>
    );
  }

  if (isLoading || isLoadingRound) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (error || !match || !team1 || !team2) {
    const message =
      error instanceof Error
        ? error.message
        : match
          ? "Ocorreu um erro inesperado."
          : "Partida não encontrada.";
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
                  <CardTitle style={{ fontSize: "1.875rem" }}>{match.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: "#737373" }}>
                    {format(new Date(match.created_at), "dd MMMM yyyy")}
                  </p>
                </CardContent>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#1e40af" }}>
                  <FaFutbol aria-hidden />
                  Rodada #{match.round_id}
                </span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditStatsModalOpen(true)}
                    disabled={!team1?.players?.length || !team2?.players?.length}
                    leftIcon={FaChartLine}
                    aria-label="Editar estatísticas"
                    title={!team1?.players?.length || !team2?.players?.length ? "Adicione jogadores aos times para editar estatísticas" : "Editar estatísticas da partida"}
                  >
                    Estatísticas
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddGoalkeeperModalOpen(true)}
                    leftIcon={FaUserPlus}
                    aria-label="Adicionar goleiro"
                    title="Adicionar jogador da rodada como goleiro ao time"
                  >
                    Adicionar Goleiro
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSubstitutePlayerModalOpen(true)}
                    leftIcon={FaExchangeAlt}
                    aria-label="Substituir jogador"
                    title="Substituir jogador na partida"
                  >
                    Substituir Jogador
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => finalizeMatchMutation.mutate()}
                    disabled={(!team1?.players?.length || !team2?.players?.length) || finalizeMatchMutation.isPending || (match?.winning_team !== null || match?.draw === true)}
                    loading={finalizeMatchMutation.isPending}
                    leftIcon={FaTrophy}
                    aria-label="Finalizar partida"
                    title={match?.winning_team !== null || match?.draw === true ? "Partida já finalizada" : !team1?.players?.length || !team2?.players?.length ? "Adicione jogadores aos times antes de finalizar" : "Finalizar partida e definir vencedor"}
                  >
                    {finalizeMatchMutation.isPending ? "Finalizando..." : "Finalizar"}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    leftIcon={FaEdit}
                    aria-label="Editar partida"
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={FaTrash}
                    aria-label="Excluir partida"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
              <TeamColumn team={team1} align="right" />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <span style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "#737373" }}>Placar</span>
                <div style={{ marginTop: "0.5rem", fontSize: "3rem", fontWeight: 700, color: "#171717" }}>
                  {team1.goals}{" "}
                  <span style={{ margin: "0 0.25rem", fontSize: "1.875rem", color: "#a3a3a3" }}>x</span>{" "}
                  {team2.goals}
                </div>
                {match.winning_team ? (
                  <span style={{ marginTop: "0.5rem", borderRadius: "9999px", backgroundColor: "#dcfce7", padding: "0.25rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#166534" }}>
                    Vitória: {match.winning_team.name}
                  </span>
                ) : (
                  <span style={{ marginTop: "0.5rem", borderRadius: "9999px", backgroundColor: "#fef3c7", padding: "0.25rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#92400e" }}>
                    Empate
                  </span>
                )}
              </div>
              <TeamColumn team={team2} align="left" />
            </div>
          </Card>
        </div>
      </Container>

      {isEditStatsModalOpen && (
        <EditMatchStatsModal
          isOpen={isEditStatsModalOpen}
          onClose={() => setIsEditStatsModalOpen(false)}
          onSave={async (playerStats) => {
            await updateStatsMutation.mutateAsync(playerStats);
          }}
          match={match}
        />
      )}

      {isEditModalOpen && availableTeams.length > 0 && (
        <EditMatchModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (id, data) => {
            await updateMatchMutation.mutateAsync({ id, data });
          }}
          match={match}
          teams={availableTeams}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteMatchModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await deleteMatchMutation.mutateAsync(matchId);
          }}
          match={match}
          isDeleting={deleteMatchMutation.isPending}
        />
      )}

      {isAddGoalkeeperModalOpen && (
        <AddGoalkeeperModal
          isOpen={isAddGoalkeeperModalOpen}
          onClose={() => setIsAddGoalkeeperModalOpen(false)}
          onAdd={async () => {
            setToast({ open: true, message: "Jogador adicionado ao time com sucesso!" });
            queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
            if (match?.round_id) {
              queryClient.invalidateQueries({
                queryKey: queryKeys.round(match.round_id),
              });
            }
            await refetchMatch();
          }}
          match={match}
        />
      )}

      {isSubstitutePlayerModalOpen && (
        <SubstitutePlayerInMatchModal
          isOpen={isSubstitutePlayerModalOpen}
          onClose={() => setIsSubstitutePlayerModalOpen(false)}
          onSubstitute={async () => {
            setToast({ open: true, message: "Substituição realizada com sucesso!" });
            queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
            if (match?.round_id) {
              queryClient.invalidateQueries({
                queryKey: queryKeys.round(match.round_id),
              });
            }
            await refetchMatch();
          }}
          match={match}
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

interface TeamColumnProps {
  team: TeamBreakdown;
  align: "left" | "right";
}

const TeamColumn = ({ team, align }: TeamColumnProps) => {
  const textAlignStyle: React.CSSProperties = { textAlign: align === "left" ? "left" : "right" };
  const alignItemsStyle: React.CSSProperties = { alignItems: align === "left" ? "flex-start" : "flex-end" };

  const renderList = (
    title: string,
    players: Player[],
    emptyMessage: string,
  ) => (
    <div>
      <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#737373", ...textAlignStyle }}>
        {title}
      </h4>
      {players.length > 0 ? (
        <ul style={{ marginTop: "0.5rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem", ...textAlignStyle }}>
          {players.map((player, index) => (
            <motion.li
              key={`${title}-${player.id}-${index}`}
              initial={{ opacity: 0, x: align === "left" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ fontSize: "0.875rem", color: "#404040" }}
            >
              {player.display_name}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#a3a3a3", ...textAlignStyle }}>
          {emptyMessage}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", ...textAlignStyle }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", ...alignItemsStyle }}>
        <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#171717" }}>{team.name}</span>
        <span style={{ fontSize: "1.875rem", fontWeight: 700, color: "#171717" }}>{team.goals}</span>
      </div>
      {renderList("Gols", team.goalsScorer, "Nenhum gol registrado.")}
      {renderList(
        "Assistências",
        team.assists,
        "Nenhuma assistência registrada.",
      )}
      {renderList(
        "Gols Contra",
        team.ownGoals,
        "Nenhum gol contra registrado.",
      )}
      {renderList(
        "Goleiros",
        team.goalkeepers,
        "Nenhum goleiro registrado.",
      )}
      <div>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#737373", ...textAlignStyle }}>
          Escalação
        </h4>
        <ul style={{ marginTop: "0.5rem", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem", ...textAlignStyle }}>
          {team.players.map((player) => (
            <li key={player.id} style={{ fontSize: "0.875rem", color: "#737373" }}>
              {player.display_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MatchDetailsPage;
