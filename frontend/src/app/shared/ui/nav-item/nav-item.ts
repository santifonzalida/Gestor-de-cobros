import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-item',
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (route()) {
      <a
        [routerLink]="route()"
        routerLinkActive="bg-accent-soft text-accent font-semibold"
        [routerLinkActiveOptions]="{ exact: exact() }"
        class="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-page"
      >
        @if (icon()) {
          <span>{{ icon() }}</span>
        }
        {{ label() }}
      </a>
    } @else {
      <span class="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-muted/50">
        @if (icon()) {
          <span>{{ icon() }}</span>
        }
        {{ label() }}
      </span>
    }
  `,
})
export class NavItem {
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly route = input<string | null>(null);
  readonly exact = input(false);
}
