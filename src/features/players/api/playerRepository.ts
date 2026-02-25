import { BaseService, QueryParams } from "@/shared/api/baseService";
import { Player, PlayerStat } from "@/types";

export interface PlayerFilters extends QueryParams {
  championship_id?: number;
  round_id?: number;
  fields?: string;
  include?: string;
}

export type UpsertPlayerPayload = Partial<
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

  list(championshipId?: number, params?: Omit<PlayerFilters, "championship_id">) {
    const queryParams: PlayerFilters = {
      ...params,
      ...(championshipId ? { championship_id: championshipId } : {}),
    };
    return super.getAll(queryParams);
  }

  listPaginated(championshipId?: number, params?: Omit<PlayerFilters, "championship_id">) {
    const queryParams: PlayerFilters = {
      ...params,
      ...(championshipId ? { championship_id: championshipId } : {}),
    };
    return super.getAllPaginated(queryParams);
  }

  findById(id: number, params?: Pick<PlayerFilters, "fields" | "include">) {
    return this.executeRequest<Player>("GET", `/${id}`, undefined, params).then(
      (response) => this.handleResponse(response),
    );
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

  addToRound(id: number, roundId: number, goalkeeperOnly?: boolean) {
    return this.executeRequest<Player>("POST", `/${id}/add_to_round`, {
      round_id: roundId,
      ...(typeof goalkeeperOnly === "boolean" && { goalkeeper_only: goalkeeperOnly }),
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
