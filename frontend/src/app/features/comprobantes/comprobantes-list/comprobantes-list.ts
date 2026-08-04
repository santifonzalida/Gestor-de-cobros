import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { Comprobante, EstadoComprobante } from '../../../core/models/comprobante.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ClasesService } from '../../../core/services/clases.service';
import { ComprobantesService, FiltrosComprobantes } from '../../../core/services/comprobantes.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-comprobantes-list',
  imports: [FormsModule, StatusBadge, DatePipe],
  templateUrl: './comprobantes-list.html',
})
export class ComprobantesList {
  protected readonly EstadoComprobante = EstadoComprobante;
  protected readonly meses = Array.from({ length: 12 }, (_, i) => i + 1);
  protected readonly nombresMeses = NOMBRES_MESES;
  protected readonly estados = [EstadoComprobante.EN_REVISION, EstadoComprobante.APROBADO, EstadoComprobante.RECHAZADO];

  protected readonly comprobantes = signal<Comprobante[]>([]);
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly clases = signal<Clase[]>([]);
  protected readonly cargando = signal(true);

  protected readonly filtroAlumnoId = signal<number | null>(null);
  protected readonly filtroClaseId = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoComprobante | null>(null);
  protected readonly filtroMes = signal<number | null>(null);
  protected readonly filtroAnio = signal<number | null>(null);

  constructor(
    private comprobantesService: ComprobantesService,
    private alumnosService: AlumnosService,
    private clasesService: ClasesService,
  ) {
    this.cargar();
    this.alumnosService.listar().subscribe((alumnos) => this.alumnos.set(alumnos));
    this.clasesService.listar().subscribe((clases) => this.clases.set(clases));
  }

  private filtrosActuales(): FiltrosComprobantes {
    return {
      alumnoId: this.filtroAlumnoId() ?? undefined,
      claseId: this.filtroClaseId() ?? undefined,
      estado: this.filtroEstado() ?? undefined,
      mes: this.filtroMes() ?? undefined,
      anio: this.filtroAnio() ?? undefined,
    };
  }

  private cargar(): void {
    this.cargando.set(true);
    this.comprobantesService.listarTodos(this.filtrosActuales()).subscribe((comprobantes) => {
      this.comprobantes.set(comprobantes);
      this.cargando.set(false);
    });
  }

  protected aplicarFiltros(): void {
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.filtroAlumnoId.set(null);
    this.filtroClaseId.set(null);
    this.filtroEstado.set(null);
    this.filtroMes.set(null);
    this.filtroAnio.set(null);
    this.cargar();
  }

  protected ver(comprobante: Comprobante): void {
    this.comprobantesService.verComprobante(comprobante.id);
  }

  protected nombreClase(claseId: number | undefined): string {
    if (!claseId) return 'Sin clase';
    return this.clases().find((c) => c.id === claseId)?.nombre ?? 'Sin clase';
  }

  protected fechaMes(comprobante: Comprobante): Date {
    return new Date(comprobante.anio, comprobante.mes - 1);
  }

  protected badgeTone(estado: EstadoComprobante): 'ok' | 'debt' | 'soon' {
    if (estado === EstadoComprobante.APROBADO) return 'ok';
    if (estado === EstadoComprobante.RECHAZADO) return 'debt';
    return 'soon';
  }

  protected badgeLabel(estado: EstadoComprobante): string {
    switch (estado) {
      case EstadoComprobante.APROBADO:
        return 'Aprobado';
      case EstadoComprobante.RECHAZADO:
        return 'Rechazado';
      default:
        return 'En revisión';
    }
  }
}
