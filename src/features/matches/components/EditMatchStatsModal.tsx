import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal, Button, Alert, Card, CardHeader, CardTitle, CardContent } from "@platform/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Match, Player, PlayerStat } from "@/types";
import playerStatsRepository from "@/features/player-stats/api/playerStatsRepository";

interface PlayerStatFormData {
  player_id: number;
  team_id: number;
  goals: string;
  assists: string;
  own_goals: string;
  was_goalkeeper: boolean;
}

interface EditMatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerStats: Array<{
    player_id: number;
    team_id: number;
    goals: number;
    assists: number;
    own_goals: number;
    was_goalkeeper: boolean;
  }>) => Promise<void>;
  match: Match | null;
}

const EditMatchStatsModal = ({
  isOpen,
  onClose,
  onSave,
  match,
}: EditMatchStatsModalProps) => {
  const [existingStats, setExistingStats] = useState<PlayerStat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get players from both teams
  const team1Players = useMemo(() => match?.team_1_players ?? [], [match?.team_1_players]);
  const team2Players = useMemo(() => match?.team_2_players ?? [], [match?.team_2_players]);
  const team1Id = match?.team_1?.id;
  const team2Id = match?.team_2?.id;

  // Initialize form data for all players
  const initialFormData = useMemo(() => {
    const data: Record<string, PlayerStatFormData> = {};
    
    // Ensure existingStats is always an array
    const statsArray = Array.isArray(existingStats) ? existingStats : [];

    // Team 1 players
    team1Players.forEach((player) => {
      const existingStat = statsArray.find(
        (stat) => stat.player_id === player.id && stat.team_id === team1Id
      ) as PlayerStat | undefined;
      data[`player_${player.id}_team_${team1Id}`] = {
        player_id: player.id,
        team_id: team1Id!,
        goals: existingStat?.goals?.toString() ?? "0",
        assists: existingStat?.assists?.toString() ?? "0",
        own_goals: existingStat?.own_goals?.toString() ?? "0",
        was_goalkeeper: existingStat?.was_goalkeeper ?? false,
      };
    });

    // Team 2 players
    team2Players.forEach((player) => {
      const existingStat = statsArray.find(
        (stat) => stat.player_id === player.id && stat.team_id === team2Id
      ) as PlayerStat | undefined;
      data[`player_${player.id}_team_${team2Id}`] = {
        player_id: player.id,
        team_id: team2Id!,
        goals: existingStat?.goals?.toString() ?? "0",
        assists: existingStat?.assists?.toString() ?? "0",
        own_goals: existingStat?.own_goals?.toString() ?? "0",
        was_goalkeeper: existingStat?.was_goalkeeper ?? false,
      };
    });

    return data;
  }, [team1Players, team2Players, team1Id, team2Id, existingStats]);

  const {
    formData,
    setFormData,
    isSubmitting,
    resetForm,
  } = useModalForm(initialFormData);

  // Load existing stats when modal opens
  useEffect(() => {
    if (isOpen && match?.id) {
      setIsLoadingStats(true);
      setError(null);
      playerStatsRepository
        .findByMatchId(match.id)
        .then((stats) => {
          // Ensure stats is always an array
          setExistingStats(Array.isArray(stats) ? stats : []);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas");
          setExistingStats([]);
        })
        .finally(() => {
          setIsLoadingStats(false);
        });
    }
  }, [isOpen, match?.id]);

  // Update form data when existing stats change
  useEffect(() => {
    // Ensure existingStats is always an array
    const statsArray = Array.isArray(existingStats) ? existingStats : [];
    
    if (statsArray.length > 0 || (team1Players.length > 0 && team2Players.length > 0)) {
      const newFormData: Record<string, PlayerStatFormData> = {};

      team1Players.forEach((player) => {
        const existingStat = statsArray.find(
          (stat) => stat.player_id === player.id && stat.team_id === team1Id
        );
        newFormData[`player_${player.id}_team_${team1Id}`] = {
          player_id: player.id,
          team_id: team1Id!,
          goals: existingStat?.goals?.toString() ?? "0",
          assists: existingStat?.assists?.toString() ?? "0",
          own_goals: existingStat?.own_goals?.toString() ?? "0",
          was_goalkeeper: existingStat?.was_goalkeeper ?? false,
        };
      });

      team2Players.forEach((player) => {
        const existingStat = statsArray.find(
          (stat) => stat.player_id === player.id && stat.team_id === team2Id
        );
        newFormData[`player_${player.id}_team_${team2Id}`] = {
          player_id: player.id,
          team_id: team2Id!,
          goals: existingStat?.goals?.toString() ?? "0",
          assists: existingStat?.assists?.toString() ?? "0",
          own_goals: existingStat?.own_goals?.toString() ?? "0",
          was_goalkeeper: existingStat?.was_goalkeeper ?? false,
        };
      });

      setFormData(newFormData);
    }
  }, [existingStats, team1Players, team2Players, team1Id, team2Id, setFormData]);

  const handleClose = () => {
    resetForm();
    setError(null);
    setExistingStats([]);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!match) return;

    setError(null);

    // Convert form data to payload
    const playerStats = Object.values(formData as Record<string, PlayerStatFormData>).map(
      (stat) => ({
        player_id: stat.player_id,
        team_id: stat.team_id,
        goals: Math.max(0, parseInt(stat.goals, 10) || 0),
        assists: Math.max(0, parseInt(stat.assists, 10) || 0),
        own_goals: Math.max(0, parseInt(stat.own_goals, 10) || 0),
        was_goalkeeper: stat.was_goalkeeper,
      })
    );

    try {
      await onSave(playerStats);
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao salvar estatísticas"
      );
    }
  };

  if (!match || !team1Id || !team2Id) return null;

  const renderPlayerRow = (player: Player, teamId: number, teamName: string) => {
    const key = `player_${player.id}_team_${teamId}`;
    const stat = formData[key] as PlayerStatFormData | undefined;

    if (!stat) return null;

    return (
      <Card
        key={key}
        variant="outlined"
        padding="md"
        style={{ marginBottom: "1rem" }}
      >
        <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ fontWeight: 600, color: "#171717" }}>{player.name}</h4>
          <span style={{ fontSize: "0.875rem", color: "#737373" }}>{teamName}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
          <FormInput
            label="Gols"
            name={`${key}.goals`}
            value={stat.goals}
            onChange={(e) => {
              const newData = { ...formData };
              (newData[key] as PlayerStatFormData).goals = e.target.value;
              setFormData(newData);
            }}
            placeholder="0"
            type="number"
            inputProps={{ min: 0 }}
          />
          <FormInput
            label="Assistências"
            name={`${key}.assists`}
            value={stat.assists}
            onChange={(e) => {
              const newData = { ...formData };
              (newData[key] as PlayerStatFormData).assists = e.target.value;
              setFormData(newData);
            }}
            placeholder="0"
            type="number"
            inputProps={{ min: 0 }}
          />
          <FormInput
            label="Gols Contra"
            name={`${key}.own_goals`}
            value={stat.own_goals}
            onChange={(e) => {
              const newData = { ...formData };
              (newData[key] as PlayerStatFormData).own_goals = e.target.value;
              setFormData(newData);
            }}
            placeholder="0"
            type="number"
            inputProps={{ min: 0 }}
          />
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
              Foi Goleiro
            </label>
            <input
              type="checkbox"
              checked={stat.was_goalkeeper}
              onChange={(e) => {
                const newData = { ...formData };
                (newData[key] as PlayerStatFormData).was_goalkeeper = e.target.checked;
                setFormData(newData);
              }}
              style={{ height: "1rem", width: "1rem", borderRadius: "0.25rem" }}
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Estatísticas da Partida"
      size="xl"
    >
      <div className="space-y-4">
        <form id="edit-match-stats-form" onSubmit={handleSubmit}>
          {isLoadingStats ? (
            <div style={{ padding: "2rem 0", textAlign: "center", color: "#737373" }}>
              Carregando estatísticas...
            </div>
          ) : (
            <>
              <Card variant="outlined" padding="md" style={{ marginBottom: "1.5rem" }}>
                <CardHeader>
                  <CardTitle>{match.team_1?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {team1Players.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {team1Players.map((player) =>
                        renderPlayerRow(player, team1Id, match.team_1?.name ?? "")
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.875rem", color: "#737373" }}>Nenhum jogador no time 1</p>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined" padding="md" style={{ marginBottom: "1.5rem" }}>
                <CardHeader>
                  <CardTitle>{match.team_2?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {team2Players.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {team2Players.map((player) =>
                        renderPlayerRow(player, team2Id, match.team_2?.name ?? "")
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.875rem", color: "#737373" }}>Nenhum jogador no time 2</p>
                  )}
                </CardContent>
              </Card>

              {error && <Alert variant="error">{error}</Alert>}
            </>
          )}
        </form>
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting || isLoadingStats}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="edit-match-stats-form"
            loading={isSubmitting || isLoadingStats}
            disabled={isSubmitting || isLoadingStats}
            aria-label="Salvar Estatísticas"
          >
            Salvar Estatísticas
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditMatchStatsModal;
