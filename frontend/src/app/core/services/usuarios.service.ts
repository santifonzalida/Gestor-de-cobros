import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Perfil {
  nombre: string | null;
  apellido: string | null;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/mi-perfil`);
  }

  actualizarPerfil(nombre: string, apellido: string): Observable<{ nombre: string; apellido: string }> {
    return this.http.patch<{ nombre: string; apellido: string }>(`${this.baseUrl}/mi-perfil`, { nombre, apellido });
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/mi-password`, { passwordActual, passwordNueva });
  }
}
