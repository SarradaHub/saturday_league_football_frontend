import { BaseService, PaginatedResponse, QueryParams } from "@/shared/api/baseService";
import { Championship } from "@/types";

type UpsertChampionshipPayload = Partial<
  Pick<
    Championship,
    "name" | "description" | "min_players_per_team" | "max_players_per_team"
  >
>;

interface ChampionshipQueryParams extends QueryParams {
  fields?: string;
  include?: string;
}

class ChampionshipRepository extends BaseService<
  Championship,
  UpsertChampionshipPayload,
  UpsertChampionshipPayload,
  ChampionshipQueryParams
> {
  constructor() {
    super("/championships");
  }

  list(params?: ChampionshipQueryParams) {
    return super.getAll(params);
  }

  listPaginated(params?: ChampionshipQueryParams) {
    return super.getAllPaginated(params);
  }

  findById(id: number, params?: Pick<ChampionshipQueryParams, "fields" | "include">) {
    return this.executeRequest<Championship>("GET", `/${id}`, undefined, params).then(
      (response) => this.handleResponse(response),
    );
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
