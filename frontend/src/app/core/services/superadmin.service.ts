import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NegocioResumen } from '../models/negocio-resumen.model';

interface NegocioResumenApi {
  id: number;
  nombre: string;
  activo: boolean;
  fechaAlta: string | null;
  emailAdmin: string | null;
  alumnos: number;
  admins: number;
  ultimoAcceso: string | null;
}

export interface NuevoNegocioForm {
  nombre: string;
  emailAdmin: string;
}

export interface InvitarAdminForm {
  email: string;
  nombre?: string;
  apellido?: string;
}

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private readonly baseUrl = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient) {}

  listarNegocios(): Observable<NegocioResumen[]> {
    return this.http.get<NegocioResumenApi[]>(`${this.baseUrl}/negocios`).pipe(
      map((negocios) => negocios.map((n) => this.mapear(n))),
    );
  }

  crearNegocio(dto: NuevoNegocioForm): Observable<NegocioResumen> {
    return this.http
      .post<NegocioResumenApi>(`${this.baseUrl}/negocios`, dto)
      .pipe(map((n) => this.mapear(n)));
  }

  invitarAdmin(id: number, dto: InvitarAdminForm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/negocios/${id}/invitar-admin`, dto);
  }

  cambiarEstado(id: number, activo: boolean): Observable<{ id: number; activo: boolean }> {
    return this.http.patch<{ id: number; activo: boolean }>(`${this.baseUrl}/negocios/${id}/estado`, { activo });
  }

  private mapear(n: NegocioResumenApi): NegocioResumen {
    return {
      ...n,
      fechaAlta: n.fechaAlta ? new Date(n.fechaAlta) : null,
      ultimoAcceso: n.ultimoAcceso ? new Date(n.ultimoAcceso) : null,
    };
  }
}
