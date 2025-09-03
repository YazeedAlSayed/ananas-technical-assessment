import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { WatchlistService } from '../shared/watchlist.service';
import { TmdbService } from './tmdb.service';
import { MovieListItem } from '../shared/models';
import { MatCard, MatCardTitle, MatCardActions } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, MatCard, MatCardTitle, MatCardActions, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">My Watchlist</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" (click)="export()">Export</button>
          <button class="btn btn-outline-secondary" (click)="goBack()">← Back</button>
        </div>
      </div>

      <div *ngIf="loading" class="text-center text-muted py-5">Loading watchlist...</div>
      <div *ngIf="!loading && items.length === 0" class="text-center text-muted py-5">
        Your watchlist is empty.
      </div>

      <div class="row g-3" *ngIf="!loading && items.length">
        <div class="col-12 col-sm-6 col-md-4 col-lg-3" *ngFor="let m of items; trackBy: trackById">
          <mat-card class="movie-card">
            <img mat-card-image [src]="image(m.poster_path)" (error)="onImgError($event)" [alt]="m.title"/>
            <mat-card-title class="mt-2">{{ m.title }}</mat-card-title>
            <div class="text-muted small mb-2">
              <span *ngIf="m.release_date">{{ m.release_date | date:'y' }}</span>
            </div>
            <mat-card-actions>
              <button class="btn btn-primary primary-ananas-button" (click)="open(m.id)">View Details</button>
              <button class="btn btn-outline-danger ms-2" (click)="remove(m.id)">Remove</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .movie-card img[mat-card-image] { width: 100%; aspect-ratio: 2 / 3; height: auto; object-fit: cover; border-radius: .25rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WatchlistComponent implements OnInit, OnDestroy {
  items: MovieListItem[] = [];
  loading = false;
  private destroy$ = new Subject<void>();
  private readonly placeholder = '/placeholder-poster.svg';

  constructor(private watch: WatchlistService, private tmdb: TmdbService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.watch.list$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((ids) => {
          if (!ids || ids.length === 0) {
            return of([] as MovieListItem[]);
          }
          // Fetch minimal info for each movie by ID using details(); map to list shape
          const calls = ids.map((id) => this.tmdb.details(id));
          return forkJoin(calls);
        }),
        finalize(() => { this.loading = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (detailsArr: any[]) => {
          // Map MovieDetails to MovieListItem-compatible fields for display
          this.items = (detailsArr || []).map(d => ({
            id: d.id,
            title: d.title,
            poster_path: d.poster_path,
            overview: d.overview,
            release_date: d.release_date,
            original_language: d.original_language,
            vote_average: d.vote_average,
            genre_ids: []
          }));
          this.cdr.markForCheck();
        },
        error: () => {
          // On any error, show empty state rather than infinite loading
          this.items = [];
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  image(path: string | null): string {
    return this.tmdb.imageUrl(path) || this.placeholder;
  }
  onImgError(evt: Event) {
    const img = evt.target as HTMLImageElement;
    if (img && img.src !== location.origin + this.placeholder) {
      img.src = this.placeholder;
    }
  }
  open(id: number) { this.router.navigate(['/movies', id]); }
  remove(id: number) { this.watch.remove(id); }
  export() { this.watch.exportToFile(); }
  goBack() { this.router.navigate(['/movies']); }
  trackById = (_: number, m: MovieListItem) => m.id;
}
