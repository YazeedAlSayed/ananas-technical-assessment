import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { TmdbService } from './tmdb.service';
import { MovieListItem } from '../shared/models';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCard, MatCardActions, MatCardTitle } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MoviesStateService } from './movies-state.service';
import { ThemeService, ThemeMode } from '../shared/theme.service';

@Component({
  selector: 'app-movies-list',
  template: `
    <div class="container mt-4">
      <div class="row mb-3">
        <div class="col-12 col-md-4">
          <input class="form-control" placeholder="Search movies..." [(ngModel)]="query" (keyup.enter)="doSearch()"/>
        </div>
        <div class="col-12 col-md-2 mt-2 mt-md-0">
          <button class="btn btn-primary w-100 primary-ananas-button" (click)="doSearch()" [disabled]="loading">{{ loading ? 'Loading...' : 'Search' }}</button>
        </div>
        <div class="col-12 col-md-2 mt-2 mt-md-0">
          <button class="btn btn-primary w-100 primary-ananas-button" (click)="resetFilters()" [disabled]="loading" aria-label="Reset filters to defaults">Reset filters</button>
        </div>
        <div class="col-12 col-md-4" style="visibility: hidden">
          <button class="btn btn-primary w-100 primary-ananas-button" (click)="resetFilters()" [disabled]="loading" aria-label="Reset filters to defaults">Reset filters</button>
        </div>
        <div class="col-12 col-md-4 mt-2">
          <div class="input-group">
            <label class="input-group-text" for="languageSelect">Language</label>
            <select id="languageSelect" class="form-select" [(ngModel)]="language" (change)="onLanguageChange()">
              <option value="">All</option>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="col-12 col-md-4 mt-2">
          <div class="input-group">
            <label class="input-group-text" for="sortSelect">Sort</label>
            <select id="sortSelect" class="form-select" [(ngModel)]="sortBy" (change)="onSortChange()">
              <option value="">Default</option>
              <option value="rating_desc">Rating: best to worst</option>
              <option value="rating_asc">Rating: worst to best</option>
              <option value="date_desc">Release date: newest first</option>
              <option value="date_asc">Release date: oldest first</option>
              <option value="title_asc">Alphabetical: A → Z</option>
              <option value="title_desc">Alphabetical: Z → A</option>
            </select>
          </div>
        </div>
        <div class="col-12 col-md-4 mt-2">
          <div class="input-group">
            <label class="input-group-text" for="themeSelect">Theme</label>
            <select id="themeSelect" class="form-select" [(ngModel)]="themeMode" (change)="onThemeChange()">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row" *ngIf="error">
        <div class="col-12">
          <div class="alert alert-danger">{{ error }}</div>
        </div>
      </div>

      <div class="row g-3" *ngIf="!loading && movies?.length; else emptyOrLoading">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 movie-col" *ngFor="let m of movies; trackBy: trackById">
          <mat-card class="movie-card">
            <img mat-card-image [src]="image(m.poster_path)" (error)="onImgError($event)" [alt]="m.title"/>
            <mat-card-title class="mt-2 movie-title">{{ m.title }}</mat-card-title>
            <div class="movie-meta">
              <span class="badge bg-light text-dark me-2" *ngIf="m.original_language" [attr.aria-label]="'Original language ' + m.original_language">
                {{ m.original_language | uppercase }}
              </span>
              <span class="me-2" *ngIf="m.release_date">{{ m.release_date | date:'y' }}</span>
              <span class="rating" *ngIf="m.vote_average != null" [attr.aria-label]="'Rating ' + (m.vote_average/2 | number:'1.1-1') + ' out of 5'">
                ★ {{ (m.vote_average/2) | number:'1.1-1' }}
              </span>
            </div>
            <div class="movie-overview text-muted" *ngIf="m.overview">{{ m.overview }}</div>
            <mat-card-actions>
              <button mat-raised-button color="primary" class="primary-ananas-button" (click)="view(m.id)" [attr.aria-label]="'View details for ' + m.title">More info</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <ng-template #emptyOrLoading>
        <div class="text-center text-muted py-5" *ngIf="loading">Loading movies...</div>
        <div class="text-center text-muted py-5" *ngIf="!loading && !movies?.length">No movies to display.</div>
      </ng-template>

      <!-- Floating Scroll-to-Top button (only on movie list page) -->
      <button type="button"
              class="scroll-top-btn"
              aria-label="Scroll to top"
              (click)="scrollToTop()">
        ↑
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
    /* Make each grid column a flex container so its child card can stretch */
    .movie-col { display: flex; }
    /* Ensure the Material card fills the full width/height of its column */
    .movie-card { width: 100%; height: 100%; display: flex; flex-direction: column; transition: transform .15s ease, box-shadow .15s ease; padding: 12px; }
    /* Add inner spacing between elements */
    .movie-card:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15); }
    /* Maintain poster aspect ratio similar to IMDb (2:3) */
    .movie-card img[mat-card-image] { width: 100%; aspect-ratio: 2 / 3; height: auto; object-fit: cover; border-radius: .25rem; }
    /* Title clamp */
    .movie-title { font-size: 1rem; line-height: 1.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.5rem; }
    /* Meta row */
    .movie-meta { font-size: .9rem; display: flex; align-items: center; gap: .25rem; margin-bottom: .25rem; flex-wrap: wrap; }
    .rating { color: #f5c518; font-weight: 600; }
    /* Overview clamp for tidy cards */
    .movie-overview { font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; min-height: 3.6rem; }
    /* Push actions to the bottom so the card uses full height nicely */
    .movie-card mat-card-actions, .movie-card .mat-mdc-card-actions { margin-top: auto; }
    /* Scroll-to-top floating button */
    .scroll-top-btn { position: fixed; right: 16px; bottom: 16px; z-index: 1500; width: 44px; height: 44px; border-radius: 22px; border: 1px solid rgba(0,0,0,0.15); background: #ffffff; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; font-size: 20px; line-height: 1; display: flex; align-items: center; justify-content: center; }
    :host-context([data-theme="dark"]) .scroll-top-btn { background: #2a2a2a; color: #f1f1f1; border-color: rgba(255,255,255,0.2); }
    .scroll-top-btn:hover { transform: translateY(-1px); }
    `
  ],
  imports: [
    MatCard,
    MatCardTitle,
    MatCardActions,
    FormsModule,
    CommonModule,
    MatDialogModule
  ]
})
export class MoviesListComponent implements OnInit, OnDestroy, AfterViewInit {
  movies: MovieListItem[] = [];
  query = '';
  sortBy: string = '';
  language: '' | 'ar' | 'en' | 'other' = 'en';
  viewMode: 'navigate' | 'popup' = 'navigate';
  loading = false;
  error: string | null = null;
  themeMode: ThemeMode = 'light'; // will be synced from ThemeService on init

  private destroy$ = new Subject<void>();

  constructor(private tmdb: TmdbService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef, private state: MoviesStateService, private zone: NgZone, private dialog: MatDialog, private theme: ThemeService) {}

  ngOnInit(): void {
    // Sync theme dropdown with saved mode
    this.themeMode = this.theme.mode;
    // Read filters from URL if present (allows preserving filters on back/forward and shareable links)
    const qp = this.route.snapshot.queryParamMap;
    const qpSort = qp.get('sort');
    const qpLang = qp.get('lang') as any;
    const qpView = qp.get('view') as any;
    const qpQuery = qp.get('q') || '';

    // Prefer URL params when provided; otherwise fall back to persisted state
    this.query = qp.has('q') ? qpQuery : this.state.query;
    this.sortBy = qpSort ?? this.state.sortBy;
    this.viewMode = (qpView as any) || this.state.viewMode;
    // Respect presence of lang param even if it's an empty string (meaning "All")
    this.language = qp.has('lang') ? ((qp.get('lang') as any) || '') : ((this.state.language as any) || 'en');

    // If URL is missing filter params, initialize them so filters are always saved in the URL
    const initParams: any = {};
    if (!qp.has('q') && this.query) initParams.q = this.query;
    if (!qp.has('sort') && this.sortBy) initParams.sort = this.sortBy;
    if (!qp.has('lang')) initParams.lang = (this.language ?? ''); // write even if empty string to represent "All"
    if (!qp.has('view') && this.viewMode) initParams.view = this.viewMode;
    if (Object.keys(initParams).length) {
      this.router.navigate([], { relativeTo: this.route, queryParams: initParams, queryParamsHandling: 'merge', replaceUrl: true });
    }

    // Restore list if we have cached movies
    if (this.state.movies && this.state.movies.length) {
      this.movies = this.applyLanguageFilter(this.state.movies);
      // Seed knownIds from restored list to prevent duplicates
      this.knownIds = new Set(this.movies.map(m => m.id));
      // Do not re-sort on restore to keep stable order during session
      this.page = this.state.page || Math.max(1, Math.ceil(this.movies.length / 20));
      this.totalPages = this.state.totalPages || this.totalPages;
      this.loading = false;
      this.error = null;
      this.cdr.markForCheck();
      // Ensure we can still load more if restored content is short
      setTimeout(() => this.maybeAutoLoadMore(), 0);
    } else {
      // fresh load (popular or search depending on query)
      if (this.query) {
        this.loadSearch(this.query);
      } else {
        this.loadPopular();
      }
    }
  }

  ngOnDestroy(): void {
    // Persist state when leaving
    this.state.movies = this.movies;
    this.state.query = this.query;
    this.state.sortBy = this.sortBy;
    this.state.viewMode = this.viewMode;
    this.state.language = this.language;
    this.state.page = this.page;
    this.state.totalPages = this.totalPages;
    this.state.scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    this.zone.runOutsideAngular(() => window.removeEventListener('scroll', this.onScroll));
    this.destroy$.next();
    this.destroy$.complete();
  }

  private readonly placeholder = '/placeholder-poster.svg';

  image(path: string | null): string {
    return this.tmdb.imageUrl(path) || this.placeholder;
  }

  onImgError(evt: Event) {
    const img = evt.target as HTMLImageElement;
    if (img && img.src !== location.origin + this.placeholder) {
      img.src = this.placeholder;
    }
  }

  // Normalize title for sorting: lowercase, strip diacritics/punctuation, remove leading articles
  private normalizeTitle(m: MovieListItem): string {
    const raw = (m.title || m.original_title || '').toLowerCase();
    // Normalize Unicode and strip diacritics
    const noDiacritics = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    // Remove leading English articles for comparison
    const noArticles = noDiacritics.replace(/^(the|a|an)\s+/, '');
    // Remove punctuation, collapse spaces
    return noArticles.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private page = 1;
  private totalPages = 1;
  private loadingMore = false;

  private loadPopular(reset = true) {
    if (reset) { this.page = 1; this.totalPages = 1; this.movies = []; }
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    this.tmdb
      .discover(this.page, this.sortBy, this.language)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (r) => { this.totalPages = r.total_pages; this.state.totalPages = this.totalPages; this.appendMovies(this.applyLanguageFilter(r.results), reset); this.maybeAutoLoadMore(); },
        error: () => { this.error = 'Failed to load movies.'; this.cdr.markForCheck(); }
      });
  }

  private loadSearch(q: string, reset = true) {
    if (reset) { this.page = 1; this.totalPages = 1; this.movies = []; }
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    this.tmdb
      .search(q, this.page, this.language)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (r) => { this.totalPages = r.total_pages; this.state.totalPages = this.totalPages; this.appendMovies(this.applyLanguageFilter(r.results), reset); this.maybeAutoLoadMore(); },
        error: () => { this.error = 'Search failed.'; this.cdr.markForCheck(); }
      });
  }

  doSearch() {
    const q = this.query.trim();
    this.state.query = this.query = q; // persist query
    // reflect in URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q || null, sort: this.sortBy || null, lang: (this.language === '' ? '' : this.language || null), view: this.viewMode || null },
      queryParamsHandling: 'merge'
    });
    if (!q) {
      this.loadPopular(true);
    } else {
      this.loadSearch(q, true);
    }
  }

  onSortChange() {
    // Persist selection and reflect it in the URL so it survives navigation
    this.state.sortBy = this.sortBy;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.query || null, sort: this.sortBy || null, lang: (this.language === '' ? '' : this.language || null), view: this.viewMode || null },
      queryParamsHandling: 'merge'
    });
    // Reset and reload from API so that ordering reflects TMDB, not just client-side slice
    const q = this.query.trim();
    if (!q) {
      this.loadPopular(true);
    } else {
      // Search endpoint can't server-sort; we still reset to re-apply client-side sort consistently
      this.loadSearch(q, true);
    }
  }

  onViewModeChange() {
    this.state.viewMode = this.viewMode;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view: this.viewMode || null },
      queryParamsHandling: 'merge'
    });
  }

  onLanguageChange() {
    // Persist and reload based on current mode (popular vs search)
    this.state.language = this.language;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lang: (this.language === '' ? '' : this.language || null) },
      queryParamsHandling: 'merge'
    });
    const q = this.query.trim();
    if (!q) {
      this.loadPopular(true);
    } else {
      this.loadSearch(q, true);
    }
  }

  onThemeChange() {
    this.theme.setMode(this.themeMode);
  }

  resetFilters() {
    // Reset filters to default values
    this.query = '';
    this.sortBy = '';
    this.language = 'en';
    this.state.query = '';
    this.state.sortBy = '';
    this.state.language = 'en';
    // reflect in URL: remove q and sort, set lang to default 'en', keep current view mode
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, sort: null, lang: this.language || null, view: this.viewMode || null },
      queryParamsHandling: 'merge'
    });
    // Reload popular with reset
    this.loadPopular(true);
  }

  ngAfterViewInit(): void {
    // Restore scroll after view stabilized if we have cached movies
    if (this.state.movies && this.state.movies.length && this.state.scrollTop > 0) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => window.scrollTo({ top: this.state.scrollTop, behavior: 'auto' }), 0);
      });
    }
    // Setup infinite scroll listener
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      // In case the first page is too short to enable scrolling, attempt auto-load
      setTimeout(() => this.maybeAutoLoadMore(), 0);
    });
  }

  private onScroll = () => {
    const threshold = 300; // px from bottom
    const pos = (window.innerHeight + window.scrollY);
    const max = document.documentElement.scrollHeight;
    if (max - pos < threshold) {
      this.loadNextPageIfPossible();
    }
  };

  private loadNextPageIfPossible() {
    if (!this.loadingMore && this.page < this.totalPages) {
      this.loadingMore = true;
      this.page += 1;
      this.state.page = this.page;
      const q = this.query.trim();
      const done = () => { this.loadingMore = false; this.cdr.markForCheck(); this.state.movies = this.movies; this.state.totalPages = this.totalPages; };
      if (!q) {
        this.tmdb.discover(this.page, this.sortBy, this.language).pipe(takeUntil(this.destroy$)).subscribe({
          next: (r) => { this.totalPages = r.total_pages; this.appendMovies(this.applyLanguageFilter(r.results), false); done(); this.maybeAutoLoadMore(); },
          error: () => { done(); }
        });
      } else {
        this.tmdb.search(q, this.page, this.language).pipe(takeUntil(this.destroy$)).subscribe({
          next: (r) => { this.totalPages = r.total_pages; this.appendMovies(this.applyLanguageFilter(r.results), false); done(); this.maybeAutoLoadMore(); },
          error: () => { done(); }
        });
      }
    }
  }

  private maybeAutoLoadMore() {
    // If the content height is not exceeding the viewport, try to load next page
    // Additionally, when language filter is 'other', the first page may only yield ~3 items;
    // to improve UX (no scroll available), proactively fetch next page once.
    const viewport = window.innerHeight;
    const content = document.documentElement.scrollHeight;
    if (content <= viewport + 50) {
      this.loadNextPageIfPossible();
    }
  }


  private knownIds = new Set<number>();

  trackById = (_: number, m: MovieListItem) => m.id;

  private appendMovies(items: MovieListItem[], reset: boolean) {
    if (reset) {
      this.knownIds.clear();
      const base = items.filter(m => {
        const isNew = !this.knownIds.has(m.id);
        if (isNew) this.knownIds.add(m.id);
        return isNew;
      });
      this.movies = base;
      // Only sort on reset so existing rows are not reshuffled during infinite scroll
      this.applySort();
    } else {
      const newOnes = items.filter(m => {
        const isNew = !this.knownIds.has(m.id);
        if (isNew) this.knownIds.add(m.id);
        return isNew;
      });
      // For discover without title sorts, server already returns ordered pages; append directly
      const isDiscover = !this.query.trim();
      const titleSort = this.sortBy === 'title_asc' || this.sortBy === 'title_desc';
      if (isDiscover && !titleSort) {
        this.movies = [...this.movies, ...newOnes];
      } else {
        // For search or title sorts, avoid reshuffling earlier items: sort the new items only, then append
        if (titleSort) {
          const titleKey = (m: MovieListItem) => this.normalizeTitle(m);
          newOnes.sort((a,b) => {
            const tA = titleKey(a);
            const tB = titleKey(b);
            const cmp = tA.localeCompare(tB, 'en', { sensitivity: 'base', numeric: true });
            return this.sortBy === 'title_desc' ? -cmp : cmp;
          });
        } else if (this.sortBy === 'rating_desc') {
          newOnes.sort((a,b) => (typeof b.vote_average === 'number' ? b.vote_average : -Infinity) - (typeof a.vote_average === 'number' ? a.vote_average : -Infinity));
        } else if (this.sortBy === 'rating_asc') {
          newOnes.sort((a,b) => (a.vote_average ?? Infinity) - (b.vote_average ?? Infinity));
        } else if (this.sortBy === 'date_desc' || this.sortBy === 'date_asc') {
          const safeDate = (s?: string) => s ? new Date(s).getTime() : 0;
          newOnes.sort((a,b) => this.sortBy === 'date_desc' ? (safeDate(b.release_date) - safeDate(a.release_date)) : (safeDate(a.release_date) - safeDate(b.release_date)));
        }
        this.movies = [...this.movies, ...newOnes];
      }
    }
    this.state.movies = this.movies;
    this.cdr.markForCheck();
  }

  private applyLanguageFilter(items: MovieListItem[]): MovieListItem[] {
    if (!this.language) return items;
    if (this.language === 'other') {
      return items.filter(m => m.original_language && m.original_language !== 'ar' && m.original_language !== 'en');
    }
    return items.filter(m => m.original_language === this.language);
  }

  applySort() {
    const sort = this.sortBy;
    if (!sort) { return; }

    // For discover (no search query), we usually rely on TMDB ordering; however,
    // for title sorts we apply a stronger client-side normalization to ensure
    // intuitive A↔Z ordering.
    const isDiscover = !this.query.trim();
    if (isDiscover && sort !== 'title_asc' && sort !== 'title_desc') {
      return; // already sorted by server for other sort types
    }

    const safeDate = (s?: string) => s ? new Date(s).getTime() : 0;
    const titleKey = (m: MovieListItem) => this.normalizeTitle(m);
    const arr = this.movies.slice();
    switch (sort) {
      case 'rating_desc':
        arr.sort((a,b) => (typeof b.vote_average === 'number' ? b.vote_average : -Infinity) - (typeof a.vote_average === 'number' ? a.vote_average : -Infinity));
        break;
      case 'rating_asc':
        arr.sort((a,b) => (a.vote_average ?? Infinity) - (b.vote_average ?? Infinity));
        break;
      case 'date_desc':
        arr.sort((a,b) => safeDate(b.release_date) - safeDate(a.release_date));
        break;
      case 'date_asc':
        arr.sort((a,b) => safeDate(a.release_date) - safeDate(b.release_date));
        break;
      case 'title_asc':
        arr.sort((a,b) => {
          const tA = titleKey(a);
          const tB = titleKey(b);
          const cmp = tA.localeCompare(tB, 'en', { sensitivity: 'base', numeric: true });
          return cmp !== 0 ? cmp : (a.id - b.id);
        });
        break;
      case 'title_desc':
        arr.sort((a,b) => {
          const tA = titleKey(a);
          const tB = titleKey(b);
          const cmp = tB.localeCompare(tA, 'en', { sensitivity: 'base', numeric: true });
          return cmp !== 0 ? cmp : (b.id - a.id);
        });
        break;
      default:
        return;
    }
    this.movies = arr;
    this.state.movies = this.movies;
    this.state.sortBy = this.sortBy;
    this.cdr.markForCheck();
  }

  view(id: number) {
    // Persist current state
    this.state.movies = this.movies;
    this.state.query = this.query;
    this.state.scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (this.viewMode === 'popup') {
      // Open modal dialog with details; stay on the same page and position
      import('./movie-detail.dialog').then(m => {
        this.dialog.open(m.MovieDetailDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: { id }
        });
      });
    } else {
      this.router.navigate(['/movies', id], { queryParamsHandling: 'preserve' });
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
