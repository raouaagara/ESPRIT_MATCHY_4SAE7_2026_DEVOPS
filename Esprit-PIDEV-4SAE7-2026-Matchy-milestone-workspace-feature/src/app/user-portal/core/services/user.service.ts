import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../_env/environment';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private toUser(u: any): User {
    return { ...u, name: `${u.firstName} ${u.lastName}`, city: u.location };
  }

  getAll(): Observable<User[]> {
    return this.http.get<any[]>(this.api).pipe(map(list => list.map(u => this.toUser(u))));
  }

  getById(id: string | number): Observable<User> {
    return this.http.get<any>(`${this.api}/${id}`).pipe(map(u => this.toUser(u)));
  }

  getByRole(role: string): Observable<User[]> {
    return this.http.get<any[]>(`${this.api}/role/${role}`).pipe(map(list => list.map(u => this.toUser(u))));
  }

  create(user: Partial<User>): Observable<User> {
    return this.http.post<any>(this.api, user).pipe(map(u => this.toUser(u)));
  }

  update(id: string | number, user: Partial<User>): Observable<User> {
    return this.http.put<any>(`${this.api}/${id}`, user).pipe(map(u => this.toUser(u)));
  }

  delete(id: string | number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  updateStatus(id: string | number, status: string): Observable<User> {
    return this.http.patch<any>(`${this.api}/${id}/status`, { status }).pipe(map(u => this.toUser(u)));
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.api}/stats/dashboard`);
  }
}
