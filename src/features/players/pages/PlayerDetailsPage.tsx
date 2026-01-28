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
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Alert } from "@platform/design-system";
import { colors } from "@platform/design-system/tokens";
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
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">Identificador de jogador inválido.</Alert>
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

  if (error || !data) {
    const message =
      error instanceof Error
        ? error.message
        : data
          ? "Ocorreu um erro inesperado."
          : "Jogador não encontrado.";
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
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ display: "flex", height: "4rem", width: "4rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", fontSize: "1.5rem", fontWeight: 700, color: "#2563eb" }}>
                    {data.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle style={{ fontSize: "1.875rem" }}>{data.name}</CardTitle>
                    <p style={{ color: "#737373" }}>
                      Entrou em{" "}
                      {format(new Date(data.created_at), "dd MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#1e40af" }}>
                  Participou de {data.rounds?.length ?? 0} rodadas
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    leftIcon={FaEdit}
                    aria-label="Editar jogador"
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={FaTrash}
                    aria-label="Excluir jogador"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {statCardConfig.map((config) => (
              <StatCard
                key={config.key}
                title={config.title}
                value={aggregatedStats[config.key]}
                icon={config.icon}
                accentColorClassName={config.accent}
              />
            ))}
          </div>

          <Card variant="elevated" padding="none" style={{ gridColumn: "span 12" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
              {(["stats", "rounds", "matches"] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  style={{
                    width: "100%",
                    padding: "1rem 1.5rem",
                    fontWeight: 500,
                    transition: "all 0.2s",
                    borderBottom: activeTab === tabKey ? "2px solid #2563eb" : "none",
                    color: activeTab === tabKey ? "#2563eb" : "#737373",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tabKey) {
                      e.currentTarget.style.color = "#404040";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tabKey) {
                      e.currentTarget.style.color = "#737373";
                    }
                  }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
              {activeTab === "stats" && (
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#171717" }}>
                    Desempenho por Partida
                  </h2>
                  <div style={{ marginTop: "1rem", height: "20rem", minHeight: "320px", width: "100%" }}>
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
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#171717" }}>
                    Rodadas
                  </h2>
                  {data.rounds && data.rounds.length > 0 ? (
                    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                      {data.rounds.map((round) => (
                        <motion.div
                          key={round.id}
                          whileHover={{ scale: 1.01 }}
                        >
                          <Card
                            variant="outlined"
                            padding="md"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/rounds/${round.id}`)}
                          >
                            <CardHeader>
                              <CardTitle style={{ fontSize: "1.125rem" }}>{round.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#737373" }}>
                                {format(new Date(round.round_date), "dd MMM yyyy")}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: "1rem", color: "#737373" }}>
                      O jogador ainda não participou de rodadas.
                    </p>
                  )}
                </div>
              )}
              {activeTab === "matches" && (
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#171717" }}>
                    Estatísticas por Partida
                  </h2>
                  {data.player_stats && data.player_stats.length > 0 ? (
                    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                      {data.player_stats.map((stat) => (
                        <motion.div
                          key={stat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card variant="outlined" padding="md">
                            <CardContent>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <div>
                                  <h3 style={{ fontWeight: 600, color: "#171717" }}>
                                    Partida #{stat.match_id}
                                  </h3>
                                  <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                                    Time #{stat.team_id}
                                  </p>
                                </div>
                                {stat.was_goalkeeper && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "#1e40af" }}>
                                    <GiGoalKeeper aria-hidden />
                                    Goleiro
                                  </span>
                                )}
                              </div>
                              <dl style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                                <div>
                                  <dt style={{ fontSize: "0.75rem", color: "#737373" }}>Gols</dt>
                                  <dd style={{ fontSize: "1.25rem", fontWeight: 600, color: "#16a34a" }}>
                                    {stat.goals}
                                  </dd>
                                </div>
                                <div>
                                  <dt style={{ fontSize: "0.75rem", color: "#737373" }}>
                                    Assistências
                                  </dt>
                                  <dd style={{ fontSize: "1.25rem", fontWeight: 600, color: "#2563eb" }}>
                                    {stat.assists}
                                  </dd>
                                </div>
                                <div>
                                  <dt style={{ fontSize: "0.75rem", color: "#737373" }}>
                                    Gols Contra
                                  </dt>
                                  <dd style={{ fontSize: "1.25rem", fontWeight: 600, color: "#dc2626" }}>
                                    {stat.own_goals}
                                  </dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: "1rem", color: "#737373" }}>
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
