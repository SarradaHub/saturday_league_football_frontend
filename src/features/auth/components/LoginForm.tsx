import { useState, FormEvent, ChangeEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoginCredentials } from "../types";
import { Input, Button, Alert } from "@platform/design-system";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!credentials.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = "Email inválido";
    }

    if (!credentials.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (credentials.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    try {
      await login(credentials, "devise");
      onSuccess?.();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Erro ao fazer login. Verifique suas credenciais.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {errors.general && <Alert variant="error">{errors.general}</Alert>}

      <div>
        <Input
          name="email"
          type="email"
          label="Email"
          value={credentials.email}
          onChange={handleChange}
          placeholder="seu@email.com"
          required
          error={errors.email}
          disabled={isLoading}
        />
      </div>

      <div>
        <Input
          name="password"
          type="password"
          label="Senha"
          value={credentials.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
          error={errors.password}
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading}
        loading={isLoading}
        style={{ width: "100%" }}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};

export default LoginForm;
