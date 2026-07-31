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

  protected readonly archivoPendiente = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);

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
    this.liberarPreview();
    this.archivoPendiente.set(archivo);
    this.previewUrl.set(URL.createObjectURL(archivo));
    input.value = '';
  }

  protected guardarCambios(): void {
    const archivo = this.archivoPendiente();
    if (!archivo) return;

    this.error.set(null);
    this.subiendo.set(true);

    this.negociosService.subirLogo(archivo).subscribe({
      next: (negocio) => {
        this.subiendo.set(false);
        this.negocio.set(negocio);
        this.descartarPendiente();
      },
      error: (err: HttpErrorResponse) => {
        this.subiendo.set(false);
        this.error.set(err.error?.message ?? 'No se pudo guardar el logo. Probá de nuevo.');
      },
    });
  }

  protected quitarImagen(): void {
    this.error.set(null);

    // Si todavía no se guardó (es solo una vista previa local), cancelar es
    // gratis: no hay nada que borrar del lado del servidor.
    if (this.archivoPendiente()) {
      this.descartarPendiente();
      return;
    }

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

  private descartarPendiente(): void {
    this.liberarPreview();
    this.archivoPendiente.set(null);
    this.previewUrl.set(null);
  }

  private liberarPreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
