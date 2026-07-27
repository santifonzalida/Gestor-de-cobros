import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaLogueado()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.esAlumno()) {
    router.navigate(['/portal']);
    return false;
  }

  return true;
};
