import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthState, User } from '../models/models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'matchy_token';
const USER_KEY  = 'matchy_user'; // shared with user-portal (teammate's app)

function toPortalUser(u: User): any {
  if (!u) return null;
  const anyU = u as any;
  const role = (u.role || '').toString().toUpperCase();
  const fn = anyU.fullName || anyU.name || '';
  const firstName = anyU.firstName || (fn ? String(fn).split(' ')[0] : '');
  const lastName  = anyU.lastName  || (fn ? String(fn).split(' ').slice(1).join(' ') : '');
  return {
    id: String(u.id ?? ''),
    email: u.email,
    role,
    firstName,
    lastName,
    name: fn || `${firstName} ${lastName}`.trim()
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: 'freelancer' | 'client';
  location?: string | null;
  skills?: string | null;
  bio?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  authState$ = this.authState.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuth();
  }

  get currentUser(): User | null {
    return this.authState.value.user;
  }

  get isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  get isAdmin(): boolean {
    return this.authState.value.user?.role === 'admin';
  }

  hasRole(role: User['role']): boolean {
    return this.authState.value.user?.role === role;
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => this.persistSession(res)),
        map(res => res.user)
      );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        tap(res => this.persistSession(res)),
        map(res => res.user)
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.authState.next({ isAuthenticated: false, user: null, token: null });
  }

  /** Called on app boot â€” if a token exists, fetch /auth/me to rehydrate. */
  checkAuth(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    this.http
      .get<{ user: User }>(`${environment.apiUrl}/auth/me`)
      .pipe(
        catchError(() => {
          this.logout();
          return of(null);
        })
      )
      .subscribe(res => {
        if (res?.user) {
          this.authState.next({ isAuthenticated: true, user: res.user, token });
          try { localStorage.setItem(USER_KEY, JSON.stringify(toPortalUser(res.user))); } catch {}
        }
      });
  }

  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    try { localStorage.setItem(USER_KEY, JSON.stringify(toPortalUser(res.user))); } catch {}
    this.authState.next({
      isAuthenticated: true,
      user: res.user,
      token: res.token
    });
  }
}