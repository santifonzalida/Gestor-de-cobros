import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlumnoConEstado, EstadoPago } from '../../../core/models/alumno.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

type Tab = 'todos' | 'al_dia' | 'adeuda';

@Component({
  selector: 'app-alumnos-list',
  imports: [AvatarInitials, StatusBadge, FormsModule, DatePipe],
  templateUrl: './alumnos-list.html',
})
export class AlumnosList {
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly busqueda = signal('');
  protected readonly tab = signal<Tab>('todos');

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
    private router: Router,
  ) {
    this.alumnosService.listar().subscribe((alumnos) => this.alumnos.set(alumnos));
  }

  protected seleccionarTab(tab: Tab): void {
    this.tab.set(tab);
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
