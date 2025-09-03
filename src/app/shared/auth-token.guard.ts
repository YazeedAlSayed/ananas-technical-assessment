import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

// Guard that forbids accessing token-related routes when a valid token already exists
// Follows the style of the existing authGuard.
export const tokenForbiddenIfAuthenticatedGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // If user already has a live (valid, non-expired) token, forbid access by redirecting
  // them away from this route (send to main app area e.g., /movies)
  return auth.hasValidToken() ? router.createUrlTree(['/movies']) : true;
};
