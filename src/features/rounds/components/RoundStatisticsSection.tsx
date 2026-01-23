import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTrophy, FaMedal, FaFutbol, FaShieldAlt } from "react-icons/fa";
import roundRepository from "@/features/rounds/api/roundRepository";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

interface PlayerStatistics {
  player: {
    id: number;
    name: string;
  };
  goals: number;
  assists: number;
  own_goals: number;
  matches: number;
  goalkeeper_count: number;
  wins: number;
  losses: number;
  draws: number;
}

interface RoundStatisticsData {
  [playerId: number]: PlayerStatistics;
}

interface RoundStatisticsSectionProps {
  roundId: number;
}

type SortField = "goals" | "assists" | "matches" | "goalkeeper_count" | "wins" | "losses" | "draws" | "player";

const RoundStatisticsSection = ({ roundId }: RoundStatisticsSectionProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("goals");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    data: statistics,
    isLoading,
    error,
  } = useQuery<RoundStatisticsData>({
    queryKey: ["round-statistics", roundId],
    queryFn: () => roundRepository.getStatistics(roundId),
    enabled: Number.isFinite(roundId),
  });

  const sortedStatistics = useMemo(() => {
    if (!statistics) return [];

    const players = Object.values(statistics);

    return players.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (sortField === "player") {
        aValue = a.player.name.toLowerCase();
        bValue = b.player.name.toLowerCase();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [statistics, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const topScorer = useMemo(() => {
    if (!statistics) return null;
    return Object.values(statistics).reduce((top, current) =>
      current.goals > top.goals ? current : top
    , Object.values(statistics)[0]);
  }, [statistics]);

  const topAssist = useMemo(() => {
    if (!statistics) return null;
    return Object.values(statistics).reduce((top, current) =>
      current.assists > top.assists ? current : top
    , Object.values(statistics)[0]);
  }, [statistics]);

  const topGoalkeeper = useMemo(() => {
    if (!statistics) return null;
    return Object.values(statistics).reduce((top, current) =>
      current.goalkeeper_count > top.goalkeeper_count ? current : top
    , Object.values(statistics)[0]);
  }, [statistics]);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <LoadingSpinner size="md" text="Carregando estatísticas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-100 bg-error-50 p-4 text-center text-error-600">
        Erro ao carregar estatísticas da rodada.
      </div>
    );
  }

  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-neutral-500">
        Nenhuma estatística disponível para esta rodada.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {topScorer && topScorer.goals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-warning-200 bg-warning-50 p-4"
          >
            <div className="flex items-center gap-3">
              <FaTrophy className="text-2xl text-warning-600" />
              <div>
                <p className="text-sm font-medium text-warning-700">Artilheiro</p>
                <p className="text-lg font-bold text-warning-900">
                  {topScorer.player.name}
                </p>
                <p className="text-sm text-warning-600">{topScorer.goals} gols</p>
              </div>
            </div>
          </motion.div>
        )}

        {topAssist && topAssist.assists > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex items-center gap-3">
              <FaMedal className="text-2xl text-neutral-600" />
              <div>
                <p className="text-sm font-medium text-neutral-700">Mais Assists</p>
                <p className="text-lg font-bold text-neutral-900">
                  {topAssist.player.name}
                </p>
                <p className="text-sm text-neutral-600">{topAssist.assists} assists</p>
              </div>
            </div>
          </motion.div>
        )}

        {topGoalkeeper && topGoalkeeper.goalkeeper_count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-secondary-200 bg-secondary-50 p-4"
          >
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-2xl text-secondary-600" />
              <div>
                <p className="text-sm font-medium text-secondary-700">Mais Goleiro</p>
                <p className="text-lg font-bold text-secondary-900">
                  {topGoalkeeper.player.name}
                </p>
                <p className="text-sm text-secondary-600">
                  {topGoalkeeper.goalkeeper_count} vez{topGoalkeeper.goalkeeper_count > 1 ? "es" : ""}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Statistics Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("player")}
              >
                Jogador
                {sortField === "player" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("goals")}
              >
                Gols
                {sortField === "goals" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("assists")}
              >
                Assists
                {sortField === "assists" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("matches")}
              >
                Partidas
                {sortField === "matches" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("goalkeeper_count")}
              >
                Goleiro
                {sortField === "goalkeeper_count" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("wins")}
              >
                Vitórias
                {sortField === "wins" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("losses")}
              >
                Derrotas
                {sortField === "losses" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                onClick={() => handleSort("draws")}
              >
                Empates
                {sortField === "draws" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sortedStatistics.map((stat, index) => (
              <motion.tr
                key={stat.player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-neutral-50 cursor-pointer"
                onClick={() => navigate(`/players/${stat.player.id}`)}
              >
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {stat.player.name}
                </td>
                <td className="px-4 py-3 text-center text-neutral-700">
                  {stat.goals}
                </td>
                <td className="px-4 py-3 text-center text-neutral-700">
                  {stat.assists}
                </td>
                <td className="px-4 py-3 text-center text-neutral-700">
                  {stat.matches}
                </td>
                <td className="px-4 py-3 text-center text-neutral-700">
                  {stat.goalkeeper_count}
                </td>
                <td className="px-4 py-3 text-center text-success-600 font-semibold">
                  {stat.wins}
                </td>
                <td className="px-4 py-3 text-center text-error-600 font-semibold">
                  {stat.losses}
                </td>
                <td className="px-4 py-3 text-center text-warning-600 font-semibold">
                  {stat.draws}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoundStatisticsSection;
