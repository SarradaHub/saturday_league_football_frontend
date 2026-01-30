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
} from "react-icons/fa";
import teamRepository from "@/features/teams/api/teamRepository";
import playerRepository from "@/features/players/api/playerRepository";
import CreatePlayerModal from "@/features/players/components/CreatePlayerModal";
import StatCard from "@/shared/components/cards/StatCard";
import SearchInput from "@/shared/components/search/SearchInput";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { colors } from "@sarradahub/design-system/tokens";
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

  const players = useMemo(() => team?.players ?? [], [team?.players]);

  const filteredPlayers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return players;
    return players.filter((player) =>
      player.name.toLowerCase().includes(normalized),
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
        name: player.name.split(" ")[0],
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
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-red-50 px-4 py-3 text-red-600">
          Identificador de time inválido.
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

  if (error || !team) {
    const message =
      error instanceof Error
        ? error.message
        : team
          ? "Ocorreu um erro inesperado."
          : "Time não encontrado.";
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-red-50 px-4 py-3 text-red-600">
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-24 min-h-screen bg-gray-50 py-8 font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-12 rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center gap-2 text-gray-600 transition hover:text-gray-800"
                >
                  <FaArrowLeft aria-hidden />
                  Voltar
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {team.name}
                    </h1>
                    <p className="text-gray-600">
                      Criado em{" "}
                      {format(new Date(team.created_at), "dd MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                {players.length} jogadores
              </span>
            </div>
          </section>

          <section className="md:col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total de Jogadores"
              value={stats.totalPlayers}
              icon={<FaUsers className="text-blue-500" aria-hidden />}
              accentColorClassName="border-blue-500"
            />
            <StatCard
              title="Partidas"
              value={stats.totalMatches}
              icon={<FaFutbol className="text-green-500" aria-hidden />}
              accentColorClassName="border-green-500"
            />
            <StatCard
              title="Gols"
              value={stats.totalGoals}
              icon={<FaMedal className="text-yellow-500" aria-hidden />}
              accentColorClassName="border-yellow-500"
            />
            <StatCard
              title="Assistências"
              value={stats.totalAssists}
              icon={<FaChartLine className="text-indigo-500" aria-hidden />}
              accentColorClassName="border-indigo-500"
            />
            <StatCard
              title="Média Gols/Jogador"
              value={stats.goalsPerPlayer}
              icon={<FaFutbol className="text-purple-500" aria-hidden />}
              accentColorClassName="border-purple-500"
            />
          </section>

          <section className="md:col-span-12 rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Jogadores
                </h2>
                <p className="text-sm text-gray-500">
                  Selecione um jogador para ver detalhes individuais.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar jogador..."
                />
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
                >
                  <FaPlus aria-hidden />
                  Novo Jogador
                </button>
              </div>
            </div>
            {filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player: Player) => (
                  <motion.button
                    key={player.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {player.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Gols: {player.total_goals} • Assistências:{" "}
                        {player.total_assists}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
                Nenhum jogador encontrado.
              </p>
            )}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900">
              Desempenho Aggregado
            </h2>
            {chartData.length > 0 ? (
              <div className="mt-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
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
              <p className="mt-4 rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
                Estatísticas insuficientes para gerar gráficos.
              </p>
            )}
          </section>
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
