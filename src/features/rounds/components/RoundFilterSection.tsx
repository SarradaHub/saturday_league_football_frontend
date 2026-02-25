import { FiFilter } from "react-icons/fi";
import { format, parse } from "date-fns";
import { Select, Button } from "@sarradahub/design-system";
import { Player, Round } from "@/types";

interface RoundFilterSectionProps {
  rounds: Round[];
  showRoundFilter: boolean;
  selectedRoundId: number | null;
  onToggleFilter: () => void;
  onRoundChange: (roundId: number) => void;
  existingPlayers: Player[];
}

const RoundFilterSection = ({
  rounds,
  showRoundFilter,
  selectedRoundId,
  onToggleFilter,
  onRoundChange,
  existingPlayers,
}: RoundFilterSectionProps) => {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <div style={{ padding: "0.5rem 0.5rem 0 0.5rem" }}>
      <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label htmlFor="round-filter-select" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
          Filtrar por rodada:
        </label>
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
            value={selectedRoundId ? String(selectedRoundId) : ""}
            onChange={(event) => {
              const value = event.target.value;
              onRoundChange(value ? Number(value) : 0);
            }}
            options={[
              { value: "", label: "Todas as rodadas" },
              ...rounds.map((round) => ({
                value: String(round.id),
                label: `${round.name} (${format(parse(round.round_date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")})`,
              })),
            ]}
          />
          <p style={{ fontSize: "0.75rem", color: "#737373" }}>
            {selectedRoundId
              ? `Exibindo ${existingPlayers.length} jogadores da rodada selecionada.`
              : "Selecione uma rodada para filtrar os jogadores."}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoundFilterSection;
