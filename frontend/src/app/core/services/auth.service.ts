import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, UsuarioSesion } from '../models/auth.model';

const TOKEN_KEY = 'gestorCobros.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly usuario = computed<UsuarioSesion | null>(() => {
    const token = this.token();
    return token ? this.decodificarPayload(token) : null;
  });

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((respuesta) => this.guardarToken(respuesta.accessToken)));
  }

  completarInvitacion(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/completar-invitacion`, {
      token,
      password,
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  obtenerToken(): string | null {
    return this.token();
  }

  estaLogueado(): boolean {
    return this.token() !== null;
  }

  private guardarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private decodificarPayload(token: string): UsuarioSesion | null {
    try {
      const [, payload] = token.split('.');
      return JSON.parse(atob(payload)) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
