import { Component, computed, signal } from '@angular/core';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { Clase } from '../../../core/models/clase.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ClasesService } from '../../../core/services/clases.service';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';
import { BadgeTone } from '../../../shared/ui/status-badge/status-badge';

interface GrupoClase {
  clase: Clase;
  alumnos: AlumnoConEstado[];
  adeudan: number;
}

@Component({
  selector: 'app-dashboard-clases',
  imports: [AvatarInitials],
  templateUrl: './dashboard-clases.html',
})
export class DashboardClases {
  private readonly alumnos = signal<AlumnoConEstado[]>([]);
  private readonly clases = signal<Clase[]>([]);

  protected readonly grupos = computed<GrupoClase[]>(() =>
    this.clases().map((clase) => {
      const deLaClase = this.alumnos().filter((a) => a.clase?.id === clase.id);
      return {
        clase,
        alumnos: deLaClase,
        adeudan: deLaClase.filter((a) => a.estadoPago === 'adeuda').length,
      };
    }),
  );

  constructor(
    private alumnosService: AlumnosService,
    private clasesService: ClasesService,
  ) {
    this.alumnosService.listar().subscribe((alumnos) => this.alumnos.set(alumnos));
    this.clasesService.listar().subscribe((clases) => this.clases.set(clases));
  }

  protected ring(estado: AlumnoConEstado['estadoPago']): BadgeTone {
    return estado === 'al_dia' ? 'ok' : estado === 'adeuda' ? 'debt' : 'soon';
  }
}
