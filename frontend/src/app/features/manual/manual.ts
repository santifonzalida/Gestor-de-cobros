import { Component } from '@angular/core';
import { StatusBadge } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-manual',
  imports: [StatusBadge],
  templateUrl: './manual.html',
})
export class Manual {
  protected ir(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected volverArriba(): void {
    document.getElementById('tope')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
