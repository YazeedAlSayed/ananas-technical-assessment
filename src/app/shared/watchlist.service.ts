import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface WatchlistFile {
  items: number[];
}

const LS_WATCHLIST = 'app.watchlist.v1';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private items$ = new BehaviorSubject<number[]>([]);
  private initialized = false;

  constructor(private http: HttpClient) {
    this.init();
  }

  private init() {
    // Load from localStorage first (true persistence from client side)
    const raw = localStorage.getItem(LS_WATCHLIST);
    if (raw) {
      try {
        const arr = JSON.parse(raw) as number[];
        this.items$.next(Array.isArray(arr) ? arr : []);
        this.initialized = true;
        return;
      } catch {}
    }
    // Seed from assets on first run
    this.http.get<WatchlistFile>('assets/watchlist.json').subscribe({
      next: (file) => {
        const list = Array.isArray(file?.items) ? (file.items as number[]) : [];
        this.items$.next(list);
        this.persist();
        this.initialized = true;
      },
      error: () => {
        this.items$.next([]);
        this.persist();
        this.initialized = true;
      }
    });
  }

  private persist() {
    localStorage.setItem(LS_WATCHLIST, JSON.stringify(this.items$.value));
  }

  get list$(): Observable<number[]> { return this.items$.asObservable(); }
  get list(): number[] { return this.items$.value; }

  isIn(id: number): boolean { return this.items$.value.includes(id); }

  add(id: number): void {
    if (!this.items$.value.includes(id)) {
      this.items$.next([...this.items$.value, id]);
      this.persist();
    }
  }

  remove(id: number): void {
    if (this.items$.value.includes(id)) {
      this.items$.next(this.items$.value.filter(x => x !== id));
      this.persist();
    }
  }

  clear(): void {
    this.items$.next([]);
    this.persist();
  }

  // Export current watchlist as a JSON file (dev-friendly, no backend needed)
  exportToFile(): void {
    const data = { items: this.items$.value } as WatchlistFile;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watchlist.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
