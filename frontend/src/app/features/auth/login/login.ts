import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface OpcionDominio {
  value: string;
  label: string;
}

const DOMINIOS: OpcionDominio[] = [
  { value: 'gmail.com', label: '@gmail.com' },
  { value: 'hotmail.com', label: '@hotmail.com' },
  { value: 'outlook.com', label: '@outlook.com' },
  { value: 'yahoo.com', label: '@yahoo.com' },
  { value: 'otro', label: 'Otro' },
];

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  protected readonly dominios = DOMINIOS;

  protected readonly emailLocal = signal('');
  protected readonly dominio = signal(DOMINIOS[0].value);
  protected readonly dominioPersonalizado = signal('');
  protected readonly password = signal('');
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  private emailCompleto(): string {
    const dominio = this.dominio() === 'otro' ? this.dominioPersonalizado().trim() : this.dominio();
    return `${this.emailLocal().trim()}@${dominio}`;
  }

  protected ingresar(): void {
    this.error.set(null);
    this.cargando.set(true);

    this.authService.login(this.emailCompleto(), this.password()).subscribe({
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
