import { BaseService, QueryParams } from "@/shared/api/baseService";
import type { PlayerStat } from "@/types";

interface PlayerStatPayload
  extends Pick<
    PlayerStat,
    | "goals"
    | "own_goals"
    | "assists"
    | "was_goalkeeper"
    | "match_id"
    | "team_id"
  > {
  player_id: number;
}

interface PlayerStatsQueryParams extends QueryParams {
  match_id?: number;
  team_id?: number;
  fields?: string;
  include?: string;
}

class PlayerStatsRepository extends BaseService<
  PlayerStat,
  PlayerStatPayload,
  PlayerStatPayload,
  PlayerStatsQueryParams
> {
  constructor() {
    super("/player_stats");
  }

  list(params?: PlayerStatsQueryParams) {
    return super.getAll(params);
  }

  listPaginated(params?: PlayerStatsQueryParams) {
    return super.getAllPaginated(params);
  }

  findById(id: number) {
    return super.getById(id);
  }

  findByMatchId(matchId: number) {
    return this.executeRequest<{ data: PlayerStat[]; meta?: unknown } | PlayerStat[]>(
      "GET",
      `/match/${matchId}`,
    ).then((response) => {
      const result = this.handleResponse(response);
      if (
        result &&
        typeof result === "object" &&
        "data" in result &&
        Array.isArray((result as { data: unknown }).data)
      ) {
        return (result as { data: PlayerStat[] }).data;
      }
      if (Array.isArray(result)) {
        return result as PlayerStat[];
      }
      return [];
    });
  }

  createPlayerStat(data: PlayerStatPayload) {
    return super.create(data);
  }

  updatePlayerStat(id: number, data: PlayerStatPayload) {
    return super.update(id, data);
  }

  deletePlayerStat(id: number) {
    return super.delete(id);
  }

  bulkUpdate(matchId: number, playerStats: PlayerStatPayload[]) {
    return this.executeRequest<PlayerStat[]>("POST", `/match/${matchId}/bulk`, {
      player_stats: playerStats,
    }).then((response) => this.handleResponse(response));
  }

  addGoalkeeper(matchId: number, teamId: number, playerId: number) {
    return this.executeRequest<PlayerStat>(
      "POST",
      `/match/${matchId}/goalkeepers`,
      {
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
      },
    ).then((response) => this.handleResponse(response));
  }
}

const playerStatsRepository = new PlayerStatsRepository();

export default playerStatsRepository;
