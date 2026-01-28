import axios, { AxiosInstance } from "axios";
import { ApiConfigAdapter } from "@/shared/api/baseService";
import { LoginCredentials, User, AuthResponse } from "../types";

class AuthRepository {
  private readonly api: AxiosInstance;
  private readonly identityServiceApi: AxiosInstance;

  constructor() {
    const config = ApiConfigAdapter.getInstance();
    const baseURL = config.getBaseURL();

    // API do backend (Devise)
    this.api = axios.create({
      baseURL: `${baseURL}/users`,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // API do IdentityService (se necessário)
    const identityServiceURL = import.meta.env.VITE_IDENTITY_SERVICE_URL || "";
    this.identityServiceApi = axios.create({
      baseURL: identityServiceURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Login usando Devise (autenticação direta no backend)
   */
  async loginWithDevise(
    credentials: LoginCredentials,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await this.api.post<{
        success: boolean;
        user: User;
        token: string;
        message?: string;
      }>("/sign_in", {
        user: credentials,
      });

      // Verificar se a resposta foi bem-sucedida
      if (response.data.success && response.data.user && response.data.token) {
        return {
          user: response.data.user,
          token: response.data.token,
        };
      }

      throw new Error(response.data.message || "Erro ao fazer login");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Erro ao fazer login";
        throw new Error(errorMessage);
      }
      throw new Error("Erro desconhecido ao fazer login");
    }
  }

  /**
   * Login usando IdentityService
   */
  async loginWithIdentityService(
    credentials: LoginCredentials,
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await this.identityServiceApi.post<AuthResponse>(
        "/api/v1/auth/login",
        credentials,
      );

      return {
        user: response.data.user,
        token: response.data.token,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao fazer login no IdentityService",
        );
      }
      throw new Error("Erro desconhecido ao fazer login");
    }
  }

  /**
   * Logout usando Devise
   */
  async logout(): Promise<void> {
    try {
      await this.api.delete("/sign_out");
    } catch (error) {
      // Não lançar erro se já estiver deslogado
      console.warn("Erro ao fazer logout:", error);
    }
  }

  /**
   * Validar token com o backend
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const config = ApiConfigAdapter.getInstance();
      const baseURL = config.getBaseURL();

      const response = await axios.get<{ user: User }>(
        `${baseURL}/api/v1/auth/validate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obter usuário atual (usando token armazenado)
   */
  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const config = ApiConfigAdapter.getInstance();
      const baseURL = config.getBaseURL();

      const response = await axios.get<{ user: User }>(
        `${baseURL}/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.user;
    } catch (error) {
      // Se não houver endpoint /me, tentar validar o token
      return this.validateToken(token);
    }
  }

}

const authRepository = new AuthRepository();

export default authRepository;
