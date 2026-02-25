import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Navbar as DsNavbar } from "@sarradahub/design-system";
import { useAuth } from "@/features/auth/hooks/useAuth";

const navigationLinks = [{ to: "/championships", label: "Peladas" }];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsOpen((previous) => !previous);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
    closeMenu();
  };

  const navigationItems = useMemo(() => {
    if (!isAuthenticated) {
      return [
        {
          label: "Entrar",
          onClick: () => {
            navigate("/login");
            closeMenu();
          },
          active: location.pathname.startsWith("/login"),
        },
      ];
    }

    return navigationLinks.map((link) => ({
      label: link.label,
      onClick: () => {
        navigate(link.to);
        closeMenu();
      },
      active: location.pathname.startsWith(link.to),
    }));
  }, [closeMenu, isAuthenticated, location.pathname, navigate]);

  const rightContent = isAuthenticated ? (
    <>
      <span>{user?.email}</span>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </>
  ) : null;

  const mobileFooter = isAuthenticated ? (
    <div>
      <div>{user?.email}</div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  ) : null;

  return (
    <DsNavbar
      brand={<Link to="/">Pelada Insights</Link>}
      items={navigationItems}
      mobileMenuOpen={isOpen}
      onMobileMenuToggle={toggleMenu}
      rightContent={rightContent}
      mobileFooter={mobileFooter}
      variant="translucent"
      position="static"
    />
  );
};

export default Navbar;
