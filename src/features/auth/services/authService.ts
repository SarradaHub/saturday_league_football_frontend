import authRepository from "../api/authRepository";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { LoginCredentials, User, AuthMethod } from "../types";

class AuthService {
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

    if (result.token) {
      tokenStorage.saveToken(result.token, method);
    }

    return result;
  }

  async logout(): Promise<void> {
    const method = tokenStorage.getAuthMethod();

    if (method === "devise") {
      try {
        await authRepository.logout();
      } catch (error) {
        console.warn("Erro ao fazer logout no servidor:", error);
      }
    }

    tokenStorage.removeToken();
  }

  async checkAuth(): Promise<User | null> {
    const token = tokenStorage.getToken();

    if (!token || !tokenStorage.isValidToken()) {
      return null;
    }

    try {
      const user = await authRepository.getCurrentUser(token);
      return user;
    } catch {
      tokenStorage.removeToken();
      return null;
    }
  }

  getToken(): string | null {
    return tokenStorage.getToken();
  }

  getAuthMethod(): AuthMethod | null {
    return tokenStorage.getAuthMethod();
  }

  hasValidToken(): boolean {
    return tokenStorage.isValidToken();
  }
}

const authService = new AuthService();

export default authService;
