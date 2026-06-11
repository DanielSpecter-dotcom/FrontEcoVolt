import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Route guard that protects pages requiring authentication.
 * Redirects to /login if no valid token exists.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not authenticated — redirect to login
  authService.logout(); // clean up any stale data
  router.navigate(['/login']);
  return false;
};
