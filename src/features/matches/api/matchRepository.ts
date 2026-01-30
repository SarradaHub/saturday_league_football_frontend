import { BaseService } from "@/shared/api/baseService";
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

class MatchRepository extends BaseService<
  Match,
  UpsertMatchPayload,
  UpsertMatchPayload
> {
  constructor() {
    super("/matches");
  }

  list() {
    return super.getAll();
  }

  findById(id: number) {
    return super.getById(id);
  }

  createMatch(data: UpsertMatchPayload) {
    return super.create(data);
  }

  updateMatch(id: number, data: UpsertMatchPayload) {
    return super.update(id, data);
  }

  deleteMatch(id: number) {
    return super.delete(id);
  }
}

const matchRepository = new MatchRepository();

export default matchRepository;
