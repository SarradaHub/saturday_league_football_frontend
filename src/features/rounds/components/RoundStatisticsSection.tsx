import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTrophy, FaMedal, FaShieldAlt } from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@platform/design-system";
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
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <LoadingSpinner size="md" text="Carregando estatísticas..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        Erro ao carregar estatísticas da rodada.
      </Alert>
    );
  }

  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <Card variant="outlined" padding="lg" style={{ textAlign: "center", color: "#737373" }}>
        <CardContent>
          Nenhuma estatística disponível para esta rodada.
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        {topScorer && topScorer.goals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="outlined" padding="md" style={{ borderColor: "#fbbf24", backgroundColor: "#fef3c7" }}>
              <CardContent>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FaTrophy style={{ fontSize: "1.5rem", color: "#d97706" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#92400e" }}>Artilheiro</p>
                    <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#78350f" }}>
                      {topScorer.player.name}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#d97706" }}>{topScorer.goals} gols</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {topAssist && topAssist.assists > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="outlined" padding="md">
              <CardContent>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FaMedal style={{ fontSize: "1.5rem", color: "#737373" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>Mais Assists</p>
                    <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#171717" }}>
                      {topAssist.player.name}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#737373" }}>{topAssist.assists} assists</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {topGoalkeeper && topGoalkeeper.goalkeeper_count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="outlined" padding="md" style={{ borderColor: "#a78bfa", backgroundColor: "#ede9fe" }}>
              <CardContent>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FaShieldAlt style={{ fontSize: "1.5rem", color: "#7c3aed" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#6d28d9" }}>Mais Goleiro</p>
                    <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#5b21b6" }}>
                      {topGoalkeeper.player.name}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#7c3aed" }}>
                      {topGoalkeeper.goalkeeper_count} vez{topGoalkeeper.goalkeeper_count > 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Statistics Table */}
      <Card variant="outlined" padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("player")}
              >
                Jogador
                {sortField === "player" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("goals")}
              >
                Gols
                {sortField === "goals" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("assists")}
              >
                Assists
                {sortField === "assists" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("matches")}
              >
                Partidas
                {sortField === "matches" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("goalkeeper_count")}
              >
                Goleiro
                {sortField === "goalkeeper_count" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("wins")}
              >
                Vitórias
                {sortField === "wins" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("losses")}
              >
                Derrotas
                {sortField === "losses" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
              <TableHead
                style={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => handleSort("draws")}
              >
                Empates
                {sortField === "draws" && (
                  <span style={{ marginLeft: "0.25rem" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody hoverable>
            {sortedStatistics.map((stat, index) => (
              <TableRow
                key={stat.player.id}
                hoverable
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/players/${stat.player.id}`)}
              >
                <TableCell style={{ fontWeight: 500 }}>
                  {stat.player.name}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {stat.goals}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {stat.assists}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {stat.matches}
                </TableCell>
                <TableCell style={{ textAlign: "center" }}>
                  {stat.goalkeeper_count}
                </TableCell>
                <TableCell style={{ textAlign: "center", color: "#16a34a", fontWeight: 600 }}>
                  {stat.wins}
                </TableCell>
                <TableCell style={{ textAlign: "center", color: "#dc2626", fontWeight: 600 }}>
                  {stat.losses}
                </TableCell>
                <TableCell style={{ textAlign: "center", color: "#d97706", fontWeight: 600 }}>
                  {stat.draws}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default RoundStatisticsSection;
