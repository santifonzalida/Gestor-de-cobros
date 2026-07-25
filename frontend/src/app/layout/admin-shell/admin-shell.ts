import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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
  imports: [RouterOutlet, NavItem],
  templateUrl: './admin-shell.html',
})
export class AdminShell {
  protected readonly navEntries: NavEntry[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Alumnos', icon: '🧑‍🎓', route: '/alumnos' },
    { label: 'Clases', icon: '🥋', route: '/clases' },
    { label: 'Cuotas', icon: '💳', route: null },
    { label: 'Comprobantes', icon: '📎', route: null },
  ];

  protected readonly usuario;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.usuario = this.authService.usuario;
  }

  protected salir(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
