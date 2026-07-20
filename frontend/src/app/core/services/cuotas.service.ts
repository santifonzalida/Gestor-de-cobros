import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { CUOTAS_MOCK } from '../mock-data/cuotas.mock';
import { EstadoPago } from '../models/alumno.model';
import { Cuota, EstadoCuota } from '../models/cuota.model';

const DIAS_PROXIMO_VENCIMIENTO = 7;

@Injectable({ providedIn: 'root' })
export class CuotasService {
  private readonly cuotas = signal<Cuota[]>([...CUOTAS_MOCK]);

  private porAlumnoOrdenadas(alumnoId: number): Cuota[] {
    return this.cuotas()
      .filter((c) => c.alumnoId === alumnoId)
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  }

  listarPorAlumno(alumnoId: number): Observable<Cuota[]> {
    return of(this.porAlumnoOrdenadas(alumnoId)).pipe(delay(150));
  }

  obtenerCuotaActual(alumnoId: number): Cuota | undefined {
    return this.porAlumnoOrdenadas(alumnoId)[0];
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
    return of(this.cuotas().filter((c) => c.estado === EstadoCuota.EN_REVISION)).pipe(delay(150));
  }

  marcarEnRevision(cuotaId: number): void {
    this.cuotas.update((lista) =>
      lista.map((c) => (c.id === cuotaId ? { ...c, estado: EstadoCuota.EN_REVISION } : c)),
    );
  }
}
