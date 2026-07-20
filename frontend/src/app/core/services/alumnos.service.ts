import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ALUMNOS_MOCK } from '../mock-data/alumnos.mock';
import { CLASES_MOCK } from '../mock-data/clases.mock';
import { AlumnoConEstado } from '../models/alumno.model';
import { Clase } from '../models/clase.model';
import { CuotasService } from './cuotas.service';

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  constructor(private cuotasService: CuotasService) {}

  private construirAlumnosConEstado(): AlumnoConEstado[] {
    return ALUMNOS_MOCK.map((alumno) => {
      const clase = CLASES_MOCK.find((c) => c.id === alumno.claseId)!;
      const cuotaActual = this.cuotasService.obtenerCuotaActual(alumno.id);
      return {
        ...alumno,
        clase,
        cuotaActual,
        estadoPago: this.cuotasService.calcularEstadoPago(cuotaActual),
      };
    });
  }

  listar(): Observable<AlumnoConEstado[]> {
    return of(this.construirAlumnosConEstado()).pipe(delay(150));
  }

  obtenerPorId(id: number): Observable<AlumnoConEstado | undefined> {
    return of(this.construirAlumnosConEstado().find((a) => a.id === id)).pipe(delay(150));
  }

  listarClases(): Observable<Clase[]> {
    return of(CLASES_MOCK).pipe(delay(50));
  }
}
