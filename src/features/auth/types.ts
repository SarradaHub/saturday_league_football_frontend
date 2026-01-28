export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  external_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type AuthMethod = 'identity_service' | 'devise';
