import { Routes } from '@angular/router';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { DashboardShell } from './features/dashboard/dashboard-shell/dashboard-shell';
import { DashboardResumen } from './features/dashboard/resumen/dashboard-resumen';
import { DashboardOperativo } from './features/dashboard/operativo/dashboard-operativo';
import { DashboardClases } from './features/dashboard/clases/dashboard-clases';
import { AlumnosList } from './features/alumnos/alumnos-list/alumnos-list';
import { AlumnoDetalle } from './features/alumnos/alumno-detalle/alumno-detalle';
import { PortalAlumno } from './features/portal/portal-alumno/portal-alumno';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'dashboard',
    component: AdminShell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardShell,
        children: [
          { path: '', redirectTo: 'resumen', pathMatch: 'full' },
          { path: 'resumen', component: DashboardResumen },
          { path: 'operativo', component: DashboardOperativo },
          { path: 'clases', component: DashboardClases },
        ],
      },
    ],
  },
  {
    path: 'alumnos',
    component: AdminShell,
    canActivate: [authGuard],
    children: [
      { path: '', component: AlumnosList },
      { path: ':id', component: AlumnoDetalle },
    ],
  },
  { path: 'portal', component: PortalAlumno },
  { path: '**', redirectTo: 'dashboard' },
];
