import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import Navbar from "@/shared/layout/Navbar";

vi.mock("@/features/auth/services/authService", () => ({
  default: {
    checkAuth: vi.fn().mockResolvedValue(null),
    getAuthMethod: vi.fn().mockReturnValue(null),
  },
}));

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </BrowserRouter>,
  );

describe("Navbar", () => {
  it("renders the brand name", () => {
    renderNavbar();
    expect(screen.getByText(/pelada insights/i)).toBeInTheDocument();
  });

  it("provides navigation when not authenticated", () => {
    renderNavbar();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("provides Peladas navigation when authenticated", async () => {
    const authService = (
      await import("@/features/auth/services/authService")
    ).default;
    vi.mocked(authService.checkAuth).mockResolvedValueOnce({
      id: 1,
      email: "user@example.com",
      is_admin: false,
    });
    renderNavbar();
    expect(
      await screen.findByRole("button", { name: /peladas/i }),
    ).toBeInTheDocument();
  });
});
