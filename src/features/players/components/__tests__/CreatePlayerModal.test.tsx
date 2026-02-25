import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

vi.mock("@sarradahub/design-system", () => ({
  Modal: ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog" aria-modal="true">
        {title && <h2>{title}</h2>}
        <button onClick={onClose} aria-label="Close modal">×</button>
        {children}
      </div>
    );
  },
  Button: ({ children, disabled, loading, type, form, onClick, "aria-label": ariaLabel }: { children: ReactNode; disabled?: boolean; loading?: boolean; type?: string; form?: string; onClick?: () => void; "aria-label"?: string }) => (
    <button type={type as "button" | "submit" | "reset"} form={form} disabled={disabled || loading} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  Alert: ({ children }: { children: ReactNode }) => <div role="alert">{children}</div>,
  Checkbox: ({ children, checked, onChange, ...rest }: { children?: ReactNode; checked?: boolean; onChange?: (e: { target: { checked: boolean } }) => void; [key: string]: unknown }) => (
    <label>
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.({ target: { checked: e.target.checked } })} {...rest} />
      {children}
    </label>
  ),
  Input: (props: Record<string, unknown>) => <input {...props} />,
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

  const roundIdFromRoute = props.selectedRoundId ?? 42;
  const user = userEvent.setup();
  const renderResult = render(
    <MemoryRouter initialEntries={[`/rounds/${roundIdFromRoute}`]}>
      <Routes>
        <Route path="/rounds/:id" element={<CreatePlayerModal {...props} />} />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(mockList).toHaveBeenCalledWith(
      props.championshipId,
      expect.any(Object),
    ),
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
        first_name: "Novo",
        last_name: "Jogador",
        championship_id: championshipId,
        player_rounds_attributes: [{ round_id: roundId }],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(props.onExistingPlayerAdded).not.toHaveBeenCalled();
  });

  it("keeps submit disabled when only whitespace is in the input", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const { user } = await renderModal({ onCreate });

    const input = screen.getByPlaceholderText(
      "Busque jogadores ou crie um novo",
    );
    await user.type(input, "   ");

    const submitButton = screen.getByRole("button", { name: "Criar Jogador" });
    expect(submitButton).toBeDisabled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("calls onExistingPlayerAdded after adding an existing player to a round", async () => {
    const existingPlayer: Player = {
      id: 5,
      display_name: "João da Silva",
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
      name: existingPlayer.display_name,
    });
    await user.click(option);

    const submitButton = screen.getByRole("button", {
      name: "Adicionar ao Round",
    });
    await user.click(submitButton);

    await waitFor(() =>
      expect(mockAddToRound).toHaveBeenCalledWith(
        existingPlayer.id,
        42,
        false,
      ),
    );
    await waitFor(() => expect(onExistingPlayerAdded).toHaveBeenCalled());
    expect(onCreate).not.toHaveBeenCalled();
  });
});
