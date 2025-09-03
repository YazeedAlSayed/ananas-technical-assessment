import { ChangeDetectionStrategy, Component, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, ThemeMode } from '../shared/theme.service';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
          <div class="login-card p-4 rounded">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="mb-0">Login</h2>
              <div class="d-flex align-items-center gap-2">
                <label for="themeSelect" class="me-1 small">Theme</label>
                <select id="themeSelect" class="form-select form-select-sm" style="width:auto" [(ngModel)]="themeMode" (change)="onThemeChange()">
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" required />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-100 mb-3">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" required />
              </mat-form-field>

              <button type="submit" mat-raised-button color="primary" class="w-100 primary-ananas-button" [disabled]="form.invalid || loading">
                {{ loading ? 'Signing in...' : 'Login' }}
              </button>

              <div class="text-danger small mt-2" *ngIf="error">{{ error }}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    /* Light/Dark container for the login form */
    :host-context([data-theme="light"]) .login-card {
      background-color: #ffffff;
      color: #212529;
      border: 1px solid #e5e5e5;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    :host-context([data-theme="dark"]) .login-card {
      background-color: #1f1f1f;
      color: #f1f1f1;
      border: 1px solid #2c2c2c;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }

    /* Ensure Angular Material form fields have sufficient contrast in dark mode */
    :host-context([data-theme="dark"]) .mdc-notched-outline__leading,
    :host-context([data-theme="dark"]) .mdc-notched-outline__notch,
    :host-context([data-theme="dark"]) .mdc-notched-outline__trailing {
      border-color: #5a5a5a !important;
    }
    :host-context([data-theme="dark"]) .mat-mdc-text-field-wrapper {
      background-color: #2a2a2a;
    }
    :host-context([data-theme="dark"]) mat-label,
    :host-context([data-theme="dark"]) input[matinput],
    :host-context([data-theme="dark"]) input.mat-mdc-input-element {
      color: #f1f1f1 !important;
    }
    :host-context([data-theme="dark"]) .mat-mdc-form-field-subscript-wrapper,
    :host-context([data-theme="dark"]) .mat-mdc-form-field-hint-wrapper {
      color: #cfcfcf !important;
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  themeMode: ThemeMode = 'light';
  loading = false;
  error: string | null = null;
  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef, private theme: ThemeService) {
    this.form = this.createForm();
    // Initialize dropdown with current saved theme mode
    this.themeMode = this.theme.mode;
  }

  private createForm() {
    return this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onThemeChange() { this.theme.setMode(this.themeMode); }

  submit() {
    if (this.form.invalid) return;
    const { username, password } = this.form.value as { username: string; password: string };
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    this.auth.login(username, password).subscribe({
      next: (ok) => {
        this.loading = false;
        if (ok) {
          this.router.navigate(['/movies']);
        } else {
          this.error = 'Invalid username or password';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Login failed. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }
}
