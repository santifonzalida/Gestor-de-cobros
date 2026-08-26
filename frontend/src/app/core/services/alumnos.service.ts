import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlumnoConEstado } from '../models/alumno.model';
import { Clase } from '../models/clase.model';
import { CuotasService } from './cuotas.service';

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

  constructor(
    private http: HttpClient,
    private cuotasService: CuotasService,
  ) {}

  listar(): Observable<AlumnoConEstado[]> {
    return this.http.get<AlumnoApi[]>(this.baseUrl).pipe(switchMap((alumnos) => this.componerConEstado(alumnos)));
  }

  obtenerPorId(id: number): Observable<AlumnoConEstado | undefined> {
    return this.http.get<AlumnoApi>(`${this.baseUrl}/${id}`).pipe(
      switchMap((alumno) => this.componerConEstado([alumno])),
      map((lista) => lista[0]),
    );
  }

  crear(nuevoAlumno: NuevoAlumno): Observable<AlumnoConEstado> {
    return this.http
      .post<AlumnoApi>(this.baseUrl, nuevoAlumno)
      .pipe(switchMap((alumno) => this.componerConEstado([alumno]).pipe(map((lista) => lista[0]))));
  }

  invitar(alumnoId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/invitar-alumno`, { alumnoId });
  }

  actualizar(id: number, cambios: Partial<NuevoAlumno>): Observable<AlumnoConEstado> {
    return this.http
      .patch<AlumnoApi>(`${this.baseUrl}/${id}`, cambios)
      .pipe(switchMap((alumno) => this.componerConEstado([alumno]).pipe(map((lista) => lista[0]))));
  }

  cambiarEstado(id: number, activo: boolean): Observable<AlumnoConEstado> {
    return this.http
      .patch<AlumnoApi>(`${this.baseUrl}/${id}`, { activo })
      .pipe(switchMap((alumno) => this.componerConEstado([alumno]).pipe(map((lista) => lista[0]))));
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  private componerConEstado(alumnos: AlumnoApi[]): Observable<AlumnoConEstado[]> {
    if (alumnos.length === 0) return of([]);

    return forkJoin(
      alumnos.map((alumno) =>
        this.cuotasService.listarPorAlumno(alumno.id).pipe(
          map((cuotas) => {
            const cuotaActual = this.cuotasService.seleccionarCuotaActual(cuotas);
            return {
              ...alumno,
              fechaAlta: new Date(alumno.fechaAlta),
              cuotaActual,
              estadoPago: this.cuotasService.calcularEstadoPago(cuotaActual),
            };
          }),
        ),
      ),
    );
  }
}
