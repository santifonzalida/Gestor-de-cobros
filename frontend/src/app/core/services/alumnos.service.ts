import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlumnoConEstado, EstadoPago } from '../models/alumno.model';
import { Clase } from '../models/clase.model';
import { Cuota, EstadoCuota } from '../models/cuota.model';

interface CuotaResumenApi {
  id: number;
  mes: number;
  anio: number;
  monto: number;
  estado: EstadoCuota;
  fechaVencimiento: string;
  comprobanteUrl?: string;
}

interface AlumnoApi {
  id: number;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaAlta: string;
  activo: boolean;
  clase?: Clase;
  usuario?: { id: number };
  cuotaActual?: CuotaResumenApi;
  estadoPago: EstadoPago;
}

export interface NuevoAlumno {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  claseId?: number;
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly baseUrl = `${environment.apiUrl}/alumnos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<AlumnoConEstado[]> {
    return this.http.get<AlumnoApi[]>(this.baseUrl).pipe(map((alumnos) => alumnos.map((a) => this.mapear(a))));
  }

  obtenerPorId(id: number): Observable<AlumnoConEstado> {
    return this.http.get<AlumnoApi>(`${this.baseUrl}/${id}`).pipe(map((a) => this.mapear(a)));
  }

  crear(nuevoAlumno: NuevoAlumno): Observable<AlumnoConEstado> {
    return this.http.post<AlumnoApi>(this.baseUrl, nuevoAlumno).pipe(map((a) => this.mapear(a)));
  }

  invitar(alumnoId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/invitar-alumno`, { alumnoId });
  }

  actualizar(id: number, cambios: Partial<NuevoAlumno>): Observable<AlumnoConEstado> {
    return this.http.patch<AlumnoApi>(`${this.baseUrl}/${id}`, cambios).pipe(map((a) => this.mapear(a)));
  }

  cambiarEstado(id: number, activo: boolean): Observable<AlumnoConEstado> {
    return this.http.patch<AlumnoApi>(`${this.baseUrl}/${id}`, { activo }).pipe(map((a) => this.mapear(a)));
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  private mapear(alumno: AlumnoApi): AlumnoConEstado {
    return {
      ...alumno,
      fechaAlta: new Date(alumno.fechaAlta),
      cuotaActual: alumno.cuotaActual ? this.mapearCuota(alumno.cuotaActual, alumno.id) : undefined,
    };
  }

  private mapearCuota(cuota: CuotaResumenApi, alumnoId: number): Cuota {
    return {
      id: cuota.id,
      alumnoId,
      mes: cuota.mes,
      anio: cuota.anio,
      monto: cuota.monto,
      estado: cuota.estado,
      fechaVencimiento: new Date(cuota.fechaVencimiento),
      comprobanteUrl: cuota.comprobanteUrl,
    };
  }
}
