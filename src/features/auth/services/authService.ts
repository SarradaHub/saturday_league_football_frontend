import authRepository from "../api/authRepository";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { LoginCredentials, User, AuthMethod } from "../types";

class AuthService {
  /**
   * Fazer login usando o método especificado
   */
  async login(
    credentials: LoginCredentials,
    method: AuthMethod = "devise",
  ): Promise<{ user: User; token: string }> {
    let result;

    if (method === "devise") {
      result = await authRepository.loginWithDevise(credentials);
    } else {
      result = await authRepository.loginWithIdentityService(credentials);
    }

    // Salvar token no storage
    if (result.token) {
      tokenStorage.saveToken(result.token, method);
    }

    return result;
  }

  /**
   * Fazer logout
   */
  async logout(): Promise<void> {
    const method = tokenStorage.getAuthMethod();

    // Se for Devise, chamar endpoint de logout
    if (method === "devise") {
      try {
        await authRepository.logout();
      } catch (error) {
        console.warn("Erro ao fazer logout no servidor:", error);
      }
    }

    // Limpar token do storage
    tokenStorage.removeToken();
  }

  /**
   * Verificar se usuário está autenticado
   */
  async checkAuth(): Promise<User | null> {
    const token = tokenStorage.getToken();

    if (!token || !tokenStorage.isValidToken()) {
      return null;
    }

    try {
      const user = await authRepository.getCurrentUser(token);
      return user;
    } catch (error) {
      // Se falhar, limpar token
      tokenStorage.removeToken();
      return null;
    }
  }

  /**
   * Obter token atual
   */
  getToken(): string | null {
    return tokenStorage.getToken();
  }

  /**
   * Obter método de autenticação atual
   */
  getAuthMethod(): AuthMethod | null {
    return tokenStorage.getAuthMethod();
  }

  /**
   * Verificar se há token válido
   */
  hasValidToken(): boolean {
    return tokenStorage.isValidToken();
  }
}

const authService = new AuthService();

export default authService;
