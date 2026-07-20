import { Component, input } from '@angular/core';

export type StatTone = 'default' | 'ok' | 'debt';

const TONE_CLASSES: Record<StatTone, string> = {
  default: 'text-text',
  ok: 'text-ok-text',
  debt: 'text-debt-text',
};

@Component({
  selector: 'app-stat-tile',
  template: `
    <div class="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <span class="text-xs text-text-muted">{{ label() }}</span>
      <span class="font-display text-2xl font-bold {{ toneClass() }}">{{ value() }}</span>
    </div>
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly tone = input<StatTone>('default');

  protected toneClass(): string {
    return TONE_CLASSES[this.tone()];
  }
}
