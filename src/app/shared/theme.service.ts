import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'system';

const LS_THEME_MODE = 'app.theme.mode';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private media = window.matchMedia('(prefers-color-scheme: dark)');
  private currentMode: ThemeMode = 'light';
  private theme$ = new BehaviorSubject<'light' | 'dark'>(this.computeTheme('light'));
  private mode$ = new BehaviorSubject<ThemeMode>(this.currentMode);

  private usedAddEvent = false;
  private usedAddListener = false;

  constructor(private zone: NgZone) {
    // Restore saved mode from storage if present
    const saved = (localStorage.getItem(LS_THEME_MODE) as ThemeMode | null);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      this.currentMode = saved;
      this.mode$.next(saved);
      const t = this.computeTheme(saved);
      this.theme$.next(t);
      this.applyTheme(t);
    } else {
      // Apply initial based on default
      this.applyTheme(this.theme$.value);
    }
    // Listen to system changes (support older browsers with addListener fallback)
    if (typeof this.media.addEventListener === 'function') {
      this.media.addEventListener('change', this.onMediaChange);
      this.usedAddEvent = true;
    } else if (typeof (this.media as any).addListener === 'function') {
      (this.media as any).addListener(this.onMediaChange);
      this.usedAddListener = true;
    }
  }

  private onMediaChange = () => {
    this.zone.run(() => {
      if (this.currentMode === 'system') {
        const t = this.computeTheme('system');
        this.theme$.next(t);
        this.applyTheme(t);
      }
    });
  };

  private computeTheme(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'system') {
      return this.media.matches ? 'dark' : 'light';
    }
    return mode;
  }

  setMode(mode: ThemeMode) {
    this.currentMode = mode;
    this.mode$.next(mode);
    localStorage.setItem(LS_THEME_MODE, mode);
    const t = this.computeTheme(mode);
    this.theme$.next(t);
    this.applyTheme(t);
  }

  get mode(): ThemeMode { return this.currentMode; }
  get modeChanges() { return this.mode$.asObservable(); }
  get themeChanges() { return this.theme$.asObservable(); }

  private applyTheme(theme: 'light' | 'dark') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }

  ngOnDestroy(): void {
    // Clean up media listeners to avoid duplicates (esp. during HMR/dev)
    if (this.usedAddEvent && typeof this.media.removeEventListener === 'function') {
      this.media.removeEventListener('change', this.onMediaChange);
    } else if (this.usedAddListener && typeof (this.media as any).removeListener === 'function') {
      (this.media as any).removeListener(this.onMediaChange);
    }
  }
}
