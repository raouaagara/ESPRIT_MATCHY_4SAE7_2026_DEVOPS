import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, of, catchError } from 'rxjs';
import { environment } from '../../_env/environment';
import { User, AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'matchy_token';
  private readonly USER_KEY  = 'matchy_user';

  // ✅ Direct backend URL for OAuth (bypasses Gateway)
  private readonly backendUrl = 'http://localhost:8081/api';

  currentUser: (User & { name: string }) | null = null;
  isAuthenticated = false;

  constructor(private http: HttpClient, private router: Router) {}

  checkAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user  = localStorage.getItem(this.USER_KEY);
    if (token && user) {
      const parsed = JSON.parse(user);
      // Toujours extraire l'ID depuis le JWT pour éviter l'overflow JavaScript
      const jwtId = this.extractIdFromJwt(token);
      if (jwtId) {
        parsed.id = jwtId;
        // Réécrire dans localStorage avec l'ID corrigé
        localStorage.setItem(this.USER_KEY, JSON.stringify(parsed));
      }
      this.currentUser = parsed;
      this.isAuthenticated = true;
    }
  }

  // Extrait le "sub" du JWT sans JSON.parse (qui corrompt les Long Java)
  private extractIdFromJwt(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Décoder le payload en string brute SANS JSON.parse
      const raw = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      // Extraire "sub":"..." avec une regex pour éviter JSON.parse
      const match = raw.match(/"sub"\s*:\s*"?(\d+)"?/);
      return match ? match[1] : null;
    } catch { return null; }
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        // Extraire l'ID depuis le JWT pour éviter l'overflow JavaScript
        const jwtId = this.extractIdFromJwt(res.token);
        const user = {
          ...res.user,
          id:   jwtId || String(res.user.id),
          name: `${res.user.firstName} ${res.user.lastName}`
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser = user;
        this.isAuthenticated = true;
        return true;
      }),
      catchError(() => of(false))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAdmin():      boolean { return this.currentUser?.role === 'ADMIN'; }
  isClient():     boolean { return this.currentUser?.role === 'CLIENT'; }
  isFreelancer(): boolean { return this.currentUser?.role === 'FREELANCER'; }

  getCurrentUserId(): string | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (!user) return null;
    return JSON.parse(user)?.id || null;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  // ✅ Calls port 8081 directly — bypasses Gateway
  loginWithGoogle(): void {
    this.http.get<{ url: string }>(`${this.backendUrl}/auth/google`).subscribe({
      next:  (res) => window.location.href = res.url,
      error: ()    => console.error('Google OAuth failed')
    });
  }

  handleGoogleCallback(token: string): void {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const user = {
      id:        payload.sub,
      email:     payload.email,
      role:      payload.role,
      firstName: payload.firstName,
      lastName:  payload.lastName,
      name:      `${payload.firstName} ${payload.lastName}`
    };
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY,  JSON.stringify(user));
    this.currentUser    = user as any;
    this.isAuthenticated = true;
  }
}