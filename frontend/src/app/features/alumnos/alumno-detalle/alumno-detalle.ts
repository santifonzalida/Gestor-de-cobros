import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Cuota, EstadoCuota } from '../../../core/models/cuota.model';
import { MetodoPago, Pago } from '../../../core/models/pago.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CuotasService } from '../../../core/services/cuotas.service';
import { PagosService } from '../../../core/services/pagos.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  MERCADOPAGO: 'Mercado Pago',
};

@Component({
  selector: 'app-alumno-detalle',
  imports: [AvatarInitials, StatusBadge, DatePipe, DecimalPipe],
  templateUrl: './alumno-detalle.html',
})
export class AlumnoDetalle {
  protected readonly EstadoCuota = EstadoCuota;

  protected readonly alumno = signal<AlumnoConEstado | undefined>(undefined);
  protected readonly cuotas = signal<Cuota[]>([]);
  protected readonly pagos = signal<Pago[]>([]);

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');
  private alumnoId!: number;

  constructor(
    private route: ActivatedRoute,
    private alumnosService: AlumnosService,
    private cuotasService: CuotasService,
    private pagosService: PagosService,
  ) {
    this.alumnoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.alumnosService.obtenerPorId(this.alumnoId).subscribe((alumno) => this.alumno.set(alumno));
    this.cuotasService.listarPorAlumno(this.alumnoId).subscribe((cuotas) => {
      this.cuotas.set(cuotas);
      this.pagosService.listarPorCuotas(cuotas.map((c) => c.id)).subscribe((pagos) => this.pagos.set(pagos));
    });
  }

  protected badgeTone(estado: EstadoCuota): 'ok' | 'debt' | 'soon' {
    if (estado === EstadoCuota.PAGADA) return 'ok';
    if (estado === EstadoCuota.VENCIDA) return 'debt';
    return 'soon';
  }

  protected badgeLabel(cuota: Cuota): string {
    switch (cuota.estado) {
      case EstadoCuota.PAGADA:
        return 'Pagada';
      case EstadoCuota.VENCIDA:
        return 'Vencida';
      case EstadoCuota.EN_REVISION:
        return 'En revisión';
      default:
        return 'Vence ' + this.formatearFecha(cuota.fechaVencimiento);
    }
  }

  private formatearFecha(fecha: Date): string {
    return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  protected estadoAlumnoTone(): 'ok' | 'debt' | 'soon' {
    const estado = this.alumno()?.estadoPago;
    return estado === 'al_dia' ? 'ok' : estado === 'adeuda' ? 'debt' : 'soon';
  }

  protected estadoAlumnoLabel(): string {
    const estado = this.alumno()?.estadoPago;
    return estado === 'al_dia' ? 'Al día' : estado === 'adeuda' ? 'Adeuda' : 'Próximo a vencer';
  }

  protected cuotaDePago(pago: Pago): Cuota | undefined {
    return this.cuotas().find((c) => c.id === pago.cuotaId);
  }

  protected etiquetaMetodo(metodo: MetodoPago): string {
    return ETIQUETAS_METODO[metodo];
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
