import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { FaArrowLeft, FaFutbol, FaMedal, FaEdit, FaTrash } from "react-icons/fa";
import { GiGoalKeeper } from "react-icons/gi";
import { GoalIcon } from "lucide-react";
import playerRepository from "@/features/players/api/playerRepository";
import roundRepository from "@/features/rounds/api/roundRepository";
import EditPlayerModal from "@/features/players/components/EditPlayerModal";
import DeletePlayerModal from "@/features/players/components/DeletePlayerModal";
import StatCard from "@/shared/components/cards/StatCard";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { colors } from "@sarradahub/design-system/tokens";
import { Player, PlayerStat, Round } from "@/types";

interface PlayerDetails extends Player {
  rounds: Round[];
}

const queryKeys = {
  player: (id: number) => ["player", id] as const,
};

const statCardConfig = [
  {
    key: "totalGoals",
    title: "Total de Gols",
    icon: <FaFutbol className="text-success-500" aria-hidden />,
    accent: "border-success-500",
  },
  {
    key: "totalAssists",
    title: "Assistências",
    icon: <FaMedal className="text-primary-500" aria-hidden />,
    accent: "border-primary-500",
  },
  {
    key: "totalMatches",
    title: "Partidas",
    icon: <FaFutbol className="text-warning-500" aria-hidden />,
    accent: "border-warning-500",
  },
  {
    key: "goalkeeperMatches",
    title: "Como Goleiro",
    icon: <GiGoalKeeper className="text-secondary-500" aria-hidden />,
    accent: "border-secondary-500",
  },
  {
    key: "totalOwnGoals",
    title: "Gols Contra",
    icon: <GoalIcon className="text-error-500" aria-hidden />,
    accent: "border-error-500",
  },
] as const;

const PlayerDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playerId = Number(params.id);
  const [activeTab, setActiveTab] = useState<"stats" | "rounds" | "matches">(
    "stats",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.player(playerId),
    enabled: Number.isFinite(playerId),
    queryFn: async (): Promise<PlayerDetails> => {
      const player = await playerRepository.findById(playerId);
      const rounds = player.rounds ?? [];

      if (!rounds.length) {
        return { ...player, rounds: [] };
      }

      const detailedRounds = await Promise.all(
        rounds.map(async (round) => {
          try {
            return roundRepository.findById(round.id);
          } catch {
            return round;
          }
        }),
      );

      return { ...player, rounds: detailedRounds };
    },
  });

  const aggregatedStats = useMemo(() => {
    if (!data?.player_stats) {
      return {
        totalGoals: 0,
        totalAssists: 0,
        totalOwnGoals: 0,
        totalMatches: 0,
        goalkeeperMatches: 0,
      };
    }

    return data.player_stats.reduce(
      (accumulator, stat) => ({
        totalGoals: accumulator.totalGoals + stat.goals,
        totalAssists: accumulator.totalAssists + stat.assists,
        totalOwnGoals: accumulator.totalOwnGoals + stat.own_goals,
        totalMatches: accumulator.totalMatches + 1,
        goalkeeperMatches:
          accumulator.goalkeeperMatches + (stat.was_goalkeeper ? 1 : 0),
      }),
      {
        totalGoals: 0,
        totalAssists: 0,
        totalOwnGoals: 0,
        totalMatches: 0,
        goalkeeperMatches: 0,
      },
    );
  }, [data?.player_stats]);

  const chartData = useMemo(() => {
    if (!data?.player_stats) return [];

    return data.player_stats.map((stat: PlayerStat, index) => ({
      name: `Partida ${index + 1}`,
      goals: stat.goals,
      assists: stat.assists,
      ownGoals: stat.own_goals,
      matchId: stat.match_id,
    }));
  }, [data?.player_stats]);

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      playerRepository.updatePlayer(id, data),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador atualizado com sucesso!" });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.player(playerId) });
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar jogador.",
      }),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (id: number) => playerRepository.deletePlayer(id),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador excluído com sucesso!" });
      setIsDeleteModalOpen(false);
      navigate(-1);
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao excluir jogador. Verifique se o jogador possui estatísticas ou vínculos que impedem a exclusão.",
      }),
  });

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(playerId)) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-error-50 px-4 py-3 text-error-600">
          Identificador de jogador inválido.
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (error || !data) {
    const message =
      error instanceof Error
        ? error.message
        : data
          ? "Ocorreu um erro inesperado."
          : "Jogador não encontrado.";
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
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
                    {data.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-900">
                      {data.name}
                    </h1>
                    <p className="text-neutral-600">
                      Entrou em{" "}
                      {format(new Date(data.created_at), "dd MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-800">
                  Participou de {data.rounds?.length ?? 0} rodadas
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                    aria-label="Editar jogador"
                  >
                    <FaEdit aria-hidden />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-700"
                    aria-label="Excluir jogador"
                  >
                    <FaTrash aria-hidden />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCardConfig.map((config) => (
              <StatCard
                key={config.key}
                title={config.title}
                value={aggregatedStats[config.key]}
                icon={config.icon}
                accentColorClassName={config.accent}
              />
            ))}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 shadow-lg">
            <div className="flex border-b">
              {(["stats", "rounds", "matches"] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  className={`w-full px-6 py-4 font-medium transition ${
                    activeTab === tabKey
                      ? "border-b-2 border-primary-600 text-primary-600"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  onClick={() => setActiveTab(tabKey)}
                >
                  {tabKey === "stats" && "Estatísticas"}
                  {tabKey === "rounds" &&
                    `Rodadas (${data.rounds?.length ?? 0})`}
                  {tabKey === "matches" &&
                    `Partidas (${data.player_stats?.length ?? 0})`}
                </button>
              ))}
            </div>
            <div className="space-y-6 p-6">
              {activeTab === "stats" && (
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Desempenho por Partida
                  </h2>
                  <div className="mt-4 h-80 min-h-[320px] w-full">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="goals"
                          name="Gols"
                          fill={colors.success[500]}
                        >
                          {chartData.map((_, index) => (
                            <Cell
                              key={`goal-cell-${index}`}
                              fill={colors.success[500]}
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="assists"
                          name="Assistências"
                          fill={colors.primary[500]}
                        >
                          {chartData.map((_, index) => (
                            <Cell
                              key={`assist-cell-${index}`}
                              fill={colors.primary[500]}
                            />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="ownGoals"
                          name="Gols Contra"
                          fill={colors.error[500]}
                        >
                          {chartData.map((_, index) => (
                            <Cell
                              key={`ownGoal-cell-${index}`}
                              fill={colors.error[500]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {activeTab === "rounds" && (
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Rodadas
                  </h2>
                  {data.rounds && data.rounds.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {data.rounds.map((round) => (
                        <motion.button
                          key={round.id}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          className="rounded-xl border border-neutral-100 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onClick={() => navigate(`/rounds/${round.id}`)}
                        >
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {round.name}
                          </h3>
                          <p className="mt-2 text-sm text-neutral-600">
                            {format(new Date(round.round_date), "dd MMM yyyy")}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-neutral-500">
                      O jogador ainda não participou de rodadas.
                    </p>
                  )}
                </div>
              )}
              {activeTab === "matches" && (
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Estatísticas por Partida
                  </h2>
                  {data.player_stats && data.player_stats.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {data.player_stats.map((stat) => (
                        <motion.div
                          key={stat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-neutral-100 p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-neutral-900">
                                Partida #{stat.match_id}
                              </h3>
                              <p className="text-sm text-neutral-500">
                                Time #{stat.team_id}
                              </p>
                            </div>
                            {stat.was_goalkeeper && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-800">
                                <GiGoalKeeper aria-hidden />
                                Goleiro
                              </span>
                            )}
                          </div>
                          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <dt className="text-xs text-neutral-500">Gols</dt>
                              <dd className="text-xl font-semibold text-success-600">
                                {stat.goals}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-neutral-500">
                                Assistências
                              </dt>
                              <dd className="text-xl font-semibold text-primary-600">
                                {stat.assists}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-neutral-500">
                                Gols Contra
                              </dt>
                              <dd className="text-xl font-semibold text-error-600">
                                {stat.own_goals}
                              </dd>
                            </div>
                          </dl>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-neutral-500">
                      Sem estatísticas registradas.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </Container>

      {isEditModalOpen && (
        <EditPlayerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (id, data) => {
            await updatePlayerMutation.mutateAsync({ id, data });
          }}
          player={data}
        />
      )}

      {isDeleteModalOpen && (
        <DeletePlayerModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await deletePlayerMutation.mutateAsync(playerId);
          }}
          player={data}
          isDeleting={deletePlayerMutation.isPending}
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

export default PlayerDetailsPage;
