export interface RolSesion {
  id: number;
  name: string;
}

export interface UsuarioSesion {
  sub: number;
  email: string;
  negocioId: number;
  roles: RolSesion[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
}
