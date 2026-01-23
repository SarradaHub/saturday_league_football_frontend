import { FiFilter } from "react-icons/fi";
import { format } from "date-fns";
import { Player, Round } from "@/types";

interface RoundFilterSectionProps {
  context: "round" | "team";
  rounds: Round[];
  showRoundFilter: boolean;
  selectedRoundId: number | null;
  onToggleFilter: () => void;
  onRoundChange: (roundId: number) => void;
  existingPlayers: Player[];
}

const RoundFilterSection = ({
  context,
  rounds,
  showRoundFilter,
  selectedRoundId,
  onToggleFilter,
  onRoundChange,
  existingPlayers,
}: RoundFilterSectionProps) => {
  if (context !== "round" || rounds.length === 0) {
    return null;
  }

  return (
    <div className="px-2 pt-2">
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="round-filter-select"
          className="text-sm font-medium text-neutral-700"
        >
          Filtrar por rodada:
        </label>
        <button
          type="button"
          onClick={onToggleFilter}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:text-primary-700"
        >
          <FiFilter aria-hidden />
          {showRoundFilter ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {showRoundFilter && (
        <div className="mb-4 space-y-1">
          <select
            id="round-filter-select"
            value={selectedRoundId ?? ""}
            onChange={(event) => onRoundChange(Number(event.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name} ({format(new Date(round.round_date), "dd/MM/yyyy")}
                )
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500">
            Exibindo {existingPlayers.length} jogadores desta rodada.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoundFilterSection;
