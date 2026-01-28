import { createContext, ReactNode, useState, useEffect, useCallback } from "react";
import { User, LoginCredentials, AuthMethod } from "../types";
import authService from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMethod: AuthMethod | null;
  login: (credentials: LoginCredentials, method?: AuthMethod) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.checkAuth();
      if (currentUser) {
        setUser(currentUser);
        setAuthMethod(authService.getAuthMethod());
      } else {
        setUser(null);
        setAuthMethod(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setUser(null);
      setAuthMethod(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials, method: AuthMethod = "devise") => {
      setIsLoading(true);
      try {
        const result = await authService.login(credentials, method);
        setUser(result.user);
        setAuthMethod(method);
      } catch (error) {
        console.error("Erro ao fazer login:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setAuthMethod(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authMethod,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
