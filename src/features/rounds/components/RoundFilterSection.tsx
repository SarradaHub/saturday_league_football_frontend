import { FiFilter } from "react-icons/fi";
import { format } from "date-fns";
import { Label, Select, Button } from "@platform/design-system";
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
    <div style={{ padding: "0.5rem 0.5rem 0 0.5rem" }}>
      <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Label htmlFor="round-filter-select" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
          Filtrar por rodada:
        </Label>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={onToggleFilter}
          leftIcon={FiFilter}
        >
          {showRoundFilter ? "Ocultar" : "Mostrar"}
        </Button>
      </div>
      {showRoundFilter && (
        <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <Select
            id="round-filter-select"
            name="round-filter-select"
            value={String(selectedRoundId ?? "")}
            onChange={(event) => onRoundChange(Number(event.target.value))}
            options={rounds.map((round) => ({
              value: String(round.id),
              label: `${round.name} (${format(new Date(round.round_date), "dd/MM/yyyy")})`,
            }))}
          />
          <p style={{ fontSize: "0.75rem", color: "#737373" }}>
            Exibindo {existingPlayers.length} jogadores desta rodada.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoundFilterSection;
