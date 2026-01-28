import { BaseService, QueryParams } from "@/shared/api/baseService";
import { Match } from "@/types";

type UpsertMatchPayload = Partial<
  Pick<
    Match,
    | "name"
    | "round_id"
    | "team_1"
    | "team_2"
    | "team_1_goals"
    | "team_2_goals"
    | "team_1_goals_scorer"
    | "team_1_assists"
    | "team_1_own_goals_scorer"
    | "team_2_goals_scorer"
    | "team_2_assists"
    | "team_2_own_goals_scorer"
    | "winning_team"
    | "draw"
  >
>;

interface MatchQueryParams extends QueryParams {
  round_id?: number;
  fields?: string;
  include?: string;
}

class MatchRepository extends BaseService<
  Match,
  UpsertMatchPayload,
  UpsertMatchPayload,
  MatchQueryParams
> {
  constructor() {
    super("/matches");
  }

  list(params?: MatchQueryParams) {
    return super.getAll(params);
  }

  listPaginated(params?: MatchQueryParams) {
    return super.getAllPaginated(params);
  }

  findById(id: number, params?: Pick<MatchQueryParams, "fields" | "include">) {
    return this.executeRequest<Match>("GET", `/${id}`, undefined, params).then(
      (response) => this.handleResponse(response),
    );
  }

  createMatch(data: UpsertMatchPayload) {
    return super.create(data);
  }

  updateMatch(id: number, data: UpsertMatchPayload) {
    // Transform winning_team object to winning_team_id for backend compatibility
    const payload: any = { ...data };
    if (payload.winning_team && typeof payload.winning_team === 'object' && 'id' in payload.winning_team) {
      payload.winning_team_id = payload.winning_team.id;
      delete payload.winning_team;
    } else if (payload.winning_team === null) {
      payload.winning_team_id = null;
      delete payload.winning_team;
    }
    return super.update(id, payload);
  }

  deleteMatch(id: number) {
    return super.delete(id);
  }

  finalizeMatch(id: number) {
    return this.executeRequest<Match>("POST", `/${id}/finalize`).then(
      (response) => this.handleResponse(response),
    );
  }
}

const matchRepository = new MatchRepository();

export default matchRepository;
