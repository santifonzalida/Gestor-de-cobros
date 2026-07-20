import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { PAGOS_MOCK } from '../mock-data/pagos.mock';
import { Pago } from '../models/pago.model';
import { CuotasService } from './cuotas.service';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly pagos = signal<Pago[]>([...PAGOS_MOCK]);
  private nextId = PAGOS_MOCK.length + 1;

  constructor(private cuotasService: CuotasService) {}

  listarPorCuotas(cuotaIds: number[]): Observable<Pago[]> {
    return of(this.pagos().filter((p) => cuotaIds.includes(p.cuotaId))).pipe(delay(100));
  }

  subirComprobante(cuotaId: number, archivo: File, cargadoPor: 'alumno' | 'admin' = 'alumno'): void {
    const pago: Pago = {
      id: this.nextId++,
      cuotaId,
      comprobanteNombre: archivo.name,
      fechaCarga: new Date(),
      cargadoPor,
    };
    this.pagos.update((lista) => [...lista, pago]);
    this.cuotasService.marcarEnRevision(cuotaId);
  }
}
