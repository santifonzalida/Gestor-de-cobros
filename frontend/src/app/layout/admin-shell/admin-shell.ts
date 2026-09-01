import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavItem } from '../../shared/ui/nav-item/nav-item';

interface NavEntry {
  label: string;
  icon: string;
  route: string | null;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, NavItem],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  protected readonly navEntries: NavEntry[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Alumnos', icon: '🧑‍🎓', route: '/alumnos' },
    { label: 'Clases', icon: '🥋', route: '/clases' },
    { label: 'Cuotas', icon: '💳', route: '/cuotas' },
    { label: 'Comprobantes', icon: '📎', route: '/comprobantes' },
    { label: 'Configuración', icon: '⚙️', route: '/configuracion' },
    { label: 'Manual', icon: '📘', route: '/manual' },
  ];

  protected readonly usuario;
  protected readonly mostrarConfirmarSalir = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.usuario = this.authService.usuario;
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
