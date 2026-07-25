import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlumnoConEstado, EstadoPago } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ClasesService } from '../../../core/services/clases.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

type Tab = 'todos' | 'al_dia' | 'adeuda';

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

  protected readonly alDiaCount = computed(() => this.alumnos().filter((a) => a.estadoPago === 'al_dia').length);
  protected readonly adeudanCount = computed(() => this.alumnos().filter((a) => a.estadoPago === 'adeuda').length);

  protected readonly alumnosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const tab = this.tab();
    return this.alumnos().filter((a) => {
      const coincideTexto = !texto || `${a.nombre} ${a.apellido}`.toLowerCase().includes(texto);
      const coincideTab =
        tab === 'todos' || (tab === 'al_dia' && a.estadoPago === 'al_dia') || (tab === 'adeuda' && a.estadoPago === 'adeuda');
      return coincideTexto && coincideTab;
    });
  });

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
}
