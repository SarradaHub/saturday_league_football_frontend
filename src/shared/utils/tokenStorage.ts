const TOKEN_KEY = 'auth_token';
const AUTH_METHOD_KEY = 'auth_method';

export const tokenStorage = {
  saveToken: (token: string, method: 'identity_service' | 'devise' = 'devise'): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(AUTH_METHOD_KEY, method);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  getAuthMethod: (): 'identity_service' | 'devise' | null => {
    try {
      const method = localStorage.getItem(AUTH_METHOD_KEY);
      return method as 'identity_service' | 'devise' | null;
    } catch (error) {
      console.error('Error getting auth method:', error);
      return null;
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_METHOD_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  hasToken: (): boolean => {
    return tokenStorage.getToken() !== null;
  },

  isValidToken: (): boolean => {
    const token = tokenStorage.getToken();
    if (!token) return false;
    return token.length > 10;
  },
};
