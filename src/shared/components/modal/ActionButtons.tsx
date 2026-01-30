import { Player } from "@/types";

interface ActionButtonsProps {
  isSubmitting: boolean;
  searchTerm: string;
  selectedPlayer: Player | null;
  context: "round" | "team";
  onClose: () => void;
  onSubmit: () => void;
}

const ActionButtons = ({
  isSubmitting,
  searchTerm,
  selectedPlayer,
  context,
  onClose,
  onSubmit,
}: ActionButtonsProps) => (
  <div className="mt-8 flex justify-end gap-3">
    <button
      type="button"
      onClick={onClose}
      className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
      disabled={isSubmitting}
    >
      Cancelar
    </button>
    <button
      type="button"
      onClick={onSubmit}
      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      disabled={isSubmitting || (!searchTerm && !selectedPlayer)}
    >
      {isSubmitting
        ? selectedPlayer
          ? "Adicionando..."
          : "Criando..."
        : selectedPlayer
          ? `Adicionar ao ${context === "team" ? "Time" : "Round"}`
          : "Criar Jogador"}
    </button>
  </div>
);

export default ActionButtons;
