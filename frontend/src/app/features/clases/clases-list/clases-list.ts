import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Clase } from '../../../core/models/clase.model';
import { ClasesService } from '../../../core/services/clases.service';
import { CuotaConAlumno, CuotasService } from '../../../core/services/cuotas.service';
import { EstadoCuota } from '../../../core/models/cuota.model';

interface ClaseForm {
  nombre: string;
  icono: string;
  descripcion?: string;
}

export interface ResumenPeriodo {
  mes: number;
  anio: number;
  monto: number;
  total: number;
  pagadas: number;
  pendientes: number;
  vencidas: number;
  enRevision: number;
}

const FORM_VACIO: ClaseForm = { nombre: '', icono: '', descripcion: '' };

@Component({
  selector: 'app-clases-list',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './clases-list.html',
})
export class ClasesList {
  protected readonly clases = signal<Clase[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mostrarModal = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = signal<ClaseForm>({ ...FORM_VACIO });

  protected readonly claseAEliminar = signal<Clase | null>(null);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal<string | null>(null);

  protected readonly resumenPorClase = signal<Record<number, ResumenPeriodo[]>>({});
  protected readonly cargandoResumen = signal(true);
  protected readonly expandida = signal<number | null>(null);

  constructor(
    private clasesService: ClasesService,
    private cuotasService: CuotasService,
  ) {
    this.cargar();
  }

  private cargar(): void {
    this.clasesService.listar().subscribe((clases) => {
      this.clases.set(clases);
      this.cargando.set(false);
      this.cargarResumenCuotas(clases);
    });
  }

  private cargarResumenCuotas(clases: Clase[]): void {
    if (clases.length === 0) {
      this.resumenPorClase.set({});
      this.cargandoResumen.set(false);
      return;
    }

    this.cargandoResumen.set(true);
    forkJoin(clases.map((c) => this.cuotasService.listarTodos({ claseId: c.id }))).subscribe(
      (resultados) => {
        const mapa: Record<number, ResumenPeriodo[]> = {};
        clases.forEach((c, i) => (mapa[c.id] = this.agruparPorPeriodo(resultados[i])));
        this.resumenPorClase.set(mapa);
        this.cargandoResumen.set(false);
      },
    );
  }

  private agruparPorPeriodo(cuotas: CuotaConAlumno[]): ResumenPeriodo[] {
    const mapa = new Map<string, ResumenPeriodo>();
    for (const c of cuotas) {
      const clave = `${c.anio}-${c.mes}-${c.monto}`;
      const periodo = mapa.get(clave) ?? {
        mes: c.mes,
        anio: c.anio,
        monto: c.monto,
        total: 0,
        pagadas: 0,
        pendientes: 0,
        vencidas: 0,
        enRevision: 0,
      };
      periodo.total++;
      if (c.estado === EstadoCuota.PAGADA) periodo.pagadas++;
      else if (c.estado === EstadoCuota.VENCIDA) periodo.vencidas++;
      else if (c.estado === EstadoCuota.EN_REVISION) periodo.enRevision++;
      else periodo.pendientes++;
      mapa.set(clave, periodo);
    }
    return [...mapa.values()].sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  }

  protected cuotaActual(claseId: number): ResumenPeriodo | undefined {
    return this.resumenPorClase()[claseId]?.[0];
  }

  protected historial(claseId: number): ResumenPeriodo[] {
    return this.resumenPorClase()[claseId] ?? [];
  }

  protected fechaPeriodo(periodo: ResumenPeriodo): Date {
    return new Date(periodo.anio, periodo.mes - 1);
  }

  protected toggleExpandir(claseId: number): void {
    this.expandida.set(this.expandida() === claseId ? null : claseId);
  }

  protected abrirNueva(): void {
    this.editandoId.set(null);
    this.form.set({ ...FORM_VACIO });
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  protected abrirEdicion(clase: Clase): void {
    this.editandoId.set(clase.id);
    this.form.set({ nombre: clase.nombre, icono: clase.icono });
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  protected cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  protected actualizarForm<K extends keyof ClaseForm>(campo: K, valor: ClaseForm[K]): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected guardar(): void {
    const { nombre, icono, descripcion } = this.form();
    if (!nombre.trim()) {
      this.error.set('Nombre es obligatorio.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);
    const dto = { nombre: nombre.trim(), icono: icono.trim(), descripcion: descripcion?.trim() };
    const id = this.editandoId();

    const operacion = id ? this.clasesService.actualizar(id, dto) : this.clasesService.crear(dto);
    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar la clase. Intentá de nuevo.');
      },
    });
  }

  protected pedirConfirmacionEliminar(clase: Clase): void {
    this.claseAEliminar.set(clase);
    this.errorEliminar.set(null);
  }

  protected cancelarEliminar(): void {
    this.claseAEliminar.set(null);
  }

  protected confirmarEliminar(): void {
    const clase = this.claseAEliminar();
    if (!clase) return;

    this.errorEliminar.set(null);
    this.eliminando.set(true);

    this.clasesService.eliminar(clase.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.claseAEliminar.set(null);
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.errorEliminar.set(err.error?.message ?? 'No se pudo eliminar la clase.');
      },
    });
  }
}
