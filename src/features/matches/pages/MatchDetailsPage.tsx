import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FaArrowLeft, FaFutbol, FaEdit, FaTrash, FaChartLine, FaTrophy } from "react-icons/fa";
import matchRepository from "@/features/matches/api/matchRepository";
import roundRepository from "@/features/rounds/api/roundRepository";
import playerStatsRepository from "@/features/player-stats/api/playerStatsRepository";
import EditMatchModal from "@/features/matches/components/EditMatchModal";
import EditMatchStatsModal from "@/features/matches/components/EditMatchStatsModal";
import DeleteMatchModal from "@/features/matches/components/DeleteMatchModal";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { colors } from "@sarradahub/design-system/tokens";
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
      // Calculate winning_team_id and draw based on goals
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
        team_1_id: data.team_1_id,
        team_2_id: data.team_2_id,
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
    }>) => playerStatsRepository.bulkUpdate(matchId, playerStats),
    onSuccess: async () => {
      setToast({ open: true, message: "Estatísticas atualizadas com sucesso!" });
      setIsEditStatsModalOpen(false);
      // Invalidate and refetch match query to get updated statistics
      await queryClient.invalidateQueries({ queryKey: queryKeys.match(matchId) });
      const updatedMatch = await refetchMatch();
      // Also invalidate round if we have round_id
      if (updatedMatch.data?.round_id) {
        await queryClient.invalidateQueries({
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
      // Invalidate and refetch match query to get updated result
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
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-error-50 px-4 py-3 text-error-600">
          Identificador de partida inválido.
        </span>
      </div>
    );
  }

  if (isLoading || isLoadingRound) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
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
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-error-50 px-4 py-3 text-error-600">
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-24 min-h-screen bg-neutral-50 py-8 font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center gap-2 text-neutral-600 transition hover:text-neutral-800"
                >
                  <FaArrowLeft aria-hidden />
                  Voltar
                </button>
                <h1 className="text-3xl font-bold text-neutral-900">
                  {match.name}
                </h1>
                <p className="text-neutral-600">
                  {format(new Date(match.created_at), "dd MMMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-800">
                  <FaFutbol aria-hidden />
                  Rodada #{match.round_id}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditStatsModalOpen(true)}
                    disabled={
                      !team1?.players?.length || !team2?.players?.length
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-success-600"
                    aria-label="Editar estatísticas"
                    title={
                      !team1?.players?.length || !team2?.players?.length
                        ? "Adicione jogadores aos times para editar estatísticas"
                        : "Editar estatísticas da partida"
                    }
                  >
                    <FaChartLine aria-hidden />
                    Estatísticas
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeMatchMutation.mutate()}
                    disabled={
                      !team1?.goals && !team2?.goals || 
                      finalizeMatchMutation.isPending ||
                      match?.winning_team !== null && !match?.draw
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-warning-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-warning-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-warning-600"
                    aria-label="Finalizar partida"
                    title={
                      match?.winning_team !== null && !match?.draw
                        ? "Partida já finalizada"
                        : !team1?.goals && !team2?.goals
                          ? "Adicione estatísticas antes de finalizar"
                          : "Finalizar partida e definir vencedor"
                    }
                  >
                    <FaTrophy aria-hidden />
                    {finalizeMatchMutation.isPending ? "Finalizando..." : "Finalizar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                    aria-label="Editar partida"
                  >
                    <FaEdit aria-hidden />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-700"
                    aria-label="Excluir partida"
                  >
                    <FaTrash aria-hidden />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="grid gap-8 md:grid-cols-3">
              <TeamColumn team={team1} align="right" />
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-sm uppercase text-neutral-500">Placar</span>
                <div className="mt-2 text-5xl font-bold text-neutral-900">
                  {team1.goals}{" "}
                  <span className="mx-1 text-3xl text-neutral-400">x</span>{" "}
                  {team2.goals}
                </div>
                {match.winning_team ? (
                  <span className="mt-2 rounded-full bg-success-100 px-4 py-1 text-sm font-semibold text-success-700">
                    Vitória: {match.winning_team.name}
                  </span>
                ) : (
                  <span className="mt-2 rounded-full bg-warning-100 px-4 py-1 text-sm font-semibold text-warning-700">
                    Empate
                  </span>
                )}
              </div>
              <TeamColumn team={team2} align="left" />
            </div>
          </section>
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
  const textAlign = align === "left" ? "text-left" : "text-right";
  const flexDirection = align === "left" ? "items-start" : "items-end";

  const renderList = (
    title: string,
    players: Player[],
    emptyMessage: string,
  ) => (
    <div>
      <h4 className={`text-sm font-semibold text-neutral-500 ${textAlign}`}>
        {title}
      </h4>
      {players.length > 0 ? (
        <ul className={`mt-2 space-y-2 ${textAlign}`}>
          {players.map((player, index) => (
            <motion.li
              key={`${title}-${player.id}-${index}`}
              initial={{ opacity: 0, x: align === "left" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-neutral-700"
            >
              {player.name}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className={`mt-2 text-sm text-neutral-400 ${textAlign}`}>
          {emptyMessage}
        </p>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${textAlign}`}>
      <div className={`flex flex-col ${flexDirection} gap-2`}>
        <span className="text-xl font-semibold text-neutral-900">{team.name}</span>
        <span className="text-3xl font-bold text-neutral-800">{team.goals}</span>
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
      <div>
        <h4 className={`text-sm font-semibold text-neutral-500 ${textAlign}`}>
          Escalação
        </h4>
        <ul className={`mt-2 space-y-1 ${textAlign}`}>
          {team.players.map((player) => (
            <li key={player.id} className="text-sm text-neutral-600">
              {player.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MatchDetailsPage;
