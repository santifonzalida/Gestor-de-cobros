import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstadoPago } from '../models/alumno.model';
import { Cuota, EstadoCuota } from '../models/cuota.model';
import { MetodoPago } from '../models/pago.model';

const DIAS_PROXIMO_VENCIMIENTO = 7;

interface CuotaApi {
  id: number;
  alumno: { id: number };
  mes: number;
  anio: number;
  monto: number;
  estado: EstadoCuota;
  fechaVencimiento: string;
  comprobanteUrl?: string;
}

export interface AprobarComprobanteForm {
  metodo: MetodoPago;
  montoPagado?: number;
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

  listarEnRevision(): Observable<CuotaConAlumno[]> {
    return this.listarTodos({ estado: EstadoCuota.EN_REVISION });
  }

  /**
   * Orquesta la subida real del comprobante: pide una URL prefirmada, sube el
   * archivo directo al bucket y confirma. El PUT al bucket usa `fetch()` nativo
   * en vez de `HttpClient` a propósito: el interceptor de auth le suma el Bearer
   * de la app a cualquier request de HttpClient sin filtrar por URL, y eso
   * rompería la firma de la URL prefirmada si viajara en ese PUT.
   */
  subirComprobante(cuotaId: number, archivo: File): Observable<Cuota> {
    return this.http
      .post<{ url: string; key: string }>(`${this.baseUrl}/${cuotaId}/comprobante/solicitar-subida`, {
        nombreArchivo: archivo.name,
        contentType: archivo.type,
      })
      .pipe(
        switchMap(({ url, key }) =>
          from(fetch(url, { method: 'PUT', headers: { 'Content-Type': archivo.type }, body: archivo })).pipe(
            map((respuesta) => {
              if (!respuesta.ok) throw new Error('No se pudo subir el archivo al almacenamiento.');
              return key;
            }),
          ),
        ),
        switchMap((key) =>
          this.http.post<CuotaApi>(`${this.baseUrl}/${cuotaId}/comprobante/confirmar`, { key }),
        ),
        map((c) => this.mapear(c)),
      );
  }

  verComprobante(cuotaId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.baseUrl}/${cuotaId}/comprobante`);
  }

  /**
   * El backend devuelve el `Pago` recién creado (no la `Cuota`) — quien llame
   * a esto tiene que volver a pedir la cuota/alumno para reflejar el PAGADA.
   */
  aprobarComprobante(cuotaId: number, dto: AprobarComprobanteForm): Observable<void> {
    return this.http
      .patch(`${this.baseUrl}/${cuotaId}/comprobante/aprobar`, dto)
      .pipe(map(() => undefined));
  }

  rechazarComprobante(cuotaId: number): Observable<Cuota> {
    return this.http
      .patch<CuotaApi>(`${this.baseUrl}/${cuotaId}/comprobante/rechazar`, {})
      .pipe(map((c) => this.mapear(c)));
  }

  private mapear(c: CuotaApi): Cuota {
    return {
      id: c.id,
      alumnoId: c.alumno.id,
      mes: c.mes,
      anio: c.anio,
      monto: c.monto,
      estado: c.estado,
      fechaVencimiento: new Date(c.fechaVencimiento),
      comprobanteUrl: c.comprobanteUrl,
    };
  }
}
