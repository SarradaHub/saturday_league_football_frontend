import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { FaArrowLeft, FaFutbol } from "react-icons/fa";
import matchRepository from "@/features/matches/api/matchRepository";
import Container from "@/shared/components/layout/Container";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import { Match, Player } from "@/types";

const queryKeys = {
  match: (id: number) => ["match", id] as const,
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

  const {
    data: match,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.match(matchId),
    queryFn: () => matchRepository.findById(matchId),
    enabled: Number.isFinite(matchId),
  });

  const team1 = useMemo(
    () => (match ? buildTeamBreakdown(match, "team_1") : null),
    [match],
  );
  const team2 = useMemo(
    () => (match ? buildTeamBreakdown(match, "team_2") : null),
    [match],
  );

  if (!Number.isFinite(matchId)) {
    return (
      <div className="mt-24 flex min-h-screen items-center justify-center">
        <span className="rounded-lg bg-red-50 px-4 py-3 text-red-600">
          Identificador de partida inválido.
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

  if (error || !match || !team1 || !team2) {
    const message =
      error instanceof Error
        ? error.message
        : match
          ? "Ocorreu um erro inesperado."
          : "Partida não encontrada.";
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {match.name}
                </h1>
                <p className="text-gray-600">
                  {format(new Date(match.created_at), "dd MMMM yyyy")}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                <FaFutbol aria-hidden />
                Rodada #{match.round_id}
              </span>
            </div>
          </section>

          <section className="md:col-span-12 rounded-2xl bg-white p-6 shadow-lg">
            <div className="grid gap-8 md:grid-cols-3">
              <TeamColumn team={team1} align="right" />
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-sm uppercase text-gray-500">Placar</span>
                <div className="mt-2 text-5xl font-bold text-gray-900">
                  {team1.goals}{" "}
                  <span className="mx-1 text-3xl text-gray-400">x</span>{" "}
                  {team2.goals}
                </div>
                {match.winning_team ? (
                  <span className="mt-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                    Vitória: {match.winning_team.name}
                  </span>
                ) : (
                  <span className="mt-2 rounded-full bg-yellow-100 px-4 py-1 text-sm font-semibold text-yellow-700">
                    Empate
                  </span>
                )}
              </div>
              <TeamColumn team={team2} align="left" />
            </div>
          </section>
        </div>
      </Container>
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
      <h4 className={`text-sm font-semibold text-gray-500 ${textAlign}`}>
        {title}
      </h4>
      {players.length > 0 ? (
        <ul className={`mt-2 space-y-2 ${textAlign}`}>
          {players.map((player, index) => (
            <motion.li
              key={`${title}-${player.id}-${index}`}
              initial={{ opacity: 0, x: align === "left" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-gray-700"
            >
              {player.name}
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className={`mt-2 text-sm text-gray-400 ${textAlign}`}>
          {emptyMessage}
        </p>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${textAlign}`}>
      <div className={`flex flex-col ${flexDirection} gap-2`}>
        <span className="text-xl font-semibold text-gray-900">{team.name}</span>
        <span className="text-3xl font-bold text-gray-800">{team.goals}</span>
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
        <h4 className={`text-sm font-semibold text-gray-500 ${textAlign}`}>
          Escalação
        </h4>
        <ul className={`mt-2 space-y-1 ${textAlign}`}>
          {team.players.map((player) => (
            <li key={player.id} className="text-sm text-gray-600">
              {player.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MatchDetailsPage;
