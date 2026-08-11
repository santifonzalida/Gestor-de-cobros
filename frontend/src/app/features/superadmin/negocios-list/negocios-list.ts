import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NegocioResumen } from '../../../core/models/negocio-resumen.model';
import { SuperadminService } from '../../../core/services/superadmin.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-superadmin-negocios-list',
  imports: [StatusBadge, DatePipe, DecimalPipe],
  templateUrl: './negocios-list.html',
})
export class NegociosList {
  protected readonly negocios = signal<NegocioResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mostrarConfirmarSalir = signal(false);

  constructor(
    private superadminService: SuperadminService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.superadminService.listarNegocios().subscribe((negocios) => {
      this.negocios.set(negocios);
      this.cargando.set(false);
    });
  }

  protected pedirConfirmarSalir(): void {
    this.mostrarConfirmarSalir.set(true);
  }

  protected cancelarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
  }

  protected confirmarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
    this.salir();
  }

  private salir(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
