import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserCredential } from './models';
import { map, Observable, of, throwError } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: string | null;
}

const LS_TOKEN_KEY = 'auth.token';
const LS_USER_KEY = 'auth.user';
const LS_EXP_KEY = 'auth.exp';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private state = signal<AuthState>({ isAuthenticated: false, token: null, user: null });

  // Expose auth status as Observable using Angular's toObservable for signals
  readonly isAuthenticated$ = toObservable(this.state).pipe(map((s) => s.isAuthenticated));

  constructor(private http: HttpClient, private router: Router) {
    // Restore auth from localStorage if valid
    const token = localStorage.getItem(LS_TOKEN_KEY);
    const user = localStorage.getItem(LS_USER_KEY);
    const expStr = localStorage.getItem(LS_EXP_KEY);
    const exp = expStr ? parseInt(expStr, 10) : 0;
    if (token && user && exp && Date.now() < exp) {
      this.state.set({ isAuthenticated: true, token, user });
    } else {
      this.clearStorage();
    }
  }

  loadUsers(): Observable<UserCredential[]> {
    // Angular serves assets from the /assets folder at app root
    return this.http.get<UserCredential[]>('assets/users.json');
  }

  private generateMockJwt(payload: any): string {
    // Minimal, unsigned JWT-like token for demo purposes only
    const header = { alg: 'none', typ: 'JWT' };
    const b64 = (obj: any) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    return `${b64(header)}.${b64(payload)}.`; // no signature
  }

  private persist(token: string, user: string, exp: number) {
    localStorage.setItem(LS_TOKEN_KEY, token);
    localStorage.setItem(LS_USER_KEY, user);
    localStorage.setItem(LS_EXP_KEY, String(exp));
  }

  private clearStorage() {
    localStorage.removeItem(LS_TOKEN_KEY);
    localStorage.removeItem(LS_USER_KEY);
    localStorage.removeItem(LS_EXP_KEY);
  }

  private markLoggedIn(token: string, user: string) {
    this.state.set({ isAuthenticated: true, token, user });
  }

  private markLoggedOut() {
    this.state.set({ isAuthenticated: false, token: null, user: null });
  }

  login(username: string, password: string): Observable<boolean> {
    return this.loadUsers().pipe(
      map((users) => users.some((u) => u.username === username && u.password === password)),
      map((ok) => {
        if (ok) {
          const exp = Date.now() + 300_000; // 5 minutes
          const token = this.generateMockJwt({ sub: username, exp });
          this.persist(token, username, exp);
          this.markLoggedIn(token, username);
          return true;
        }
        return false;
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.markLoggedOut();
    this.router.navigate(['/login']);
  }

  // Clear token/state when visiting login page as per requirement
  purgeOnLoginVisit(): void {
    this.clearStorage();
    this.markLoggedOut();
  }

  // Returns true if a valid (non-expired) token exists
  hasValidToken(): boolean {
    const expStr = localStorage.getItem(LS_EXP_KEY);
    const token = localStorage.getItem(LS_TOKEN_KEY);
    const user = localStorage.getItem(LS_USER_KEY);
    const exp = expStr ? parseInt(expStr, 10) : 0;
    const valid = !!token && !!user && !!exp && Date.now() < exp;
    if (!valid) {
      // Ensure state is cleared if expired
      this.clearStorage();
      this.markLoggedOut();
      return false;
    }
    // Keep signal state in sync
    if (!this.state().isAuthenticated || this.state().token !== token) {
      this.markLoggedIn(token!, user!);
    }
    return true;
  }

  get token(): string | null {
    // Only return token if still valid
    return this.hasValidToken() ? localStorage.getItem(LS_TOKEN_KEY) : null;
  }

  // Minimal refresh flow to satisfy interceptor expectations without extending expiry
  refreshToken(): Observable<string> {
    if (!this.hasValidToken()) {
      return throwError(() => new Error('no-token'));
    }
    const token = localStorage.getItem(LS_TOKEN_KEY)!;
    return of(token);
  }
}
