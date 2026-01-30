import { BaseService } from "@/shared/api/baseService";
import { Round } from "@/types";

type UpsertRoundPayload = Partial<
  Pick<Round, "name" | "round_date" | "championship_id">
>;

class RoundRepository extends BaseService<
  Round,
  UpsertRoundPayload,
  UpsertRoundPayload
> {
  constructor() {
    super("/rounds");
  }

  list() {
    return super.getAll();
  }

  findById(id: number) {
    return super.getById(id);
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
