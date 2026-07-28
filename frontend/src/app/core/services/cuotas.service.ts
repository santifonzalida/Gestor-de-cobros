import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPago } from '../models/alumno.model';
import { Cuota, EstadoCuota } from '../models/cuota.model';

const DIAS_PROXIMO_VENCIMIENTO = 7;

interface CuotaApi {
  id: number;
  alumno: { id: number };
  mes: number;
  anio: number;
  monto: number;
  estado: EstadoCuota;
  fechaVencimiento: string;
}

interface CuotaApiConAlumno extends CuotaApi {
  alumno: { id: number; nombre: string; apellido: string };
}

export interface CuotaConAlumno extends Cuota {
  alumno: { id: number; nombre: string; apellido: string };
}

export interface CuotaForm {
  alumnoId: number;
  mes: number;
  anio: number;
  monto: number;
  fechaVencimiento: string;
  estado?: EstadoCuota;
}

export interface FiltrosCuotas {
  alumnoId?: number;
  claseId?: number;
  estado?: EstadoCuota;
  mes?: number;
  anio?: number;
}

export interface CuotaPorClaseForm {
  claseId: number;
  mes: number;
  anio: number;
  monto: number;
  fechaVencimiento: string;
}

export interface ResultadoAltaPorClase {
  creadas: number;
  omitidas: number;
}

@Injectable({ providedIn: 'root' })
export class CuotasService {
  private readonly baseUrl = `${environment.apiUrl}/cuotas`;

  /**
   * El flujo de "comprobante en revisión" (subir comprobante → EN_REVISION) no
   * existe en el backend todavía: se dejó fuera de alcance al construir el CRUD
   * de Pagos. Se mantiene mockeado en memoria acá para no romper esas pantallas.
   */
  private cuotasEnRevision: number[] = [];

  constructor(private http: HttpClient) {}

  listarPorAlumno(alumnoId: number): Observable<Cuota[]> {
    return this.http.get<CuotaApi[]>(this.baseUrl, { params: { alumnoId } }).pipe(
      map((cuotas) =>
        cuotas
          .map((c) => this.mapear(c))
          .sort((a, b) => b.anio - a.anio || b.mes - a.mes),
      ),
    );
  }

  listarTodos(filtros: FiltrosCuotas = {}): Observable<CuotaConAlumno[]> {
    const params: Record<string, string | number> = {};
    if (filtros.alumnoId) params['alumnoId'] = filtros.alumnoId;
    if (filtros.claseId) params['claseId'] = filtros.claseId;
    if (filtros.estado) params['estado'] = filtros.estado;
    if (filtros.mes) params['mes'] = filtros.mes;
    if (filtros.anio) params['anio'] = filtros.anio;

    return this.http
      .get<CuotaApiConAlumno[]>(this.baseUrl, { params })
      .pipe(map((cuotas) => cuotas.map((c) => ({ ...this.mapear(c), alumno: c.alumno }))));
  }

  crear(dto: CuotaForm): Observable<Cuota> {
    return this.http.post<CuotaApi>(this.baseUrl, dto).pipe(map((c) => this.mapear(c)));
  }

  crearPorClase(dto: CuotaPorClaseForm): Observable<ResultadoAltaPorClase> {
    return this.http.post<ResultadoAltaPorClase>(`${this.baseUrl}/por-clase`, dto);
  }

  actualizar(id: number, dto: Partial<CuotaForm>): Observable<Cuota> {
    return this.http.patch<CuotaApi>(`${this.baseUrl}/${id}`, dto).pipe(map((c) => this.mapear(c)));
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  calcularEstadoPago(cuota: Cuota | undefined): EstadoPago {
    if (!cuota) return 'al_dia';
    if (cuota.estado === EstadoCuota.VENCIDA) return 'adeuda';
    if (cuota.estado === EstadoCuota.PAGADA || cuota.estado === EstadoCuota.EN_REVISION) {
      return 'al_dia';
    }
    const dias = Math.ceil((cuota.fechaVencimiento.getTime() - Date.now()) / 86_400_000);
    return dias <= DIAS_PROXIMO_VENCIMIENTO ? 'proximo' : 'al_dia';
  }

  listarEnRevision(): Observable<Cuota[]> {
    return this.http
      .get<CuotaApi[]>(this.baseUrl)
      .pipe(
        map((cuotas) =>
          cuotas.map((c) => this.mapear(c)).filter((c) => this.cuotasEnRevision.includes(c.id)),
        ),
      );
  }

  marcarEnRevision(cuotaId: number): void {
    if (!this.cuotasEnRevision.includes(cuotaId)) {
      this.cuotasEnRevision = [...this.cuotasEnRevision, cuotaId];
    }
  }

  private mapear(c: CuotaApi): Cuota {
    return {
      id: c.id,
      alumnoId: c.alumno.id,
      mes: c.mes,
      anio: c.anio,
      monto: c.monto,
      estado: this.cuotasEnRevision.includes(c.id) ? EstadoCuota.EN_REVISION : c.estado,
      fechaVencimiento: new Date(c.fechaVencimiento),
    };
  }
}
