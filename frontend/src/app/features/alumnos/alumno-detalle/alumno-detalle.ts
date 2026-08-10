import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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

interface FormAprobar {
  metodo: MetodoPago;
  montoPagado: number;
}

@Component({
  selector: 'app-alumno-detalle',
  imports: [AvatarInitials, StatusBadge, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './alumno-detalle.html',
})
export class AlumnoDetalle {
  protected readonly EstadoCuota = EstadoCuota;

  protected readonly alumno = signal<AlumnoConEstado | undefined>(undefined);
  protected readonly cuotas = signal<Cuota[]>([]);
  protected readonly pagos = signal<Pago[]>([]);

  protected readonly invitando = signal(false);
  protected readonly mensajeInvitacion = signal<string | null>(null);
  protected readonly errorInvitacion = signal<string | null>(null);

  protected readonly cuotaAAprobar = signal<Cuota | null>(null);
  protected readonly formAprobar = signal<FormAprobar>({ metodo: 'EFECTIVO', montoPagado: 0 });
  protected readonly aprobando = signal(false);
  protected readonly errorAprobar = signal<string | null>(null);

  protected readonly cuotaARechazar = signal<Cuota | null>(null);
  protected readonly rechazando = signal(false);
  protected readonly errorRechazar = signal<string | null>(null);

  protected readonly errorVerComprobante = signal<string | null>(null);

  protected readonly cuotaACargarComprobante = signal<Cuota | null>(null);
  protected readonly formCargarComprobante = signal<FormAprobar>({ metodo: 'EFECTIVO', montoPagado: 0 });
  protected readonly archivoComprobante = signal<File | null>(null);
  protected readonly previewComprobante = signal<string | null>(null);
  protected readonly cargandoComprobante = signal(false);
  protected readonly errorCargarComprobante = signal<string | null>(null);

  private readonly inputComprobante = viewChild<ElementRef<HTMLInputElement>>('inputComprobante');

  protected readonly metodosPago: MetodoPago[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'MERCADOPAGO'];

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

  protected invitar(): void {
    const alumnoId = this.alumno()?.id;
    if (!alumnoId) return;

    this.errorInvitacion.set(null);
    this.mensajeInvitacion.set(null);
    this.invitando.set(true);

    this.alumnosService.invitar(alumnoId).subscribe({
      next: () => {
        this.invitando.set(false);
        this.mensajeInvitacion.set(`Invitación enviada a ${this.alumno()?.email}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.invitando.set(false);
        this.errorInvitacion.set(err.error?.message ?? 'No se pudo enviar la invitación.');
      },
    });
  }

  /**
   * `window.open` tiene que llamarse en el mismo tick del click para que
   * cuente como originado por el usuario — si se llama recién adentro del
   * `subscribe` (después del round-trip HTTP para pedir la URL prefirmada),
   * los navegadores móviles (Safari/Chrome en iOS y Android) lo tratan como
   * un popup no solicitado y lo bloquean en silencio, aunque en desktop suele
   * pasar igual. Por eso se abre la pestaña en blanco ya mismo, y recién se
   * navega a la URL real cuando llega.
   */
  protected verComprobante(cuota: Cuota): void {
    this.errorVerComprobante.set(null);
    const ventana = window.open('', '_blank');

    this.cuotasService.verComprobante(cuota.id).subscribe({
      next: (respuesta) => {
        if (ventana) {
          ventana.location.href = respuesta.url;
        } else {
          this.errorVerComprobante.set(
            'El navegador bloqueó la ventana. Habilitá las ventanas emergentes para este sitio e intentá de nuevo.',
          );
        }
      },
      error: () => {
        ventana?.close();
        this.errorVerComprobante.set('No se pudo abrir el comprobante. Probá de nuevo.');
      },
    });
  }

  protected abrirAprobar(cuota: Cuota): void {
    this.cuotaAAprobar.set(cuota);
    this.formAprobar.set({ metodo: 'EFECTIVO', montoPagado: cuota.monto });
    this.errorAprobar.set(null);
  }

  protected cancelarAprobar(): void {
    this.cuotaAAprobar.set(null);
  }

  protected actualizarFormAprobar<K extends keyof FormAprobar>(campo: K, valor: FormAprobar[K]): void {
    this.formAprobar.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected confirmarAprobar(): void {
    const cuota = this.cuotaAAprobar();
    if (!cuota) return;

    this.errorAprobar.set(null);
    this.aprobando.set(true);

    this.cuotasService.aprobarComprobante(cuota.id, this.formAprobar()).subscribe({
      next: () => {
        this.aprobando.set(false);
        this.cuotaAAprobar.set(null);
        this.cargarDatos();
      },
      error: (err: HttpErrorResponse) => {
        this.aprobando.set(false);
        this.errorAprobar.set(err.error?.message ?? 'No se pudo aprobar el comprobante.');
      },
    });
  }

  protected abrirRechazar(cuota: Cuota): void {
    this.cuotaARechazar.set(cuota);
    this.errorRechazar.set(null);
  }

  protected cancelarRechazar(): void {
    this.cuotaARechazar.set(null);
  }

  protected confirmarRechazar(): void {
    const cuota = this.cuotaARechazar();
    if (!cuota) return;

    this.errorRechazar.set(null);
    this.rechazando.set(true);

    this.cuotasService.rechazarComprobante(cuota.id).subscribe({
      next: () => {
        this.rechazando.set(false);
        this.cuotaARechazar.set(null);
        this.cargarDatos();
      },
      error: (err: HttpErrorResponse) => {
        this.rechazando.set(false);
        this.errorRechazar.set(err.error?.message ?? 'No se pudo rechazar el comprobante.');
      },
    });
  }

  protected abrirCargarComprobante(cuota: Cuota): void {
    this.cuotaACargarComprobante.set(cuota);
    this.formCargarComprobante.set({ metodo: 'EFECTIVO', montoPagado: cuota.monto });
    this.archivoComprobante.set(null);
    this.previewComprobante.set(null);
    this.errorCargarComprobante.set(null);
  }

  protected cancelarCargarComprobante(): void {
    this.liberarPreviewComprobante();
    this.cuotaACargarComprobante.set(null);
    this.archivoComprobante.set(null);
    this.previewComprobante.set(null);
  }

  protected abrirSelectorComprobante(): void {
    this.inputComprobante()?.nativeElement.click();
  }

  protected onArchivoComprobanteSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.errorCargarComprobante.set(null);
    this.liberarPreviewComprobante();
    this.archivoComprobante.set(archivo);
    this.previewComprobante.set(archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null);
    input.value = '';
  }

  protected actualizarFormCargarComprobante<K extends keyof FormAprobar>(campo: K, valor: FormAprobar[K]): void {
    this.formCargarComprobante.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected confirmarCargarComprobante(): void {
    const cuota = this.cuotaACargarComprobante();
    const archivo = this.archivoComprobante();
    if (!cuota || !archivo) return;

    this.errorCargarComprobante.set(null);
    this.cargandoComprobante.set(true);

    this.cuotasService.cargarComprobanteManual(cuota.id, archivo, this.formCargarComprobante()).subscribe({
      next: () => {
        this.cargandoComprobante.set(false);
        this.cancelarCargarComprobante();
        this.cargarDatos();
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoComprobante.set(false);
        this.errorCargarComprobante.set(err.error?.message ?? 'No se pudo cargar el comprobante. Probá de nuevo.');
      },
    });
  }

  private liberarPreviewComprobante(): void {
    const url = this.previewComprobante();
    if (url) URL.revokeObjectURL(url);
  }
}
