import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NegocioActual, NegociosService } from '../../core/services/negocios.service';

@Component({
  selector: 'app-configuracion',
  imports: [],
  templateUrl: './configuracion.html',
})
export class Configuracion {
  protected readonly negocio = signal<NegocioActual | undefined>(undefined);
  protected readonly cargando = signal(true);
  protected readonly subiendo = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');

  constructor(private negociosService: NegociosService) {
    this.cargar();
  }

  private cargar(): void {
    this.negociosService.obtenerActual().subscribe((negocio) => {
      this.negocio.set(negocio);
      this.cargando.set(false);
    });
  }

  protected abrirSelectorArchivo(): void {
    this.inputArchivo()?.nativeElement.click();
  }

  protected onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.error.set(null);
    this.subiendo.set(true);

    this.negociosService.subirLogo(archivo).subscribe({
      next: (negocio) => {
        this.subiendo.set(false);
        this.negocio.set(negocio);
      },
      error: (err: HttpErrorResponse) => {
        this.subiendo.set(false);
        this.error.set(err.error?.message ?? 'No se pudo subir el logo. Probá de nuevo.');
        input.value = '';
      },
    });
  }

  protected eliminarLogo(): void {
    this.error.set(null);
    this.eliminando.set(true);

    this.negociosService.eliminarLogo().subscribe({
      next: (negocio) => {
        this.eliminando.set(false);
        this.negocio.set(negocio);
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false);
        this.error.set(err.error?.message ?? 'No se pudo quitar el logo.');
      },
    });
  }
}
