import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../_env/environment';
import { Notification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getForUser(userId: string | number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/user/${userId}`);
  }

  getUnread(userId: string | number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/user/${userId}/unread`);
  }

  countUnread(userId: string | number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/user/${userId}/count`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.api}/${id}/read`, {});
  }

  markAllAsRead(userId: string | number): Observable<any> {
    return this.http.patch(`${this.api}/user/${userId}/read-all`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
