import { FormEvent, useEffect, useMemo, useState } from "react";
import BaseModal from "@/shared/components/modal/BaseModal";
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
    handleChange,
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
      <div
        key={key}
        className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-neutral-900">{player.name}</h4>
          <span className="text-sm text-neutral-500">{teamName}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
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
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Estatísticas da Partida"
      formId="edit-match-stats-form"
      isSubmitting={isSubmitting || isLoadingStats}
      submitDisabled={isSubmitting || isLoadingStats}
      submitLabel="Salvar Estatísticas"
      size="7xl"
    >
      <form id="edit-match-stats-form" onSubmit={handleSubmit}>
        {isLoadingStats ? (
          <div className="py-8 text-center text-neutral-500">
            Carregando estatísticas...
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900">
                {match.team_1?.name}
              </h3>
              {team1Players.length > 0 ? (
                <div className="space-y-4">
                  {team1Players.map((player) =>
                    renderPlayerRow(player, team1Id, match.team_1?.name ?? "")
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Nenhum jogador no time 1</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900">
                {match.team_2?.name}
              </h3>
              {team2Players.length > 0 ? (
                <div className="space-y-4">
                  {team2Players.map((player) =>
                    renderPlayerRow(player, team2Id, match.team_2?.name ?? "")
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Nenhum jogador no time 2</p>
              )}
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-error-100 bg-error-50 p-3">
                <span className="text-sm text-error-600">{error}</span>
              </div>
            )}
          </>
        )}
      </form>
    </BaseModal>
  );
};

export default EditMatchStatsModal;
