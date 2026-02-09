import { BaseService, QueryParams } from "@/shared/api/baseService";
import { Team } from "@/types";

export interface PlayerTeamAttribute {
  id: number;
  _destroy?: boolean;
}

type UpsertTeamPayload = Partial<Pick<Team, "name">> & {
  player_teams_attributes?: PlayerTeamAttribute[];
};

interface TeamQueryParams extends QueryParams {
  round_id?: number;
  fields?: string;
  include?: string;
}

class TeamRepository extends BaseService<
  Team,
  UpsertTeamPayload,
  UpsertTeamPayload,
  TeamQueryParams
> {
  constructor() {
    super("/teams");
  }

  list(params?: TeamQueryParams) {
    return super.getAll(params);
  }

  listPaginated(params?: TeamQueryParams) {
    return super.getAllPaginated(params);
  }

  findById(id: number, params?: Pick<TeamQueryParams, "fields" | "include">) {
    return this.executeRequest<Team>("GET", `/${id}`, undefined, params).then(
      (response) => this.handleResponse(response),
    );
  }

  createTeam(data: UpsertTeamPayload) {
    return super.create(data);
  }

  updateTeam(id: number, data: UpsertTeamPayload) {
    return this.executeRequest<Team>("PUT", `/${id}`, { team: data }).then((response) =>
      this.handleResponse(response),
    );
  }

  deleteTeam(id: number) {
    return super.delete(id);
  }
}

const teamRepository = new TeamRepository();

export default teamRepository;
