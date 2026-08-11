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
  alumnos: number;
  admins: number;
  ultimoAcceso: string | null;
  totalCobrado: number;
  cuotasPendientes: number;
}

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private readonly baseUrl = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient) {}

  listarNegocios(): Observable<NegocioResumen[]> {
    return this.http.get<NegocioResumenApi[]>(`${this.baseUrl}/negocios`).pipe(
      map((negocios) =>
        negocios.map((n) => ({
          ...n,
          fechaAlta: n.fechaAlta ? new Date(n.fechaAlta) : null,
          ultimoAcceso: n.ultimoAcceso ? new Date(n.ultimoAcceso) : null,
        })),
      ),
    );
  }
}
