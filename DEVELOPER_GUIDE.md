# Developer Guide

Audience: Developers maintaining or extending this Angular app.
Goal: Quickly locate implementations for each requirement, understand how they work, and know how to modify or test them.

Contents
- 1. Login and Authentication
- 2. Routing, Guards, and Navigation
- 3. Movies Module (Lazy Loaded)
- 4. TMDb API Integration
- 5. Movie Details and Resolver
- 6. TypeScript Models (Strong typing)
- 7. Interceptors (Loader and Auth Token)
- 8. Theme System (Light/Dark/System)
- 9. Global UI Shell and Logout
- 10. Bonus: Search and List UX
- 11. Environment and Configuration
- 12. Quick Start / Testing Tips

---

1. Login and Authentication
- Where
  - Component: src\app\auth\login.component.ts (standalone component)
  - Service: src\app\shared\auth.service.ts
  - Credentials: src\assets\users.json
- How
  - AuthService.loadUsers() fetches users.json and login() validates username/password.
  - On success, a mock JWT-like token is generated (for demo), persisted to localStorage along with expiry, and auth signal is updated.
  - LoginComponent uses Angular Material fields + Bootstrap layout; on submit it calls AuthService.login() and navigates to /movies.
- Modify
  - Change credential source: update users.json format and AuthService.loadUsers() typing if needed.
  - Adjust token/expiry policy in AuthService.login()/persist().
- Test
  - Use credentials from assets\users.json (admin/admin123, user/user123, 1/1).

2. Routing, Guards, and Navigation
- Where
  - Route config: src\app\app.routes.ts
  - Guards:
    - Auth-only: src\app\shared\auth.guard.ts
    - Purge on login visit: src\app\shared\login.guard.ts
    - Forbid login when already authenticated: src\app\shared\auth-token.guard.ts
- How
  - '' redirects to 'login'.
  - 'login' guarded by tokenForbiddenIfAuthenticatedGuard (redirects to /movies if already logged in) then loginPageGuard (purges state if not).
  - 'movies' is lazy-loaded and protected by authGuard (requires valid token).
- Modify
  - Change post-login redirect by editing tokenForbiddenIfAuthenticatedGuard target.
  - Add more feature routes under movies in movies-routing.module.ts.
- Test
  - Toggle localStorage auth keys or use AuthService.logout() to simulate states.

3. Movies Module (Lazy Loaded)
- Where
  - Module: src\app\movies\movies.module.ts (imports standalone components)
  - Routing: src\app\movies\movies-routing.module.ts
  - List Component: src\app\movies\movies-list.component.ts
  - Detail Component: src\app\movies\movie-detail.component.ts
- How
  - Loaded only when navigating to /movies via loadChildren in app.routes.ts.
  - List uses MatCard + Bootstrap grid, supports search, filters, sort, infinite scroll, watchlist toggle, and theme selector.
- Modify
  - Add new filters/controls directly in MoviesListComponent template and handlers.

4. TMDb API Integration
- Where
  - Service: src\app\movies\tmdb.service.ts
  - Environment: src\environments\environment.ts (tmdbApiKey, tmdbBaseUrl, tmdbImageBaseUrl)
- How
  - Exposes discover(), search(), details(), and imageUrl().
  - Applies content filtering (genre/keyword) and optional nsfwjs-based image filtering.
- Modify
  - Map new sorting options in mapSort().
  - Toggle NSFW image filtering with USE_NPM_NSFW_FILTER; adjust threshold in NSFW_BLOCK_THRESHOLD.
- Test
  - Confirm API key set; check network calls and image URLs in DevTools.

5. Movie Details and Resolver
- Where
  - Resolver: src\app\movies\movie-detail.resolver.ts
  - Detail component: src\app\movies\movie-detail.component.ts
- How
  - Route '/movies/:id' resolves MovieDetails via TmdbService before activation.
  - Template shows poster, title, overview, release date, runtime, genres; includes theme selector.
- Modify
  - Extend MovieDetails interface or template to show more fields.

6. TypeScript Models (Strong typing)
- Where
  - src\app\shared\models.ts
- How
  - Interfaces: UserCredential, MovieListItem, MovieDetails used across services/components.
- Modify
  - Add fields as needed and propagate types in services/components.

7. Interceptors (Loader and Auth Token)
- Where
  - LoaderInterceptor: src\app\interceptors\loader.interceptor.ts
  - LoaderService: src\app\interceptors\loader.service.ts
  - Spinner UI: src\app\shared\spinner.component.ts
  - AuthTokenInterceptor: src\app\interceptors\auth-token.interceptor.ts
  - Registration: src\app\app.config.ts (HTTP_INTERCEPTORS providers)
- How
  - Loader: increments/decrements a counter around each HTTP request and shows Spinner backdrop while >0.
  - Auth Token: adds Authorization header if token present; on 401 tries AuthService.refreshToken(), retries once, else logs out.
- Modify
  - Customize global error handling inside the interceptor.
  - Implement real refresh by updating AuthService.refreshToken().

8. Theme System (Light/Dark/System)
- Where
  - Service: src\app\shared\theme.service.ts
  - UI selectors: LoginComponent, MoviesListComponent, MovieDetailComponent; AppComponent reads mode for initial state.
  - Applied via <html data-theme="..."> attribute.
- How
  - Mode persisted in localStorage (app.theme.mode). When 'system' is selected, matchMedia('(prefers-color-scheme: dark)') decides the effective theme and listens to OS changes (with addEventListener/addListener compatibility and cleanup in ngOnDestroy).
- Modify
  - Default mode: change currentMode in ThemeService.
  - Extend themes by reacting to data-theme in global styles.
- Debug
  - Optional debug panel: set localStorage 'app.theme.debug' = '1', see AppComponent panel. Remove key to hide.

9. Global UI Shell and Logout
- Where
  - Root component: src\app\app.component.ts / .html / .css
- How
  - Shows a fixed top bar with "Logout" on all routes except /login and only when authenticated.
  - Spinner component is global.
- Modify
  - Adjust visibility logic in AppComponent.isLoginRoute$.
  - Style bar in app.component.css.

10. Bonus: Search and List UX
- Where
  - MoviesListComponent
- How
  - Search input triggers doSearch(); language, sort, and view mode persist to URL and state; infinite scroll loads more on near-bottom; watchlist maintained in MoviesStateService (see references within list component).
- Modify
  - Add new query params and persist via router.navigate with queryParamsHandling: 'merge'.

11. Environment and Configuration
- Where
  - src\environments\environment.ts (dev)
  - vite.config.js (optional dev server/ngrok allowlist; app primarily uses Angular CLI)
- How
  - API key and base URLs are configured here for TMDb.
- Modify
  - Update tmdbApiKey and endpoints; consider using environment.prod for builds.

12. Quick Start / Testing Tips
- Install & Run
  - npm install
  - ng serve
- Set TMDb Key
  - src\environments\environment.ts → tmdbApiKey
- Auth Flow
  - Login with credentials from assets\users.json.
  - Verify guards: try navigating to /movies without login (redirects to /login); try navigating to /login when logged in (redirects to /movies).
- Interceptors
  - Observe spinner during HTTP calls; simulate 401 handling by stubbing backend or modifying interceptor logic.
- Theme
  - Switch modes via dropdowns; for System mode, toggle OS theme or emulate in Chrome DevTools (Rendering → Emulate CSS media feature: prefers-color-scheme).

References
- Evaluation summary: FINAL_REPORT.txt
- General project info: README.md
