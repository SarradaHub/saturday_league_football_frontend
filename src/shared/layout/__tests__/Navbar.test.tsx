import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "@/shared/layout/Navbar";

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>,
  );

describe("Navbar", () => {
  it("renders the brand name", () => {
    renderNavbar();
    expect(screen.getByText(/pelada insights/i)).toBeInTheDocument();
  });

  it("provides navigation links", () => {
    renderNavbar();
    const peladasLinks = screen.getAllByRole("link", { name: /peladas/i });
    expect(
      peladasLinks.some(
        (link) => link.getAttribute("href") === "/championships",
      ),
    ).toBe(true);
  });
});
