import { Player } from "@/types";
import { FaSearch } from "react-icons/fa";
import { Input } from "@platform/design-system";

interface PlayerSearchInputProps {
  searchTerm: string;
  selectedPlayer: Player | null;
  context: "round" | "team";
  filteredPlayers: Player[];
  onSearchChange: (value: string) => void;
  onSelectPlayer: (player: Player) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const PlayerSearchInput = ({
  searchTerm,
  selectedPlayer,
  context,
  filteredPlayers,
  onSearchChange,
  onSelectPlayer,
  onSubmit,
  isLoading = false,
}: PlayerSearchInputProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    <div style={{ position: "relative" }}>
      <Input
        type="text"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        placeholder={
          selectedPlayer
            ? `Adicionar ${selectedPlayer.name} ao ${context === "team" ? "time" : "round"}`
            : "Busque jogadores ou crie um novo"
        }
        style={{ paddingLeft: "2.5rem", paddingRight: isLoading ? "6rem" : "1rem" }}
      />
      <FaSearch style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#a3a3a3", pointerEvents: "none" }} aria-hidden />
      {isLoading && (
        <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.875rem", color: "#737373" }}>
          Carregando...
        </span>
      )}
    </div>
    {!selectedPlayer && searchTerm && (
      <div
        role="listbox"
        style={{ maxHeight: "15rem", overflowY: "auto", borderRadius: "0.5rem", border: "1px solid #e5e5e5", backgroundColor: "#fafafa", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onSelectPlayer(player)}
              style={{ width: "100%", borderBottom: "1px solid #e5e5e5", padding: "0.5rem 0.75rem", textAlign: "left", fontSize: "0.875rem", transition: "background-color 0.2s", backgroundColor: "transparent", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fafafa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {player.name}
            </button>
          ))
        ) : (
          <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: "#737373" }}>
            {isLoading
              ? "Carregando jogadores..."
              : "Nenhum jogador encontrado"}
          </div>
        )}
      </div>
    )}
  </div>
);

export default PlayerSearchInput;
