import { useMemo, useState } from "react";
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
import RoundStatisticsSection from "@/features/rounds/components/RoundStatisticsSection";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { colors } from "@sarradahub/design-system/tokens";
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
  const [playerSearch, setPlayerSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
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
  });

  const invalidateRound = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.round(roundId) });
  const handleExistingPlayerAdded = () => {
    setToast({ open: true, message: "Jogador adicionado com sucesso!" });
    invalidateRound();
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

  const handleCloseToast = (
    _event: Event | React.SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
    setToast({ open: false, message: null });
  };

  if (!Number.isFinite(roundId)) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-error-50 px-4 py-3 text-error-600">
          Identificador de rodada inválido.
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

  if (error || !round) {
    const message =
      error instanceof Error
        ? error.message
        : round
          ? "Ocorreu um erro inesperado."
          : "Rodada não encontrada.";
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
                  {round.name}
                </h1>
                <p className="text-neutral-600">
                  {format(new Date(round.round_date), "dd MMMM yyyy")}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-800">
                {matches.length} partidas
              </span>
            </div>
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
                <FaFutbol className="text-success-500" aria-hidden />
                Partidas
              </h2>
              <button
                type="button"
                onClick={() => setMatchModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition hover:bg-primary-700"
              >
                <FaPlus aria-hidden />
                Criar Partida
              </button>
            </div>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match: Match) => (
                  <motion.button
                    key={match.id}
                    type="button"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full rounded-xl border border-neutral-200 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => navigate(`/matches/${match.id}`)}
                  >
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>
                        {format(new Date(match.created_at), "dd/MM/yyyy")}
                      </span>
                      <span>{match.name}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 items-center gap-4 text-center">
                      <p className="font-medium text-right">
                        {match.team_1.name}
                      </p>
                      <div className="text-2xl font-bold text-neutral-500">
                        {match.team_1_goals} x {match.team_2_goals}
                      </div>
                      <p className="font-medium text-left">
                        {match.team_2.name}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
                Nenhuma partida cadastrada.
              </p>
            )}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
                <FaUser className="text-primary-500" aria-hidden />
                Jogadores
              </h2>
              <button
                type="button"
                onClick={() => setPlayerModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition hover:bg-primary-700"
              >
                <FaPlus aria-hidden />
                Adicionar Jogador
              </button>
            </div>
            <div className="relative mb-6">
              <input
                type="search"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Buscar jogador..."
                className="w-full rounded-full border px-4 py-2 pl-10 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <FaSearch
                className="absolute left-3 top-3 text-neutral-400"
                aria-hidden
              />
            </div>
            {filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredPlayers.map((player: Player) => (
                  <motion.button
                    key={player.id}
                    type="button"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => navigate(`/players/${player.id}`)}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {player.name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        Participou de {player.rounds?.length ?? 0} rodadas
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
                Nenhum jogador encontrado.
              </p>
            )}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
                <FaUsers className="text-secondary-500" aria-hidden />
                Times
              </h2>
              <button
                type="button"
                onClick={() => setTeamModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition hover:bg-primary-700"
              >
                <FaPlus aria-hidden />
                Criar Time
              </button>
            </div>
            <div className="relative mb-6">
              <input
                type="search"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                placeholder="Buscar time..."
                className="w-full rounded-full border px-4 py-2 pl-10 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
              <FaSearch
                className="absolute left-3 top-3 text-neutral-400"
                aria-hidden
              />
            </div>
            {filteredTeams.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredTeams.map((team: Team) => (
                  <motion.button
                    key={team.id}
                    type="button"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() =>
                      navigate(`/teams/${team.id}`, {
                        state: { roundId },
                      })
                    }
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-lg font-bold text-secondary-600">
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {team.name}
                      </h3>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
                Nenhum time encontrado.
              </p>
            )}
          </section>

          <section className="md:col-span-12 rounded-2xl bg-neutral-50 p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-neutral-900">
                <FaFutbol className="text-primary-500" aria-hidden />
                Estatísticas da Rodada
              </h2>
            </div>
            <RoundStatisticsSection roundId={roundId} />
          </section>
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
      {isPlayerModalOpen && (
        <CreatePlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => setPlayerModalOpen(false)}
          onCreate={async (payload) => {
            await playerMutation.mutateAsync(payload);
          }}
          championshipId={round.championship_id}
          currentPlayers={players}
          rounds={[round]}
          selectedRoundId={roundId}
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
