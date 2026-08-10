import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comprobante, EstadoComprobante } from '../models/comprobante.model';

interface ComprobanteApi {
  id: number;
  key: string;
  estado: EstadoComprobante;
  fechaCarga: string;
  fechaRevision?: string;
  cuota: {
    mes: number;
    anio: number;
    alumno: { id: number; nombre: string; apellido: string; clase?: { id: number } };
  };
  revisadoPor?: { id: number; email: string };
}

export interface FiltrosComprobantes {
  alumnoId?: number;
  claseId?: number;
  estado?: EstadoComprobante;
  mes?: number;
  anio?: number;
}

@Injectable({ providedIn: 'root' })
export class ComprobantesService {
  private readonly baseUrl = `${environment.apiUrl}/comprobantes`;

  constructor(private http: HttpClient) {}

  listarTodos(filtros: FiltrosComprobantes = {}): Observable<Comprobante[]> {
    const params: Record<string, string | number> = {};
    if (filtros.alumnoId) params['alumnoId'] = filtros.alumnoId;
    if (filtros.claseId) params['claseId'] = filtros.claseId;
    if (filtros.estado) params['estado'] = filtros.estado;
    if (filtros.mes) params['mes'] = filtros.mes;
    if (filtros.anio) params['anio'] = filtros.anio;

    return this.http
      .get<ComprobanteApi[]>(this.baseUrl, { params })
      .pipe(map((comprobantes) => comprobantes.map((c) => this.mapear(c))));
  }

  /**
   * `window.open` se llama ya mismo (mismo tick del click, antes del request)
   * y recién se navega la pestaña cuando llega la URL — llamarlo adentro del
   * `subscribe` pierde el "gesto de usuario" y los navegadores móviles lo
   * bloquean como popup no solicitado.
   */
  verComprobante(id: number): void {
    const ventana = window.open('', '_blank');
    this.http.get<{ url: string }>(`${this.baseUrl}/${id}/descargar`).subscribe({
      next: ({ url }) => {
        if (ventana) ventana.location.href = url;
      },
      error: () => ventana?.close(),
    });
  }

  private mapear(c: ComprobanteApi): Comprobante {
    return {
      id: c.id,
      key: c.key,
      estado: c.estado,
      fechaCarga: new Date(c.fechaCarga),
      fechaRevision: c.fechaRevision ? new Date(c.fechaRevision) : undefined,
      alumno: c.cuota.alumno,
      claseId: c.cuota.alumno.clase?.id,
      mes: c.cuota.mes,
      anio: c.cuota.anio,
      revisadoPor: c.revisadoPor,
    };
  }
}
