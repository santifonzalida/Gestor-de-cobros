import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlumnoConEstado } from '../../../core/models/alumno.model';
import { EstadoCuota } from '../../../core/models/cuota.model';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CuotasService } from '../../../core/services/cuotas.service';
import { StatTile } from '../../../shared/ui/stat-tile/stat-tile';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { AvatarInitials } from '../../../shared/ui/avatar-initials/avatar-initials';

interface ComprobantePendiente {
  alumno: AlumnoConEstado;
  archivo: string;
}

@Component({
  selector: 'app-dashboard-resumen',
  imports: [StatTile, StatusBadge, AvatarInitials, RouterLink, DecimalPipe, DatePipe],
  templateUrl: './dashboard-resumen.html',
})
export class DashboardResumen {
  protected readonly alumnos = signal<AlumnoConEstado[]>([]);
  protected readonly comprobantesPendientes = signal<ComprobantePendiente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hoy = new Date();

  protected readonly recaudado = computed(() =>
    this.alumnos()
      .filter((a) => a.cuotaActual?.estado === EstadoCuota.PAGADA)
      .reduce((total, a) => total + (a.cuotaActual?.monto ?? 0), 0),
  );

  protected readonly pendiente = computed(() =>
    this.alumnos()
      .filter((a) => a.cuotaActual?.estado === EstadoCuota.PENDIENTE || a.cuotaActual?.estado === EstadoCuota.VENCIDA)
      .reduce((total, a) => total + (a.cuotaActual?.monto ?? 0), 0),
  );

  protected readonly alDia = computed(() => this.alumnos().filter((a) => a.estadoPago === 'al_dia').length);

  protected readonly vencimientosProximos = computed(() =>
    this.alumnos()
      .filter((a) => a.estadoPago === 'proximo' || a.estadoPago === 'adeuda')
      .sort((a, b) => (a.estadoPago === b.estadoPago ? 0 : a.estadoPago === 'adeuda' ? -1 : 1)),
  );

  constructor(
    private alumnosService: AlumnosService,
    private cuotasService: CuotasService,
    private router: Router,
  ) {
    this.alumnosService.listar().subscribe((alumnos) => {
      this.alumnos.set(alumnos);
      this.cuotasService.listarEnRevision().subscribe((cuotas) => {
        this.comprobantesPendientes.set(
          cuotas.map((c) => ({
            alumno: alumnos.find((a) => a.id === c.alumnoId)!,
            archivo: `comprobante_${alumnos.find((a) => a.id === c.alumnoId)?.nombre.toLowerCase()}.jpg`,
          })),
        );
        this.cargando.set(false);
      });
    });
  }

  protected diasParaVencer(fecha: Date): number {
    return Math.ceil((fecha.getTime() - Date.now()) / 86_400_000);
  }

  protected irAlDetalle(alumnoId: number): void {
    this.router.navigate(['/alumnos', alumnoId]);
  }
}
