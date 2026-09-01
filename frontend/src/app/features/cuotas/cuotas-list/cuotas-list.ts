import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { EstadoCuota } from '../../../core/models/cuota.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ClasesService } from '../../../core/services/clases.service';
import { CuotaConAlumno, CuotasService, FiltrosCuotas } from '../../../core/services/cuotas.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

const ESTADOS_EDITABLES: EstadoCuota[] = [EstadoCuota.PENDIENTE, EstadoCuota.PAGADA, EstadoCuota.VENCIDA];

type ModoAlta = 'alumno' | 'clase';
type ModoFiltro = 'alumno' | 'clase';

interface CuotaForm {
  alumnoId: number | null;
  claseId: number | null;
  mes: number;
  anio: number;
  monto: number | null;
  fechaVencimiento: string;
  estado: EstadoCuota;
}

function formVacio(): CuotaForm {
  const hoy = new Date();
  return {
    alumnoId: null,
    claseId: null,
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    monto: null,
    fechaVencimiento: '',
    estado: EstadoCuota.PENDIENTE,
  };
}

@Component({
  selector: 'app-cuotas-list',
  imports: [FormsModule, StatusBadge, DatePipe, DecimalPipe],
  templateUrl: './cuotas-list.html',
})
export class CuotasList {
  protected readonly EstadoCuota = EstadoCuota;
  protected readonly estadosEditables = ESTADOS_EDITABLES;
  protected readonly meses = Array.from({ length: 12 }, (_, i) => i + 1);
  protected readonly nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  protected readonly cuotas = signal<CuotaConAlumno[]>([]);
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly clases = signal<Clase[]>([]);
  protected readonly cargando = signal(true);

  protected readonly modoAlta = signal<ModoAlta>('alumno');
  protected readonly mensajeLote = signal<string | null>(null);

  protected readonly filtroModo = signal<ModoFiltro>('alumno');
  protected readonly filtroAlumnoId = signal<number | null>(null);
  protected readonly filtroClaseId = signal<number | null>(null);
  protected readonly filtroEstado = signal<EstadoCuota | null>(null);
  protected readonly filtroMes = signal<number | null>(null);
  protected readonly filtroAnio = signal<number | null>(null);

  protected readonly mostrarModal = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = signal<CuotaForm>(formVacio());

  protected readonly cuotaAEliminar = signal<CuotaConAlumno | null>(null);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal<string | null>(null);

  constructor(
    private cuotasService: CuotasService,
    private alumnosService: AlumnosService,
    private clasesService: ClasesService,
  ) {
    this.cargar();
    this.alumnosService.listar().subscribe((alumnos) => this.alumnos.set(alumnos));
    this.clasesService.listar().subscribe((clases) => this.clases.set(clases));
  }

  private filtrosActuales(): FiltrosCuotas {
    return {
      alumnoId: this.filtroModo() === 'alumno' ? this.filtroAlumnoId() ?? undefined : undefined,
      claseId: this.filtroModo() === 'clase' ? this.filtroClaseId() ?? undefined : undefined,
      estado: this.filtroEstado() ?? undefined,
      mes: this.filtroMes() ?? undefined,
      anio: this.filtroAnio() ?? undefined,
    };
  }

  private cargar(): void {
    this.cargando.set(true);
    this.cuotasService.listarTodos(this.filtrosActuales()).subscribe((cuotas) => {
      this.cuotas.set(cuotas);
      this.cargando.set(false);
    });
  }

  protected aplicarFiltros(): void {
    this.cargar();
  }

  protected seleccionarModoFiltro(modo: ModoFiltro): void {
    this.filtroModo.set(modo);
    this.filtroAlumnoId.set(null);
    this.filtroClaseId.set(null);
    this.cargar();
  }

  protected limpiarFiltros(): void {
    this.filtroModo.set('alumno');
    this.filtroAlumnoId.set(null);
    this.filtroClaseId.set(null);
    this.filtroEstado.set(null);
    this.filtroMes.set(null);
    this.filtroAnio.set(null);
    this.cargar();
  }

  protected abrirNueva(): void {
    this.editandoId.set(null);
    this.modoAlta.set('alumno');
    this.form.set(formVacio());
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  protected seleccionarModo(modo: ModoAlta): void {
    this.modoAlta.set(modo);
    this.error.set(null);
  }

  protected cerrarMensajeLote(): void {
    this.mensajeLote.set(null);
  }

  protected abrirEdicion(cuota: CuotaConAlumno): void {
    this.editandoId.set(cuota.id);
    this.form.set({
      alumnoId: cuota.alumno.id,
      claseId: null,
      mes: cuota.mes,
      anio: cuota.anio,
      monto: cuota.monto,
      fechaVencimiento: cuota.fechaVencimiento.toISOString().slice(0, 10),
      estado: cuota.estado,
    });
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  protected cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  protected actualizarForm<K extends keyof CuotaForm>(campo: K, valor: CuotaForm[K]): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected guardar(): void {
    const id = this.editandoId();

    if (!id && this.modoAlta() === 'clase') {
      this.guardarPorClase();
      return;
    }

    const { alumnoId, mes, anio, monto, fechaVencimiento, estado } = this.form();
    if (!alumnoId || !monto || !fechaVencimiento) {
      this.error.set('Alumno, monto y fecha de vencimiento son obligatorios.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    const operacion = id
      ? this.cuotasService.actualizar(id, { alumnoId, mes, anio, monto, fechaVencimiento, estado })
      : this.cuotasService.crear({ alumnoId, mes, anio, monto, fechaVencimiento });

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar la cuota. Intentá de nuevo.');
      },
    });
  }

  private guardarPorClase(): void {
    const { claseId, mes, anio, monto, fechaVencimiento } = this.form();
    if (!claseId || !monto || !fechaVencimiento) {
      this.error.set('Clase, monto y fecha de vencimiento son obligatorios.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    this.cuotasService.crearPorClase({ claseId, mes, anio, monto, fechaVencimiento }).subscribe({
      next: ({ creadas, omitidas }) => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        const parteCreadas = creadas === 1 ? 'Se creó 1 cuota nueva' : `Se crearon ${creadas} cuotas nuevas`;
        const parteOmitidas =
          omitidas > 0
            ? ` (${omitidas === 1 ? '1 alumno ya la tenía y se omitió' : `${omitidas} alumnos ya la tenían y se omitieron`}).`
            : '.';
        this.mensajeLote.set(parteCreadas + parteOmitidas);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.message ?? 'No se pudieron crear las cuotas. Intentá de nuevo.');
      },
    });
  }

  protected pedirConfirmacionEliminar(cuota: CuotaConAlumno): void {
    this.cuotaAEliminar.set(cuota);
    this.errorEliminar.set(null);
  }

  protected cancelarEliminar(): void {
    this.cuotaAEliminar.set(null);
  }

  protected confirmarEliminar(): void {
    const cuota = this.cuotaAEliminar();
    if (!cuota) return;

    this.errorEliminar.set(null);
    this.eliminando.set(true);

    this.cuotasService.eliminar(cuota.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.cuotaAEliminar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.errorEliminar.set(err.error?.message ?? 'No se pudo eliminar la cuota.');
      },
    });
  }

  protected badgeTone(estado: EstadoCuota): 'ok' | 'debt' | 'soon' {
    if (estado === EstadoCuota.PAGADA) return 'ok';
    if (estado === EstadoCuota.VENCIDA) return 'debt';
    return 'soon';
  }

  protected badgeLabel(estado: EstadoCuota): string {
    switch (estado) {
      case EstadoCuota.PAGADA:
        return 'Pagada';
      case EstadoCuota.VENCIDA:
        return 'Vencida';
      case EstadoCuota.EN_REVISION:
        return 'En revisión';
      default:
        return 'Pendiente';
    }
  }

  protected fechaMes(cuota: CuotaConAlumno): Date {
    return new Date(cuota.anio, cuota.mes - 1);
  }
}
