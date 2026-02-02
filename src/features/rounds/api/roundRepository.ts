import { BaseService, QueryParams } from "@/shared/api/baseService";
import { Round, Team, Match } from "@/types";

type UpsertRoundPayload = Partial<
  Pick<Round, "name" | "round_date" | "championship_id">
>;

interface RoundQueryParams extends QueryParams {
  fields?: string;
  include?: string;
}

interface SuggestedMatchPayload {
  name: string;
  team_1: Team;
  team_2: Team;
}

export interface SuggestNextMatchResponse {
  needs_winner_selection: boolean;
  suggested_match?: SuggestedMatchPayload;
  candidates?: Team[];
  next_opponent?: Team;
  reason?: string;
  queue?: Team[];
}

class RoundRepository extends BaseService<
  Round,
  UpsertRoundPayload,
  UpsertRoundPayload,
  RoundQueryParams
> {
  constructor() {
    super("/rounds");
  }

  list(params?: RoundQueryParams) {
    return super.getAll(params);
  }

  listPaginated(params?: RoundQueryParams) {
    return super.getAllPaginated(params);
  }

  findById(id: number, params?: Pick<RoundQueryParams, "fields" | "include">) {
    return this.executeRequest<Round>("GET", `/${id}`, undefined, params).then(
      (response) => this.handleResponse(response),
    );
  }

  getStatistics(roundId: number) {
    return this.executeRequest<{
      [playerId: number]: {
        goals: number;
        assists: number;
        own_goals: number;
        matches: number;
        goalkeeper_count: number;
        wins: number;
        losses: number;
        draws: number;
        player: {
          id: number;
          name: string;
        };
      };
    }>("GET", `/${roundId}/statistics`).then((response) => this.handleResponse(response));
  }

  suggestNextMatch(roundId: number) {
    return this.executeRequest<SuggestNextMatchResponse>(
      "POST",
      `/${roundId}/suggest_next_match`,
    ).then((response) => this.handleResponse(response));
  }

  createNextMatch(roundId: number, winnerTeamId?: number) {
    const payload = winnerTeamId ? { winner_team_id: winnerTeamId } : undefined;
    return this.executeRequest<Match | { match: Match; queue: Team[] }>(
      "POST",
      `/${roundId}/create_next_match`,
      payload,
    ).then((response) => this.handleResponse(response));
  }

  createRound(data: UpsertRoundPayload) {
    return super.create(data);
  }

  updateRound(id: number, data: UpsertRoundPayload) {
    return super.update(id, data);
  }

  deleteRound(id: number) {
    return super.delete(id);
  }
}

const roundRepository = new RoundRepository();

export default roundRepository;
