import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superadminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaLogueado()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.esSuperadmin()) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
