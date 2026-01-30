import { BaseService } from "@/shared/api/baseService";
import { Team } from "@/types";

type UpsertTeamPayload = Partial<Pick<Team, "name">>;

class TeamRepository extends BaseService<
  Team,
  UpsertTeamPayload,
  UpsertTeamPayload
> {
  constructor() {
    super("/teams");
  }

  list() {
    return super.getAll();
  }

  findById(id: number) {
    return super.getById(id);
  }

  createTeam(data: UpsertTeamPayload) {
    return super.create(data);
  }

  updateTeam(id: number, data: UpsertTeamPayload) {
    return super.update(id, data);
  }

  deleteTeam(id: number) {
    return super.delete(id);
  }
}

const teamRepository = new TeamRepository();

export default teamRepository;
