import { Component, input } from '@angular/core';

export type BadgeTone = 'ok' | 'debt' | 'soon';

const TONE_CLASSES: Record<BadgeTone, string> = {
  ok: 'bg-ok-bg text-ok-text',
  debt: 'bg-debt-bg text-debt-text',
  soon: 'bg-soon-bg text-soon-text',
};

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap {{ toneClass() }}">
      <ng-content />
    </span>
  `,
})
export class StatusBadge {
  readonly tone = input<BadgeTone>('ok');

  protected toneClass(): string {
    return TONE_CLASSES[this.tone()];
  }
}
