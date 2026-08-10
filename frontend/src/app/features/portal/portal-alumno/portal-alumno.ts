import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Cuota, EstadoCuota } from '../../../core/models/cuota.model';
import { MetodoPago, Pago } from '../../../core/models/pago.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';
import { CuotasService } from '../../../core/services/cuotas.service';
import { NegociosService } from '../../../core/services/negocios.service';
import { PagosService } from '../../../core/services/pagos.service';
import { COLOR_ACCENTO_DEFAULT, PreferenciasService } from '../../../core/services/preferencias.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

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
  protected readonly colorDefault = COLOR_ACCENTO_DEFAULT;

  protected readonly alumno = signal<AlumnoConEstado | undefined>(undefined);
  protected readonly cuotas = signal<Cuota[]>([]);
  protected readonly pagos = signal<Pago[]>([]);
  protected readonly sinAlumnoVinculado = signal(false);
  protected readonly logoUrl = signal<string | null>(null);
  protected readonly colorAccento = signal(COLOR_ACCENTO_DEFAULT);

  protected readonly subiendoComprobante = signal(false);
  protected readonly errorComprobante = signal<string | null>(null);
  protected readonly archivoPendiente = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly mostrarConfirmarSalir = signal(false);

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');
  private alumnoId: number | null;

  constructor(
    private alumnosService: AlumnosService,
    private authService: AuthService,
    private cuotasService: CuotasService,
    private negociosService: NegociosService,
    private pagosService: PagosService,
    private preferenciasService: PreferenciasService,
    private router: Router,
  ) {
    this.negociosService.obtenerActual().subscribe((negocio) => this.logoUrl.set(negocio.logoUrl));
    this.preferenciasService
      .obtenerColor()
      .subscribe(({ colorAccento }) => this.colorAccento.set(colorAccento ?? COLOR_ACCENTO_DEFAULT));

    this.alumnoId = this.authService.usuario()?.alumnoId ?? null;
    if (this.alumnoId === null) {
      this.sinAlumnoVinculado.set(true);
      return;
    }
    this.cargarDatos();
  }

  private cargarDatos(): void {
    if (this.alumnoId === null) return;
    this.alumnosService.obtenerPorId(this.alumnoId).subscribe((alumno) => this.alumno.set(alumno));
    this.cuotasService.listarPorAlumno(this.alumnoId).subscribe((cuotas) => {
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

  protected colorAccentoHover(): string {
    return `color-mix(in srgb, ${this.colorAccento()} 82%, black)`;
  }

  protected colorAccentoSoft(): string {
    return `color-mix(in srgb, ${this.colorAccento()} 14%, white)`;
  }

  protected onColorSeleccionado(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.colorAccento.set(color);
    this.preferenciasService.actualizarColor(color).subscribe({ error: () => {} });
  }

  protected restablecerColor(): void {
    this.colorAccento.set(COLOR_ACCENTO_DEFAULT);
    this.preferenciasService.restablecerColor().subscribe({ error: () => {} });
  }

  protected pedirConfirmarSalir(): void {
    this.mostrarConfirmarSalir.set(true);
  }

  protected cancelarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
  }

  protected confirmarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
    this.salir();
  }

  private salir(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected diasParaVencer(fecha: Date): number {
    return Math.ceil((fecha.getTime() - Date.now()) / 86_400_000);
  }

  protected abrirSelectorArchivo(): void {
    this.inputArchivo()?.nativeElement.click();
  }

  protected onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.errorComprobante.set(null);
    this.liberarPreview();
    this.archivoPendiente.set(archivo);
    this.previewUrl.set(archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null);
    input.value = '';
  }

  protected cancelarArchivo(): void {
    this.liberarPreview();
    this.archivoPendiente.set(null);
    this.errorComprobante.set(null);
  }

  protected confirmarSubida(): void {
    const archivo = this.archivoPendiente();
    const cuotaActual = this.alumno()?.cuotaActual;
    if (!archivo || !cuotaActual) return;

    this.errorComprobante.set(null);
    this.subiendoComprobante.set(true);

    this.cuotasService.subirComprobante(cuotaActual.id, archivo).subscribe({
      next: () => {
        this.subiendoComprobante.set(false);
        this.cancelarArchivo();
        this.cargarDatos();
      },
      error: (err: HttpErrorResponse) => {
        this.subiendoComprobante.set(false);
        this.errorComprobante.set(err.error?.message ?? 'No se pudo subir el comprobante. Probá de nuevo.');
      },
    });
  }

  private liberarPreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
