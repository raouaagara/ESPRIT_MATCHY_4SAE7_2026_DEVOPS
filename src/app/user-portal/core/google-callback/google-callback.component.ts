import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-google-callback',
  template: '<div style="color:white;text-align:center;margin-top:40vh;font-size:20px;">Connexion en cours...</div>'
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.router.navigate(['/backoffice/login']);
      return;
    }

    if (token) {
      this.authService.handleGoogleCallback(token);
      this.router.navigate(['/backoffice/dashboard']);
    }
  }
}