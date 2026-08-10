import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { NegocioActual, NegociosService } from '../../core/services/negocios.service';
import { UsuariosService } from '../../core/services/usuarios.service';

@Component({
  selector: 'app-configuracion',
  imports: [FormsModule],
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

  protected readonly nombreNegocio = signal('');
  protected readonly guardandoNombre = signal(false);
  protected readonly errorNombre = signal<string | null>(null);
  protected readonly mensajeNombre = signal<string | null>(null);

  protected readonly cargandoPerfil = signal(true);
  protected readonly perfilNombre = signal('');
  protected readonly perfilApellido = signal('');
  protected readonly guardandoPerfil = signal(false);
  protected readonly errorPerfil = signal<string | null>(null);
  protected readonly mensajePerfil = signal<string | null>(null);

  private readonly inputArchivo = viewChild<ElementRef<HTMLInputElement>>('inputArchivo');

  constructor(
    private negociosService: NegociosService,
    private usuariosService: UsuariosService,
  ) {
    this.cargar();
    this.cargarPerfil();
  }

  private cargar(): void {
    this.negociosService.obtenerActual().subscribe((negocio) => {
      this.negocio.set(negocio);
      this.nombreNegocio.set(negocio.nombre);
      this.cargando.set(false);
    });
  }

  private cargarPerfil(): void {
    this.usuariosService.obtenerPerfil().subscribe((perfil) => {
      this.perfilNombre.set(perfil.nombre ?? '');
      this.perfilApellido.set(perfil.apellido ?? '');
      this.cargandoPerfil.set(false);
    });
  }

  protected guardarNombreNegocio(): void {
    const nombre = this.nombreNegocio().trim();
    if (!nombre) {
      this.errorNombre.set('El nombre no puede estar vacío.');
      return;
    }

    this.errorNombre.set(null);
    this.mensajeNombre.set(null);
    this.guardandoNombre.set(true);

    this.negociosService.actualizarNombre(nombre).subscribe({
      next: (negocio) => {
        this.guardandoNombre.set(false);
        this.negocio.set(negocio);
        this.nombreNegocio.set(negocio.nombre);
        this.mensajeNombre.set('Nombre actualizado.');
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoNombre.set(false);
        this.errorNombre.set(err.error?.message ?? 'No se pudo guardar el nombre. Probá de nuevo.');
      },
    });
  }

  protected guardarPerfil(): void {
    const nombre = this.perfilNombre().trim();
    const apellido = this.perfilApellido().trim();
    if (!nombre || !apellido) {
      this.errorPerfil.set('Nombre y apellido son obligatorios.');
      return;
    }

    this.errorPerfil.set(null);
    this.mensajePerfil.set(null);
    this.guardandoPerfil.set(true);

    this.usuariosService.actualizarPerfil(nombre, apellido).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.mensajePerfil.set('Datos actualizados.');
      },
      error: (err: HttpErrorResponse) => {
        this.guardandoPerfil.set(false);
        this.errorPerfil.set(err.error?.message ?? 'No se pudo guardar el perfil. Probá de nuevo.');
      },
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
