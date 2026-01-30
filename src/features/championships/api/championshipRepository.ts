import { BaseService } from "@/shared/api/baseService";
import { Championship } from "@/types";

type UpsertChampionshipPayload = Partial<
  Pick<
    Championship,
    "name" | "description" | "min_players_per_team" | "max_players_per_team"
  >
>;

class ChampionshipRepository extends BaseService<
  Championship,
  UpsertChampionshipPayload,
  UpsertChampionshipPayload
> {
  constructor() {
    super("/championships");
  }

  list() {
    return super.getAll();
  }

  findById(id: number) {
    return super.getById(id);
  }

  createChampionship(data: UpsertChampionshipPayload) {
    return super.create(data);
  }

  updateChampionship(id: number, data: UpsertChampionshipPayload) {
    return super.update(id, data);
  }

  deleteChampionship(id: number) {
    return super.delete(id);
  }
}

const championshipRepository = new ChampionshipRepository();

export default championshipRepository;
