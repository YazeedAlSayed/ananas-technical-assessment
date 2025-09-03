import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './shared/auth.guard';
import { loginPageGuard } from './shared/login.guard';
import { tokenForbiddenIfAuthenticatedGuard } from './shared/auth-token.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [tokenForbiddenIfAuthenticatedGuard, loginPageGuard] },
  { path: 'movies', loadChildren: () => import('./movies/movies.module').then(m => m.MoviesModule), canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
