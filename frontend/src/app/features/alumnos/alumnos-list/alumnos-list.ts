import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlumnoConEstado, EstadoPago } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ClasesService } from '../../../core/services/clases.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

type Tab = 'todos' | 'al_dia' | 'adeuda' | 'inactivos';

interface NuevoAlumnoForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  claseId: number | null;
}

const FORM_VACIO: NuevoAlumnoForm = { nombre: '', apellido: '', email: '', telefono: '', claseId: null };

@Component({
  selector: 'app-alumnos-list',
  imports: [AvatarInitials, StatusBadge, FormsModule, DatePipe],
  templateUrl: './alumnos-list.html',
})
export class AlumnosList {
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly tab = signal<Tab>('todos');

  protected readonly clases = signal<Clase[]>([]);
  protected readonly mostrarModal = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = signal<NuevoAlumnoForm>({ ...FORM_VACIO });

  protected readonly totalActivos = computed(() => this.alumnos().filter((a) => a.activo).length);
  protected readonly inactivosCount = computed(() => this.alumnos().filter((a) => !a.activo).length);
  protected readonly alDiaCount = computed(
    () => this.alumnos().filter((a) => a.activo && a.estadoPago === 'al_dia').length,
  );
  protected readonly adeudanCount = computed(
    () => this.alumnos().filter((a) => a.activo && a.estadoPago === 'adeuda').length,
  );

  protected readonly alumnosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const tab = this.tab();
    return this.alumnos().filter((a) => {
      const coincideTexto = !texto || `${a.nombre} ${a.apellido}`.toLowerCase().includes(texto);
      if (!coincideTexto) return false;
      if (tab === 'inactivos') return !a.activo;
      if (!a.activo) return false;
      return tab === 'todos' || (tab === 'al_dia' && a.estadoPago === 'al_dia') || (tab === 'adeuda' && a.estadoPago === 'adeuda');
    });
  });

  protected readonly alumnoABajar = signal<AlumnoConEstado | null>(null);
  protected readonly dandoBaja = signal(false);
  protected readonly errorBaja = signal<string | null>(null);
  protected readonly reactivandoId = signal<number | null>(null);

  constructor(
    private alumnosService: AlumnosService,
    private clasesService: ClasesService,
    private router: Router,
  ) {
    this.cargarAlumnos();
    this.clasesService.listar().subscribe((clases) => this.clases.set(clases));
  }

  private cargarAlumnos(): void {
    this.alumnosService.listar().subscribe((alumnos) => {
      this.alumnos.set(alumnos);
      this.cargando.set(false);
    });
  }

  protected seleccionarTab(tab: Tab): void {
    this.tab.set(tab);
  }

  protected abrirModal(): void {
    this.form.set({ ...FORM_VACIO });
    this.error.set(null);
    this.mostrarModal.set(true);
  }

  protected cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  protected actualizarForm<K extends keyof NuevoAlumnoForm>(campo: K, valor: NuevoAlumnoForm[K]): void {
    this.form.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected guardar(): void {
    const { nombre, apellido, email, telefono, claseId } = this.form();
    if (!nombre.trim() || !apellido.trim()) {
      this.error.set('Nombre y apellido son obligatorios.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    this.alumnosService
      .crear({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        claseId: claseId ?? undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.mostrarModal.set(false);
          this.cargarAlumnos();
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('No se pudo crear el alumno. Intentá de nuevo.');
        },
      });
  }

  protected badgeTone(estado: EstadoPago): 'ok' | 'debt' | 'soon' {
    return estado === 'al_dia' ? 'ok' : estado === 'adeuda' ? 'debt' : 'soon';
  }

  protected badgeLabel(estado: EstadoPago): string {
    return estado === 'al_dia' ? 'Al día' : estado === 'adeuda' ? 'Adeuda' : 'Vence pronto';
  }

  protected irAlDetalle(alumnoId: number): void {
    this.router.navigate(['/alumnos', alumnoId]);
  }

  protected pedirBaja(alumno: AlumnoConEstado): void {
    this.alumnoABajar.set(alumno);
    this.errorBaja.set(null);
  }

  protected cancelarBaja(): void {
    this.alumnoABajar.set(null);
  }

  protected confirmarBaja(): void {
    const alumno = this.alumnoABajar();
    if (!alumno) return;

    this.errorBaja.set(null);
    this.dandoBaja.set(true);

    this.alumnosService.cambiarEstado(alumno.id, false).subscribe({
      next: () => {
        this.dandoBaja.set(false);
        this.alumnoABajar.set(null);
        this.cargarAlumnos();
      },
      error: (err: HttpErrorResponse) => {
        this.dandoBaja.set(false);
        this.errorBaja.set(err.error?.message ?? 'No se pudo dar de baja al alumno.');
      },
    });
  }

  protected reactivar(alumno: AlumnoConEstado): void {
    this.reactivandoId.set(alumno.id);
    this.alumnosService.cambiarEstado(alumno.id, true).subscribe({
      next: () => {
        this.reactivandoId.set(null);
        this.cargarAlumnos();
      },
      error: () => {
        this.reactivandoId.set(null);
      },
    });
  }
}
