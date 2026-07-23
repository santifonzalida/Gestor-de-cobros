import { DecimalPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { StatTile } from '../../../shared/ui/stat-tile/stat-tile';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-dashboard-operativo',
  imports: [StatTile, StatusBadge, AvatarInitials, DecimalPipe],
  templateUrl: './dashboard-operativo.html',
})
export class DashboardOperativo {
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly clases = signal<Clase[]>([]);
  protected readonly claseSeleccionada = signal<number | null>(null);

  protected readonly alDia = computed(() => this.alumnos().filter((a) => a.estadoPago === 'al_dia').length);
  protected readonly adeudan = computed(() => this.alumnos().filter((a) => a.estadoPago === 'adeuda').length);
  protected readonly vencenEstaSemana = computed(
    () => this.alumnos().filter((a) => a.estadoPago === 'proximo').length,
  );

  protected readonly alumnosFiltrados = computed(() => {
    const clase = this.claseSeleccionada();
    return clase === null ? this.alumnos() : this.alumnos().filter((a) => a.clase?.id === clase);
  });

  constructor(
    private alumnosService: AlumnosService,
    private router: Router,
  ) {
    this.alumnosService.listar().subscribe((alumnos) => this.alumnos.set(alumnos));
    this.alumnosService.listarClases().subscribe((clases) => this.clases.set(clases));
  }

  protected seleccionarClase(claseId: number | null): void {
    this.claseSeleccionada.set(claseId);
  }

  protected badgeTone(estado: AlumnoConEstado['estadoPago']): 'ok' | 'debt' | 'soon' {
    return estado === 'al_dia' ? 'ok' : estado === 'adeuda' ? 'debt' : 'soon';
  }

  protected badgeLabel(estado: AlumnoConEstado['estadoPago']): string {
    return estado === 'al_dia' ? 'Al día' : estado === 'adeuda' ? 'Adeuda' : 'Próximo';
  }

  protected irAlDetalle(alumnoId: number): void {
    this.router.navigate(['/alumnos', alumnoId]);
  }
}
