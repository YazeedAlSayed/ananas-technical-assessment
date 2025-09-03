import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovieDetails } from '../shared/models';
import { TmdbService } from './tmdb.service';
import {NgIf, NgFor, DecimalPipe} from '@angular/common';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from '../shared/theme.service';

@Component({
  selector: 'app-movie-detail',
  template: `
    <div class="container mt-4" *ngIf="movie">
      <div class="row mb-3 align-items-center">
        <div class="col">
          <button class="btn btn-outline-secondary" (click)="back()">← Back</button>
        </div>
        <div class="col-auto">
          <div class="d-flex align-items-center gap-2">
            <label for="themeSelect" class="me-1">Theme</label>
            <select id="themeSelect" class="form-select form-select-sm" style="width:auto" [(ngModel)]="themeMode" (change)="onThemeChange()">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div class="detail-card p-3 p-md-4 rounded">
        <div class="row g-3 align-items-start">
          <div class="col-12 col-md-4">
            <img class="img-fluid rounded" [src]="image(movie.poster_path)" (error)="onImgError($event)" [alt]="movie.title"/>
          </div>
          <div class="col-12 col-md-8">
            <h2 class="mb-2">{{ movie.title }}</h2>
            <p class="text-muted">Release: {{ movie.release_date }} • {{ movie.runtime || '?' }} min</p>
            <p class="mb-2" *ngIf="movie.vote_average != null">Rating: {{ movie.vote_average | number:'1.1-1' }}/10</p>
            <p>{{ movie.overview }}</p>
            <div *ngIf="movie.genres?.length" class="mt-2">
              <span class="badge bg-secondary me-1" *ngFor="let g of movie.genres">{{ g.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
    /* Match list page card look on gradient background */
    .detail-card { background: var(--card-bg); color: var(--card-fg); border: 1px solid var(--border-color); }
    `
  ],
  imports: [
    NgIf,
    NgFor,
    DecimalPipe,
    FormsModule
  ]
})
export class MovieDetailComponent {
  movie: MovieDetails | null = null;
  themeMode: ThemeMode = 'system';
  constructor(route: ActivatedRoute, private tmdb: TmdbService, private location: Location, private theme: ThemeService) {
    this.movie = route.snapshot.data['movie'] as MovieDetails;
    // Initialize dropdown with saved mode
    this.themeMode = this.theme.mode;
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
  back() {
    this.location.back();
  }
  onThemeChange() { this.theme.setMode(this.themeMode); }
}
