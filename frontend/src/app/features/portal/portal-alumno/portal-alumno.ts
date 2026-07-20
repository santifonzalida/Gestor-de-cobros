import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Cuota, EstadoCuota } from '../../../core/models/cuota.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CuotasService } from '../../../core/services/cuotas.service';
import { PagosService } from '../../../core/services/pagos.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

// En una sesión real, el alumno vendría del usuario autenticado (JWT), no hardcodeado.
const ALUMNO_ID_SESION = 5;

@Component({
  selector: 'app-portal-alumno',
  imports: [StatusBadge, DatePipe, DecimalPipe],
  templateUrl: './portal-alumno.html',
})
export class PortalAlumno {
  protected readonly EstadoCuota = EstadoCuota;

  protected readonly alumno = signal<AlumnoConEstado | undefined>(undefined);
  protected readonly cuotas = signal<Cuota[]>([]);

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
    this.cuotasService.listarPorAlumno(ALUMNO_ID_SESION).subscribe((cuotas) => this.cuotas.set(cuotas));
  }

  protected historial(): Cuota[] {
    const actual = this.alumno()?.cuotaActual;
    return this.cuotas().filter((c) => c.id !== actual?.id);
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
      this.pagosService.subirComprobante(cuotaActual.id, archivo, 'alumno');
      this.cargarDatos();
    }
  }
}
