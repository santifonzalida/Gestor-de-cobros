import { Routes } from '@angular/router';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { DashboardShell } from './features/dashboard/dashboard-shell/dashboard-shell';
import { DashboardResumen } from './features/dashboard/resumen/dashboard-resumen';
import { DashboardOperativo } from './features/dashboard/operativo/dashboard-operativo';
import { AlumnosList } from './features/alumnos/alumnos-list/alumnos-list';
import { AlumnoDetalle } from './features/alumnos/alumno-detalle/alumno-detalle';
import { ClasesList } from './features/clases/clases-list/clases-list';
import { CuotasList } from './features/cuotas/cuotas-list/cuotas-list';
import { PortalAlumno } from './features/portal/portal-alumno/portal-alumno';
import { Login } from './features/auth/login/login';
import { CompletarRegistro } from './features/auth/completar-registro/completar-registro';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'completar-registro', component: CompletarRegistro },
  {
    path: 'dashboard',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        component: DashboardShell,
        children: [
          { path: '', redirectTo: 'resumen', pathMatch: 'full' },
          { path: 'resumen', component: DashboardResumen },
          { path: 'operativo', component: DashboardOperativo },
        ],
      },
    ],
  },
  {
    path: 'alumnos',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AlumnosList },
      { path: ':id', component: AlumnoDetalle },
    ],
  },
  {
    path: 'clases',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [{ path: '', component: ClasesList }],
  },
  {
    path: 'cuotas',
    component: AdminShell,
    canActivate: [adminGuard],
    children: [{ path: '', component: CuotasList }],
  },
  { path: 'portal', component: PortalAlumno, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
