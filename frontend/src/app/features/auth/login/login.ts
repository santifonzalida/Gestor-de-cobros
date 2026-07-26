import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  protected ingresar(): void {
    this.error.set(null);
    this.cargando.set(true);

    this.authService.login(this.email(), this.password()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.router.navigateByUrl(respuesta.ruta);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Email o contraseña incorrectos.');
      },
    });
  }
}
