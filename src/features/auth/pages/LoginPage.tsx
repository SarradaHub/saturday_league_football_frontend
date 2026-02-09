import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, CardContent, LoadingSpinner } from "@platform/design-system";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/championships", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <LoadingSpinner size="md" text="Verificando autenticação..." />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleLoginSuccess = () => {
    const from = new URLSearchParams(window.location.search).get("from") || "/championships";
    navigate(from, { replace: true });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", padding: "3rem 1rem" }}>
      <Container>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#171717" }}>Pelada Insights</h2>
            <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#737373" }}>
              Faça login para acessar sua conta
            </p>
          </div>

          <Card variant="elevated" padding="lg">
            <CardContent>
              <LoginForm onSuccess={handleLoginSuccess} />
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;
