import { BaseService, QueryParams } from "@/shared/api/baseService";
import { Round } from "@/types";

type UpsertRoundPayload = Partial<
  Pick<Round, "name" | "round_date" | "championship_id">
>;

interface RoundQueryParams extends QueryParams {
  fields?: string;
  include?: string;
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
