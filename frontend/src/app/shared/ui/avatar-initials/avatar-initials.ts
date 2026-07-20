import { Component, computed, input } from '@angular/core';
import { BadgeTone } from '../status-badge/status-badge';

const PALETTE = [
  'oklch(0.6 0.15 160)',
  'oklch(0.55 0.18 250)',
  'oklch(0.65 0.19 40)',
  'oklch(0.6 0.14 300)',
  'oklch(0.65 0.15 20)',
  'oklch(0.6 0.12 340)',
];

const RING_CLASSES: Record<BadgeTone, string> = {
  ok: 'ring-4 ring-ok-bg',
  debt: 'ring-4 ring-debt-bg',
  soon: 'ring-4 ring-soon-bg',
};

@Component({
  selector: 'app-avatar-initials',
  template: `
    <div
      class="flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white {{ ringClass() }}"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background]="color()"
      [style.font-size.px]="size() * 0.32"
    >
      {{ iniciales() }}
    </div>
  `,
})
export class AvatarInitials {
  readonly nombre = input.required<string>();
  readonly apellido = input.required<string>();
  readonly seed = input(0);
  readonly size = input(32);
  readonly ring = input<BadgeTone | null>(null);

  protected readonly iniciales = computed(
    () => `${this.nombre().charAt(0)}${this.apellido().charAt(0)}`.toUpperCase(),
  );

  protected color(): string {
    return PALETTE[this.seed() % PALETTE.length];
  }

  protected ringClass(): string {
    const tone = this.ring();
    return tone ? RING_CLASSES[tone] : '';
  }
}
