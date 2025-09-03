import { Injectable } from '@angular/core';
import { MovieListItem } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class MoviesStateService {
  private _movies: MovieListItem[] | null = null;
  private _query = '';
  private _scrollTop = 0;
  private _page = 1;
  private _totalPages = 1;
  private _sortBy: string = '';
  private _viewMode: 'navigate' | 'popup' = 'navigate';
  private _language: '' | 'ar' | 'en' | 'other' = 'en';
  private _watchlist: number[] = [];

  get movies(): MovieListItem[] | null { return this._movies; }
  set movies(value: MovieListItem[] | null) { this._movies = value; }

  get query(): string { return this._query; }
  set query(value: string) { this._query = value ?? ''; }

  get scrollTop(): number { return this._scrollTop; }
  set scrollTop(value: number) { this._scrollTop = value || 0; }

  get page(): number { return this._page; }
  set page(value: number) { this._page = value || 1; }

  get totalPages(): number { return this._totalPages; }
  set totalPages(value: number) { this._totalPages = value || 1; }

  get sortBy(): string { return this._sortBy; }
  set sortBy(value: string) { this._sortBy = value || ''; }

  get viewMode(): 'navigate' | 'popup' { return this._viewMode; }
  set viewMode(value: 'navigate' | 'popup') { this._viewMode = value || 'navigate'; }

  get language(): '' | 'ar' | 'en' | 'other' { return this._language; }
  set language(value: '' | 'ar' | 'en' | 'other') {
    // Preserve empty string '' to represent "All"; only default to 'en' if value is null/undefined
    this._language = (value === null || value === undefined) ? 'en' : value;
  }

  // Simple session watchlist state (disabled)
  get watchlist(): number[] { return this._watchlist; }
  set watchlist(ids: number[]) { this._watchlist = Array.isArray(ids) ? ids.slice() : []; }
  addToWatchlist(id: number) { /* removed */ }
  removeFromWatchlist(id: number) { /* removed */ }
  isInWatchlist(id: number): boolean { return this._watchlist.includes(id); }

  clear() {
    this._movies = null;
    this._query = '';
    this._scrollTop = 0;
    this._page = 1;
    this._totalPages = 1;
    this._sortBy = '';
    this._viewMode = 'navigate';
    this._language = 'en';
    // Do not clear persistent watchlist here
  }
}
