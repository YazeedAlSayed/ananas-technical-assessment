import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

// Guard for the login route: purge any existing token/state when user visits login page
export const loginPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  auth.purgeOnLoginVisit();
  return true;
};
