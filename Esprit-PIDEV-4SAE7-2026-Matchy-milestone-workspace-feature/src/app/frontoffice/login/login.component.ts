import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  errorMessage = '';

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: user => {
        this.loading = false;
        if (user.role === 'admin') {
          this.router.navigate(['/backoffice/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.error || 'Invalid credentials';
      }
    });
  }
}
