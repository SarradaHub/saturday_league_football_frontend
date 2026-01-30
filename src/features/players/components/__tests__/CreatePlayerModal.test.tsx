import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { Player } from "@/types";

const { mockList, mockAddToRound, mockAddToTeam } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockAddToRound: vi.fn(),
  mockAddToTeam: vi.fn(),
}));

type MockMotionDivProps = Record<string, unknown> & { children?: ReactNode };

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...rest }: MockMotionDivProps) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

vi.mock("@/features/players/api/playerRepository", () => ({
  default: {
    list: mockList,
    addToRound: mockAddToRound,
    addToTeam: mockAddToTeam,
  },
}));

vi.mock("@/shared/components/modal/BaseModal", () => ({
  default: ({ isOpen, onClose, title, children, submitLabel, formId, submitDisabled, isSubmitting }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; submitLabel?: string; formId?: string; submitDisabled?: boolean; isSubmitting?: boolean }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog" aria-modal="true">
        {title && <h2>{title}</h2>}
        <button onClick={onClose} aria-label="Close modal">×</button>
        {children}
        <div>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" form={formId} disabled={submitDisabled || isSubmitting} aria-label={submitLabel}>
            {submitLabel || "Submit"}
          </button>
        </div>
      </div>
    );
  },
}));

import CreatePlayerModal from "../CreatePlayerModal";

const renderModal = async (
  overrides: Partial<Parameters<typeof CreatePlayerModal>[0]> = {},
) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    championshipId: 1,
    currentPlayers: [],
    context: "round" as const,
    rounds: [],
    playersFromRound: [],
    selectedRoundId: 42,
    onRoundChange: vi.fn(),
    onExistingPlayerAdded: vi.fn(),
    ...overrides,
  };

  const user = userEvent.setup();
  const renderResult = render(<CreatePlayerModal {...props} />);
  await waitFor(() =>
    expect(mockList).toHaveBeenCalledWith(props.championshipId),
  );

  return {
    props,
    user,
    ...renderResult,
  };
};

describe("CreatePlayerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
    mockAddToRound.mockResolvedValue(undefined);
    mockAddToTeam.mockResolvedValue(undefined);
  });

  it("trims whitespace before creating a new player", async () => {
    const championshipId = 7;
    const roundId = 99;
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { user, props } = await renderModal({
      championshipId,
      selectedRoundId: roundId,
      onCreate,
      onClose,
    });

    const input = screen.getByPlaceholderText(
      "Busque jogadores ou crie um novo",
    );
    await user.type(input, "   Novo Jogador  ");
    const submitButton = screen.getByRole("button", { name: "Criar Jogador" });
    await user.click(submitButton);

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        name: "Novo Jogador",
        championship_id: championshipId,
        player_rounds_attributes: [{ round_id: roundId }],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(props.onExistingPlayerAdded).not.toHaveBeenCalled();
  });

  it("shows an error when only whitespace is provided", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderModal({ onCreate });

    const input = screen.getByPlaceholderText(
      "Busque jogadores ou crie um novo",
    );
    await user.type(input, "   ");
    await user.type(input, "{enter}");

    expect(onCreate).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Informe um nome válido para o jogador."),
    ).toBeInTheDocument();
  });

  it("calls onExistingPlayerAdded after adding an existing player to a round", async () => {
    const existingPlayer: Player = {
      id: 5,
      name: "João da Silva",
      position: undefined,
      championship_id: 1,
      created_at: "",
      updated_at: "",
      total_goals: 0,
      total_assists: 0,
      total_own_goals: 0,
      rounds: [],
      player_stats: [],
    };

    mockList.mockResolvedValueOnce([existingPlayer]);

    const onExistingPlayerAdded = vi.fn();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderModal({
      onExistingPlayerAdded,
      onCreate,
    });

    const input = screen.getByPlaceholderText(
      "Busque jogadores ou crie um novo",
    );
    await user.type(input, "Jo");

    const option = await screen.findByRole("option", {
      name: existingPlayer.name,
    });
    await user.click(option);

    const submitButton = screen.getByRole("button", {
      name: "Adicionar ao Round",
    });
    await user.click(submitButton);

    await waitFor(() =>
      expect(mockAddToRound).toHaveBeenCalledWith(existingPlayer.id, 42),
    );
    await waitFor(() => expect(onExistingPlayerAdded).toHaveBeenCalled());
    expect(onCreate).not.toHaveBeenCalled();
  });
});
