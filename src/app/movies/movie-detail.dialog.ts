import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { TmdbService } from './tmdb.service';
import { MovieDetails } from '../shared/models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-movie-detail-dialog',
  standalone: true,
  template: `
    <div class="container-fluid p-0" *ngIf="movie; else loadingTpl">
      <div class="row g-3">
        <div class="col-12">
          <h3 class="mb-0">{{ movie.title }}</h3>
          <p class="text-muted mb-2">Release: {{ movie.release_date }} • {{ movie.runtime || '?' }} min</p>
          <p class="mb-2" *ngIf="movie.vote_average != null">Rating: {{ movie.vote_average | number:'1.1-1' }}/10</p>
        </div>
        <div class="col-12 col-md-4">
          <img class="img-fluid rounded" [src]="image(movie.poster_path)" (error)="onImgError($event)" [alt]="movie.title"/>
        </div>
        <div class="col-12 col-md-8">
          <p>{{ movie.overview }}</p>
          <div *ngIf="movie.genres?.length">
            <span class="badge bg-secondary me-1" *ngFor="let g of movie.genres">{{ g.name }}</span>
          </div>
        </div>
      </div>
      <div class="text-end mt-3">
        <button class="btn btn-secondary" (click)="close()">Close</button>
      </div>
    </div>
    <ng-template #loadingTpl>
      <div class="p-4 text-center text-muted">Loading...</div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, CommonModule, NgIf, NgFor, DecimalPipe]
})
export class MovieDetailDialogComponent {
  movie: MovieDetails | null = null;
  loading = false;
  private readonly placeholder = '/placeholder-poster.svg';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id: number },
    private dialogRef: MatDialogRef<MovieDetailDialogComponent>,
    private tmdb: TmdbService
  ) {
    this.load();
  }

  private load() {
    this.loading = true;
    this.tmdb.details(this.data.id).pipe(finalize(() => { this.loading = false; })).subscribe({
      next: (m) => { this.movie = m; },
      error: () => { this.movie = null; }
    });
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

  close() { this.dialogRef.close(); }
}
