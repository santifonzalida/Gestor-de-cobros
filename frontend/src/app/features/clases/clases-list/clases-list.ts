import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Clase } from '../../../core/models/clase.model';
import { ClasesService } from '../../../core/services/clases.service';

interface ClaseForm {
  nombre: string;
  icono: string;
  descripcion?: string;
}

const FORM_VACIO: ClaseForm = { nombre: '', icono: '', descripcion: '' };

@Component({
  selector: 'app-clases-list',
  imports: [FormsModule],
  templateUrl: './clases-list.html',
})
export class ClasesList {
  protected readonly clases = signal<Clase[]>([]);
  protected readonly mostrarModal = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = signal<ClaseForm>({ ...FORM_VACIO });

  protected readonly claseAEliminar = signal<Clase | null>(null);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal<string | null>(null);

  constructor(private clasesService: ClasesService) {
    this.cargar();
  }

  private cargar(): void {
    this.clasesService.listar().subscribe((clases) => this.clases.set(clases));
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
