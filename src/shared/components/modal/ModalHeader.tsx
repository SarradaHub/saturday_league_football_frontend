import CloseIcon from "@mui/icons-material/Close";
import { Player } from "@/types";

interface ModalHeaderProps {
  context: "round" | "team";
  selectedPlayer: Player | null;
  onClose: () => void;
}

const ModalHeader = ({
  context,
  selectedPlayer,
  onClose,
}: ModalHeaderProps) => (
  <div className="flex items-center justify-between border-b p-6">
    <h3 className="text-2xl font-bold text-neutral-900">
      {selectedPlayer
        ? `Adicionar Jogador ao ${context === "team" ? "Time" : "Round"}`
        : `Criar Jogador para ${context === "team" ? "Time" : "Round"}`}
    </h3>
    <button
      type="button"
      onClick={onClose}
      className="rounded-full p-1 transition-colors hover:bg-neutral-100"
      aria-label="Fechar modal"
    >
      <CloseIcon className="h-6 w-6 text-neutral-500" />
    </button>
  </div>
);

export default ModalHeader;
