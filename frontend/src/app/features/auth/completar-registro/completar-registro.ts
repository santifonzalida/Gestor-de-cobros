import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-completar-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './completar-registro.html',
})
export class CompletarRegistro {
  protected readonly password = signal('');
  protected readonly confirmarPassword = signal('');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly completado = signal(false);
  protected readonly email = signal<string | null>(null);

  private readonly token: string;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Este link de invitación no es válido.');
    } else {
      this.email.set(this.extraerEmail(this.token));
    }
  }

  private extraerEmail(token: string): string | null {
    try {
      const [, payload] = token.split('.');
      const datos = JSON.parse(atob(payload)) as { email?: string };
      return datos.email ?? null;
    } catch {
      return null;
    }
  }

  protected confirmar(): void {
    if (this.password().length < 6) {
      this.error.set('La contraseña tiene que tener al menos 6 caracteres.');
      return;
    }
    if (this.password() !== this.confirmarPassword()) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.error.set(null);
    this.cargando.set(true);

    this.authService.completarInvitacion(this.token, this.password()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.completado.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(err.error?.message ?? 'No se pudo completar el registro.');
      },
    });
  }
}
