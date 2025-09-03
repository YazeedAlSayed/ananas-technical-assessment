import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { from, map, Observable, of, switchMap } from 'rxjs';
import { MovieDetails, MovieListItem } from '../shared/models';

interface TmdbListResponse { results: MovieListItem[]; page: number; total_pages: number; total_results: number; }

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private base = environment.tmdbBaseUrl;
  private key = environment.tmdbApiKey;
  private imageBase = environment.tmdbImageBaseUrl;

  // Code-only switch: when true, use nsfwjs image-based filtering; when false, use existing genre/keyword filter.
  // Toggle this flag manually in code as needed.
  private static readonly USE_NPM_NSFW_FILTER = true;
  // Code-only threshold for nsfwjs decisions; tweak during debugging in DevTools
  private static readonly NSFW_BLOCK_THRESHOLD = 0.0025;

  // nsfwjs model cache
  private nsfwModel: any | null = null;
  // in-memory cache to avoid reclassifying the same image URLs repeatedly
  private nsfwCache = new Map<string, boolean>();

  constructor(private http: HttpClient) {
    // Start loading the NSFW model in the background to avoid blocking the first API call
    // Ignore errors here; we'll gracefully fall back to keyword/genre filtering
    this.ensureNsfwModel().catch(() => {});
  }

  private filterNsfw(list: MovieListItem[]): MovieListItem[] {
    // Restore NSFW filtering by both genres and keywords
    // Note: keep explicit typing on Set<number> to satisfy TS compiler
    const excludedGenres: Set<number> = new Set<number>([10749, 99]); // Romance, Documentary
    const blockedKeywords: string[] = ['desire', 'stepmom', 'affair', 'lust', 'erotic', 'sex', 'seduction', 'AV'];

    const hasExcludedGenre = (genreIds?: number[]) =>
      Array.isArray(genreIds) && genreIds.some(id => excludedGenres.has(id));

    const containsBlockedKeyword = (m: MovieListItem) => {
      const combined = `${m.title || ''} ${m.overview || ''} ${m.original_title || ''}`.toLowerCase();
      return blockedKeywords.some(k => combined.includes(k.toLowerCase()));
    };
    return list.filter(m => !hasExcludedGenre(m.genre_ids) && !containsBlockedKeyword(m));
  }

  private mapSort(sortBy?: string): string | undefined {
    switch (sortBy) {
      case 'rating_desc': return 'vote_average.desc';
      case 'rating_asc': return 'vote_average.asc';
      case 'date_desc': return 'primary_release_date.desc';
      case 'date_asc': return 'primary_release_date.asc';
      case 'title_asc': return 'original_title.asc';
      case 'title_desc': return 'original_title.desc';
      default: return undefined;
    }
  }

  private async ensureNsfwModel() {
    if (!this.nsfwModel) {
      const nsfwjs = await import('nsfwjs');
      // nsfwjs.load can take a model URL; default will load the hosted model
      this.nsfwModel = await nsfwjs.load();
    }
    return this.nsfwModel;
  }

  private classifyImageUrl(url: string, m: any, preloadedModel?: any): Promise<boolean> {
    // Returns true if image is considered safe; false if NSFW
    // Use cache to avoid reclassifying the same image URL
    const cached = this.nsfwCache.get(url);
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      // Set crossOrigin to allow canvas usage if needed by nsfwjs
      (img as any).crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const model = preloadedModel ?? (await this.ensureNsfwModel());
          const predictions = await model.classify(img);
          // Block if any of these classes exceed threshold
          const blockLabels = new Set(['Hentai', 'Porn', 'Sexy']);
          const threshold = TmdbService.NSFW_BLOCK_THRESHOLD;
          const isBlocked = predictions.some((p: any) => blockLabels.has(p.className) && p.probability >= threshold);
          const isSafe = !isBlocked;
          this.nsfwCache.set(url, isSafe);
          resolve(isSafe);
        } catch (_) {
          // On error, be conservative: consider safe to avoid over-blocking
          this.nsfwCache.set(url, true);
          resolve(true);
        }
      };
      img.onerror = () => {
        // On image load error, consider safe but do not cache permanently to allow future retries
        resolve(true);
      };
      img.src = url;
    });
  }

  private imageUrlForFilter(m: MovieListItem): string | null {
    // Use poster path if available
    const path = m.poster_path || null;
    return path ? this.imageUrl(path) : null;
  }

  private nsfwFilterWithNpm(list: MovieListItem[]): Promise<MovieListItem[]> {
    // If model isn't loaded yet, don't block: return the list as-is (it should already be keyword/genre filtered)
    const model = this.nsfwModel;
    if (!model) {
      return Promise.resolve(list);
    }

    const tasks = list.map(async (m) => {
      const url = this.imageUrlForFilter(m);
      if (!url) return m; // keep when no image
      const isSafe = await this.classifyImageUrl(url, m, model);
      return isSafe ? m : null as any;
    });
    return Promise.all(tasks).then(arr => arr.filter(Boolean) as MovieListItem[]);
  }

  discover(page = 1, sortBy?: string, language?: 'ar' | 'en' | 'other' | ''): Observable<TmdbListResponse> {
    const sort = this.mapSort(sortBy);
    const params: any = { api_key: this.key, page };
    if (sort) params.sort_by = sort;
    // Apply language filtering by original language where supported
    if (language === 'ar' || language === 'en') {
      (params as any).with_original_language = language;
    }
    // To reduce noise from unrated items when sorting by rating asc/desc, you could also include 'vote_count.gte'
    return this.http
      .get<TmdbListResponse>(`${this.base}/discover/movie`, { params })
      .pipe(
        switchMap(r => {
          const baseResults = r.results || [];
          const fastFiltered = this.filterNsfw(baseResults);
          if (!TmdbService.USE_NPM_NSFW_FILTER) {
            return of({ ...r, results: fastFiltered });
          }
          return from(this.nsfwFilterWithNpm(fastFiltered)).pipe(
            map(filtered => ({ ...r, results: filtered }))
          );
        })
      );
  }

  getPopular(page = 1): Observable<TmdbListResponse> {
    return this.http
      .get<TmdbListResponse>(`${this.base}/movie/popular`, { params: { api_key: this.key, page } })
      .pipe(
        switchMap(r => {
          const baseResults = r.results || [];
          const fastFiltered = this.filterNsfw(baseResults);
          if (!TmdbService.USE_NPM_NSFW_FILTER) {
            return of({ ...r, results: fastFiltered });
          }
          return from(this.nsfwFilterWithNpm(fastFiltered)).pipe(
            map(filtered => ({ ...r, results: filtered }))
          );
        })
      );
  }

  search(query: string, page = 1, language?: 'ar' | 'en' | 'other' | ''): Observable<TmdbListResponse> {
    const params: any = { api_key: this.key, query, page };
    // Search API does not support with_original_language; we'll filter client-side when needed
    return this.http
      .get<TmdbListResponse>(`${this.base}/search/movie`, { params })
      .pipe(
        switchMap(r => {
          const baseResults = r.results || [];
          const fastFiltered = this.filterNsfw(baseResults);
          if (!TmdbService.USE_NPM_NSFW_FILTER) {
            return of({ ...r, results: fastFiltered });
          }
          return from(this.nsfwFilterWithNpm(fastFiltered)).pipe(
            map(filtered => ({ ...r, results: filtered }))
          );
        })
      );
  }

  details(id: number): Observable<MovieDetails> {
    return this.http.get<MovieDetails>(`${this.base}/movie/${id}`, { params: { api_key: this.key } });
  }

  imageUrl(path: string | null): string | null {
    return path ? `${this.imageBase}${path}` : null;
  }
}
