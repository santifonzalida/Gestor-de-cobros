import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pago } from '../models/pago.model';

interface PagoApi {
  id: number;
  cuota: { id: number };
  metodo: Pago['metodo'];
  montoPagado: number;
  fechaPago: string;
  comprobanteUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly baseUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  listarPorCuotas(cuotaIds: number[]): Observable<Pago[]> {
    if (cuotaIds.length === 0) return of([]);

    return forkJoin(
      cuotaIds.map((cuotaId) => this.http.get<PagoApi[]>(this.baseUrl, { params: { cuotaId } })),
    ).pipe(map((listas) => listas.flat().map((p) => this.mapear(p))));
  }

  private mapear(p: PagoApi): Pago {
    return {
      id: p.id,
      cuotaId: p.cuota.id,
      metodo: p.metodo,
      montoPagado: p.montoPagado,
      fechaPago: new Date(p.fechaPago),
      comprobanteUrl: p.comprobanteUrl,
    };
  }
}
