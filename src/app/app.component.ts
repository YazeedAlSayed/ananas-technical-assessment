import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SpinnerComponent } from './shared/spinner.component';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from './shared/theme.service';
import { CommonModule } from '@angular/common';
import { AuthService } from './shared/auth.service';
import { map, startWith, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SpinnerComponent, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ananas-technical-assessment';
  themeMode: ThemeMode = 'light';

  isLoginRoute$!: Observable<boolean>;
  get isAuthenticated$() { return this.auth.isAuthenticated$; }

  constructor(private theme: ThemeService, public router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    // Initialize theme from saved mode so we don't override user preference
    this.themeMode = this.theme.mode;

    // Track whether current route is the login page (on NavigationEnd) and seed with current URL
    this.isLoginRoute$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url)),
      map((e) => {
        const url = e.urlAfterRedirects ?? this.router.url ?? '/';
        return url.startsWith('/login') || url === '/';
      })
    );
  }

  onThemeChange() {
    this.theme.setMode(this.themeMode);
  }

  onLogout() {
    this.auth.logout();
  }
}
