import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private counter = signal(0);
  readonly loading = this.counter.asReadonly();

  show() { this.counter.update(v => v + 1); }
  hide() { this.counter.update(v => Math.max(0, v - 1)); }
}
