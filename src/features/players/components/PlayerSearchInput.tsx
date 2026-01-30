import { Player } from "@/types";
import { FaSearch } from "react-icons/fa";

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
  <div className="space-y-4">
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSubmit()}
        placeholder={
          selectedPlayer
            ? `Adicionar ${selectedPlayer.name} ao ${context === "team" ? "time" : "round"}`
            : "Busque jogadores ou crie um novo"
        }
        className="w-full rounded-lg border px-4 py-3 pl-10 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
      <FaSearch className="absolute left-3 top-3.5 text-gray-400" aria-hidden />
      {isLoading && (
        <span className="absolute right-3 top-3.5 text-sm text-gray-500">
          Carregando...
        </span>
      )}
    </div>
    {!selectedPlayer && searchTerm && (
      <div
        role="listbox"
        className="max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg"
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onSelectPlayer(player)}
              className="w-full border-b px-3 py-2 text-left text-sm transition hover:bg-gray-50"
            >
              {player.name}
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500">
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
