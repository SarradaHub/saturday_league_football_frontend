import { BaseService } from "@/shared/api/baseService";
import { Player, PlayerStat } from "@/types";

export interface PlayerFilters {
  championship_id?: number;
  [key: string]: number | undefined;
}

type UpsertPlayerPayload = Partial<
  Omit<Player, "id" | "created_at" | "updated_at" | "player_stats" | "rounds">
> & {
  team_id?: number;
  player_rounds_attributes?: Array<{ round_id: number }>;
  championship_id?: number;
};

class PlayerRepository extends BaseService<
  Player,
  UpsertPlayerPayload,
  UpsertPlayerPayload,
  PlayerFilters
> {
  constructor() {
    super("/players");
  }

  list(championshipId?: number) {
    const params = championshipId
      ? { championship_id: championshipId }
      : undefined;
    return super.getAll(params);
  }

  findById(id: number) {
    return super.getById(id);
  }

  createPlayer(data: UpsertPlayerPayload) {
    return super.create(data);
  }

  updatePlayer(id: number, data: UpsertPlayerPayload) {
    return super.update(id, data);
  }

  deletePlayer(id: number) {
    return super.delete(id);
  }

  addToRound(id: number, roundId: number) {
    return this.executeRequest<Player>("POST", `/${id}/add_to_round`, {
      round_id: roundId,
    }).then((response) => this.handleResponse(response));
  }

  addToTeam(id: number, teamId: number) {
    return this.executeRequest<Player>("POST", `/${id}/add_to_team`, {
      team_id: teamId,
    }).then((response) => this.handleResponse(response));
  }

  matchStats(id: number, matchId: number, teamId: number, roundId: number) {
    return this.executeRequest<PlayerStat[]>(
      "GET",
      `/${id}/match_stats`,
      undefined,
      {
        match_id: matchId,
        team_id: teamId,
        round_id: roundId,
      },
    ).then((response) => this.handleResponse(response));
  }
}

const playerRepository = new PlayerRepository();

export default playerRepository;
