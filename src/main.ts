import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Try to leverage browser scroll restoration but we also manually restore in the list
if ('scrollRestoration' in history) {
  try { (history as any).scrollRestoration = 'manual'; } catch {}
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
