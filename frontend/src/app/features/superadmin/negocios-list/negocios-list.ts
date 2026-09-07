import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NegocioResumen } from '../../../core/models/negocio-resumen.model';
import { InvitarAdminForm, NuevoNegocioForm, SuperadminService } from '../../../core/services/superadmin.service';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

function formNuevoNegocioVacio(): NuevoNegocioForm {
  return { nombre: '', emailAdmin: '' };
}

function formInvitarAdminVacio(): InvitarAdminForm {
  return { email: '', nombre: '', apellido: '' };
}

@Component({
  selector: 'app-superadmin-negocios-list',
  imports: [StatusBadge, DatePipe, FormsModule],
  templateUrl: './negocios-list.html',
})
export class NegociosList {
  protected readonly negocios = signal<NegocioResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly mostrarConfirmarSalir = signal(false);

  protected readonly menuAbiertoId = signal<number | null>(null);
  protected readonly negocioABajar = signal<NegocioResumen | null>(null);
  protected readonly dandoBaja = signal(false);
  protected readonly errorBaja = signal<string | null>(null);

  protected readonly mostrarModalNuevo = signal(false);
  protected readonly formNuevo = signal<NuevoNegocioForm>(formNuevoNegocioVacio());
  protected readonly creandoNegocio = signal(false);
  protected readonly errorNuevo = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  protected readonly negocioAInvitar = signal<NegocioResumen | null>(null);
  protected readonly formInvitar = signal<InvitarAdminForm>(formInvitarAdminVacio());
  protected readonly invitando = signal(false);
  protected readonly errorInvitar = signal<string | null>(null);

  constructor(
    private superadminService: SuperadminService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.cargar();
  }

  private cargar(): void {
    this.superadminService.listarNegocios().subscribe((negocios) => {
      this.negocios.set(negocios);
      this.cargando.set(false);
    });
  }

  protected toggleMenu(id: number): void {
    this.menuAbiertoId.set(this.menuAbiertoId() === id ? null : id);
  }

  protected cerrarMenu(): void {
    this.menuAbiertoId.set(null);
  }

  protected pedirConfirmacionBaja(negocio: NegocioResumen): void {
    this.cerrarMenu();
    this.negocioABajar.set(negocio);
    this.errorBaja.set(null);
  }

  protected cancelarBaja(): void {
    this.negocioABajar.set(null);
  }

  protected confirmarBaja(): void {
    const negocio = this.negocioABajar();
    if (!negocio) return;

    this.errorBaja.set(null);
    this.dandoBaja.set(true);

    this.superadminService.cambiarEstado(negocio.id, false).subscribe({
      next: () => {
        this.dandoBaja.set(false);
        this.negocios.update((lista) => lista.map((n) => (n.id === negocio.id ? { ...n, activo: false } : n)));
        this.negocioABajar.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.dandoBaja.set(false);
        this.errorBaja.set(err.error?.message ?? 'No se pudo dar de baja el negocio. Probá de nuevo.');
      },
    });
  }

  protected abrirNuevoNegocio(): void {
    this.formNuevo.set(formNuevoNegocioVacio());
    this.errorNuevo.set(null);
    this.mostrarModalNuevo.set(true);
  }

  protected cerrarModalNuevo(): void {
    this.mostrarModalNuevo.set(false);
  }

  protected actualizarFormNuevo<K extends keyof NuevoNegocioForm>(campo: K, valor: NuevoNegocioForm[K]): void {
    this.formNuevo.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected guardarNegocio(): void {
    const { nombre, emailAdmin } = this.formNuevo();
    if (!nombre.trim() || !emailAdmin.trim()) {
      this.errorNuevo.set('Nombre del negocio y correo electrónico del admin son obligatorios.');
      return;
    }

    this.errorNuevo.set(null);
    this.creandoNegocio.set(true);

    this.superadminService.crearNegocio({ nombre: nombre.trim(), emailAdmin: emailAdmin.trim() }).subscribe({
      next: (negocio) => {
        this.creandoNegocio.set(false);
        this.mostrarModalNuevo.set(false);
        this.negocios.update((lista) => [...lista, negocio]);
        this.mensajeExito.set(`Se creó "${negocio.nombre}". Cuando quieras, invitá a su admin desde las acciones.`);
      },
      error: (err: HttpErrorResponse) => {
        this.creandoNegocio.set(false);
        this.errorNuevo.set(err.error?.message ?? 'No se pudo crear el negocio. Probá de nuevo.');
      },
    });
  }

  protected cerrarMensajeExito(): void {
    this.mensajeExito.set(null);
  }

  protected pedirInvitarAdmin(negocio: NegocioResumen): void {
    this.cerrarMenu();
    this.negocioAInvitar.set(negocio);
    this.formInvitar.set({ ...formInvitarAdminVacio(), email: negocio.emailAdmin ?? '' });
    this.errorInvitar.set(null);
  }

  protected cancelarInvitarAdmin(): void {
    this.negocioAInvitar.set(null);
  }

  protected actualizarFormInvitar<K extends keyof InvitarAdminForm>(campo: K, valor: InvitarAdminForm[K]): void {
    this.formInvitar.update((actual) => ({ ...actual, [campo]: valor }));
  }

  protected confirmarInvitarAdmin(): void {
    const negocio = this.negocioAInvitar();
    const { email, nombre, apellido } = this.formInvitar();
    if (!negocio || !email.trim()) {
      this.errorInvitar.set('El email es obligatorio.');
      return;
    }

    this.errorInvitar.set(null);
    this.invitando.set(true);

    this.superadminService
      .invitarAdmin(negocio.id, { email: email.trim(), nombre: nombre?.trim() || undefined, apellido: apellido?.trim() || undefined })
      .subscribe({
        next: () => {
          this.invitando.set(false);
          this.negocioAInvitar.set(null);
          this.mensajeExito.set(`Se invitó a ${email.trim()} como admin de "${negocio.nombre}".`);
        },
        error: (err: HttpErrorResponse) => {
          this.invitando.set(false);
          this.errorInvitar.set(err.error?.message ?? 'No se pudo enviar la invitación. Probá de nuevo.');
        },
      });
  }

  protected pedirConfirmarSalir(): void {
    this.mostrarConfirmarSalir.set(true);
  }

  protected cancelarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
  }

  protected confirmarSalir(): void {
    this.mostrarConfirmarSalir.set(false);
    this.salir();
  }

  private salir(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
