import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../frontoffice/services/auth.service';

@Component({
  selector: 'app-bo-login',
  templateUrl: './bo-login.component.html',
  styleUrls: ['./bo-login.component.scss']
})
export class BoLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['admin@matchy.tn', [Validators.required, Validators.email]],
      password: ['password', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (success) => {
        if (success) {
          if (this.authService.isAdmin) {
            this.router.navigate(['/backoffice/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.error = 'Invalid credentials';
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
