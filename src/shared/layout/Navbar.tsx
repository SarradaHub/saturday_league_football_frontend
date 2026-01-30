import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import Container from "@/shared/components/layout/Container";

const navigationLinks = [{ to: "/championships", label: "Peladas" }];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((previous) => !previous);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur font-sans">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12 flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex-shrink-0 text-2xl font-bold text-primary-600"
            >
              Pelada Insights
            </Link>
            <div className="hidden items-center gap-8 md:flex" role="menubar">
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      "font-medium transition-colors duration-300 relative",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-blue-600",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      <span
                        className={[
                          "absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-blue-600 transition-transform duration-300",
                          isActive ? "scale-x-100" : "group-hover:scale-x-100",
                        ].join(" ")}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleMenu}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </Container>
      <div className={`md:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="space-y-2 border-t bg-white px-4 pb-4 pt-2">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-4 py-2 transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-blue-50",
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
