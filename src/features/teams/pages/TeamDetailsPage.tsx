import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";
import {
  FaArrowLeft,
  FaChartLine,
  FaFutbol,
  FaMedal,
  FaPlus,
  FaUsers,
  FaEdit,
  FaTrash,
  FaUserMinus,
} from "react-icons/fa";
import teamRepository from "@/features/teams/api/teamRepository";
import playerRepository from "@/features/players/api/playerRepository";
import CreatePlayerModal from "@/features/players/components/CreatePlayerModal";
import EditTeamModal from "@/features/teams/components/EditTeamModal";
import DeleteTeamModal from "@/features/teams/components/DeleteTeamModal";
import StatCard from "@/shared/components/cards/StatCard";
import SearchInput from "@/shared/components/search/SearchInput";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Container, Card, CardHeader, CardTitle, CardContent, Button, Alert } from "@platform/design-system";
import { colors } from "@platform/design-system/tokens";
import { Player } from "@/types";

const queryKeys = {
  team: (id: number) => ["team", id] as const,
};

const TeamDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const teamId = Number(params.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ open: boolean; message: string | null }>(
    {
      open: false,
      message: null,
    },
  );

  const {
    data: team,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.team(teamId),
    queryFn: () => teamRepository.findById(teamId),
    enabled: Number.isFinite(teamId),
  });

  const createPlayerMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof playerRepository.createPlayer>[0],
    ) => playerRepository.createPlayer(payload),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador criado com sucesso!" });
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
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
  const handleExistingPlayerAdded = () => {
    setToast({ open: true, message: "Jogador adicionado ao time!" });
    queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
  };

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      teamRepository.updateTeam(id, data),
    onSuccess: () => {
      setToast({ open: true, message: "Time atualizado com sucesso!" });
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao atualizar time.",
      }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => teamRepository.deleteTeam(id),
    onSuccess: () => {
      setToast({ open: true, message: "Time excluído com sucesso!" });
      setIsDeleteModalOpen(false);
      navigate(-1);
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao excluir time. Verifique se o time possui jogadores ou partidas associadas.",
      }),
  });

  const removePlayerMutation = useMutation({
    mutationFn: ({ playerTeamId }: { playerTeamId: number }) =>
      teamRepository.updateTeam(teamId, {
        player_teams_attributes: [{ id: playerTeamId, _destroy: true }],
      }),
    onSuccess: () => {
      setToast({ open: true, message: "Jogador removido do time." });
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
    },
    onError: (mutationError) =>
      setToast({
        open: true,
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Erro ao remover jogador do time.",
      }),
  });

  const players = useMemo(() => team?.players ?? [], [team?.players]);

  const filteredPlayers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return players;
    return players.filter((player) =>
      player.display_name.toLowerCase().includes(normalized),
    );
  }, [players, searchTerm]);

  const stats = useMemo(() => {
    if (!team) {
      return {
        totalPlayers: 0,
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        goalsPerPlayer: "0.0",
      };
    }

    const totalMatches = team.matches?.length ?? 0;
    let totalGoals = 0;
    let totalAssists = 0;

    players.forEach((player) => {
      const statsList = player.player_stats ?? [];
      statsList.forEach((stat) => {
        totalGoals += stat.goals;
        totalAssists += stat.assists;
      });
    });

    return {
      totalPlayers: players.length,
      totalMatches,
      totalGoals,
      totalAssists,
      goalsPerPlayer: players.length
        ? (totalGoals / players.length).toFixed(1)
        : "0.0",
    };
  }, [players, team]);

  const chartData = useMemo(() => {
    return players.map((player) => {
      const statsList = player.player_stats ?? [];
      const goals = statsList.reduce((acc, stat) => acc + stat.goals, 0);
      const assists = statsList.reduce((acc, stat) => acc + stat.assists, 0);
      return {
        name: player.first_name ?? player.display_name.split(" ")[0],
        goals,
        assists,
      };
    });
  }, [players]);

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(teamId)) {
    return (
      <div style={{ marginTop: "6rem", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Alert variant="error">Identificador de time inválido.</Alert>
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

  if (error || !team) {
    const message =
      error instanceof Error
        ? error.message
        : team
          ? "Ocorreu um erro inesperado."
          : "Time não encontrado.";
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
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle style={{ fontSize: "1.875rem" }}>{team.name}</CardTitle>
                    <p style={{ color: "#737373" }}>
                      Criado em{" "}
                      {format(new Date(team.created_at), "dd MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, color: "#1e40af" }}>
                  {players.length} jogadores
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    leftIcon={FaEdit}
                    aria-label="Editar time"
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    leftIcon={FaTrash}
                    aria-label="Excluir time"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ gridColumn: "span 12", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <StatCard
              title="Total de Jogadores"
              value={stats.totalPlayers}
              icon={<FaUsers className="text-primary-500" aria-hidden />}
              accentColorClassName="border-primary-500"
            />
            <StatCard
              title="Partidas"
              value={stats.totalMatches}
              icon={<FaFutbol className="text-success-500" aria-hidden />}
              accentColorClassName="border-success-500"
            />
            <StatCard
              title="Gols"
              value={stats.totalGoals}
              icon={<FaMedal className="text-warning-500" aria-hidden />}
              accentColorClassName="border-warning-500"
            />
            <StatCard
              title="Assistências"
              value={stats.totalAssists}
              icon={<FaChartLine className="text-secondary-500" aria-hidden />}
              accentColorClassName="border-secondary-500"
            />
            <StatCard
              title="Média Gols/Jogador"
              value={stats.goalsPerPlayer}
              icon={<FaFutbol className="text-secondary-500" aria-hidden />}
              accentColorClassName="border-secondary-500"
            />
          </div>

          <Card variant="elevated" padding="lg" style={{ gridColumn: "span 12" }}>
            <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <CardTitle style={{ fontSize: "1.5rem" }}>Jogadores</CardTitle>
                <p style={{ fontSize: "0.875rem", color: "#737373", marginTop: "0.25rem" }}>
                  Selecione um jogador para ver detalhes individuais.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flexWrap: "wrap" }}>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar jogador..."
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setModalOpen(true)}
                  leftIcon={FaPlus}
                >
                  Novo Jogador
                </Button>
              </div>
            </div>
            <CardContent>
              {filteredPlayers.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                  {filteredPlayers.map((player: Player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card
                        variant="outlined"
                        padding="md"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/players/${player.id}`)}
                      >
                        <CardContent>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <span style={{ display: "flex", height: "3rem", width: "3rem", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#dbeafe", fontSize: "1.125rem", fontWeight: 700, color: "#2563eb" }}>
                                {player.display_name.charAt(0).toUpperCase()}
                              </span>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ fontWeight: 600, color: "#171717" }}>
                                  {player.display_name}
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                                  Gols: {player.total_goals} • Assistências:{" "}
                                  {player.total_assists}
                                </p>
                              </div>
                            </div>
                            {typeof player.player_team_id === "number" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label="Remover jogador do time"
                                leftIcon={FaUserMinus}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const ptId = player.player_team_id;
                                if (typeof ptId === "number" && window.confirm(`Remover ${player.display_name} do time?`)) {
                                  removePlayerMutation.mutate({ playerTeamId: ptId });
                                }
                                }}
                                disabled={removePlayerMutation.isPending}
                              >
                                Remover do time
                              </Button>
                            )}
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
              <CardTitle style={{ fontSize: "1.5rem" }}>Desempenho Aggregado</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div style={{ marginTop: "1.5rem", height: "20rem", minHeight: "320px", width: "100%" }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="goals" name="Gols" fill={colors.primary[500]}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`goal-cell-${index}`}
                          fill={
                            index % 2 === 0
                              ? colors.primary[600]
                              : colors.primary[500]
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="assists"
                      name="Assistências"
                      fill={colors.success[500]}
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`assist-cell-${index}`}
                          fill={
                            index % 2 === 0
                              ? colors.info[400]
                              : colors.success[500]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              ) : (
                <Card variant="outlined" padding="lg" style={{ marginTop: "1rem", textAlign: "center", color: "#737373" }}>
                  <CardContent>
                    Estatísticas insuficientes para gerar gráficos.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>

      {isModalOpen && (
        <CreatePlayerModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={async (payload) => {
            await createPlayerMutation.mutateAsync({
              ...payload,
              team_id: teamId,
            });
          }}
          championshipId={team.championship_id}
          context="team"
          currentPlayers={players}
          onExistingPlayerAdded={handleExistingPlayerAdded}
        />
      )}

      {isEditModalOpen && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={async (id, data) => {
            await updateTeamMutation.mutateAsync({ id, data });
          }}
          team={team}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteTeamModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={async () => {
            await deleteTeamMutation.mutateAsync(teamId);
          }}
          team={team}
          isDeleting={deleteTeamMutation.isPending}
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

export default TeamDetailsPage;
