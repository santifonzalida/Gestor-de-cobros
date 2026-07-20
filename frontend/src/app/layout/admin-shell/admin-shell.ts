import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
    { label: 'Clases', icon: '🥋', route: '/dashboard/clases', exact: true },
    { label: 'Cuotas', icon: '💳', route: null },
    { label: 'Comprobantes', icon: '📎', route: null },
  ];
}
