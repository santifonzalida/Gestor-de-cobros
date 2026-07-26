import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Cuota, EstadoCuota } from '../../../core/models/cuota.model';
import { MetodoPago, Pago } from '../../../core/models/pago.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CuotasService } from '../../../core/services/cuotas.service';
import { PagosService } from '../../../core/services/pagos.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

// En una sesión real, el alumno vendría del usuario autenticado (JWT), no hardcodeado.
const ALUMNO_ID_SESION = 5;

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  MERCADOPAGO: 'Mercado Pago',
};

@Component({
  selector: 'app-portal-alumno',
  imports: [StatusBadge, DatePipe, DecimalPipe],
  templateUrl: './portal-alumno.html',
})
export class PortalAlumno {
  protected readonly EstadoCuota = EstadoCuota;

  protected readonly alumno = signal<AlumnoConEstado | undefined>(undefined);
  protected readonly cuotas = signal<Cuota[]>([]);
  protected readonly pagos = signal<Pago[]>([]);

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');

  constructor(
    private alumnosService: AlumnosService,
    private cuotasService: CuotasService,
    private pagosService: PagosService,
  ) {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.alumnosService.obtenerPorId(ALUMNO_ID_SESION).subscribe((alumno) => this.alumno.set(alumno));
    this.cuotasService.listarPorAlumno(ALUMNO_ID_SESION).subscribe((cuotas) => {
      this.cuotas.set(cuotas);
      this.pagosService.listarPorCuotas(cuotas.map((c) => c.id)).subscribe((pagos) => this.pagos.set(pagos));
    });
  }

  protected historialPagos(): Pago[] {
    return [...this.pagos()].sort((a, b) => b.fechaPago.getTime() - a.fechaPago.getTime());
  }

  protected cuotaDePago(pago: Pago): Cuota | undefined {
    return this.cuotas().find((c) => c.id === pago.cuotaId);
  }

  protected pagoDeLaCuotaActual(): Pago | undefined {
    const cuotaActual = this.alumno()?.cuotaActual;
    return cuotaActual ? this.pagos().find((p) => p.cuotaId === cuotaActual.id) : undefined;
  }

  protected etiquetaMetodo(metodo: MetodoPago): string {
    return ETIQUETAS_METODO[metodo];
  }

  protected diasParaVencer(fecha: Date): number {
    return Math.ceil((fecha.getTime() - Date.now()) / 86_400_000);
  }

  protected abrirSelectorArchivo(): void {
    this.inputArchivo()?.nativeElement.click();
  }

  protected onArchivoSeleccionado(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    const cuotaActual = this.alumno()?.cuotaActual;
    if (archivo && cuotaActual) {
      this.cuotasService.marcarEnRevision(cuotaActual.id);
      this.cargarDatos();
    }
  }
}
