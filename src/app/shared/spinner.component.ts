import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../interceptors/loader.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-backdrop" *ngIf="isLoading()">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `,
  styles: [`
    .spinner-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; z-index: 2000; }
  `]
})
export class SpinnerComponent {
  isLoading = computed(() => this.loader.loading() > 0);
  constructor(private loader: LoaderService) {}
}
