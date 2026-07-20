import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="p-5 md:p-7">
      <div class="mb-5 flex gap-2">
        <a
          routerLink="resumen"
          routerLinkActive="bg-accent-soft text-accent border-transparent"
          class="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-page"
          >Resumen</a
        >
        <a
          routerLink="operativo"
          routerLinkActive="bg-accent-soft text-accent border-transparent"
          class="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-page"
          >Operativo</a
        >
        <a
          routerLink="clases"
          routerLinkActive="bg-accent-soft text-accent border-transparent"
          class="rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-page"
          >Por clase</a
        >
      </div>
      <router-outlet />
    </div>
  `,
})
export class DashboardShell {}
