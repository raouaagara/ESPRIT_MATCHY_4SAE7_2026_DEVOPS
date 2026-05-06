import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = environment.paymentsAdminBaseUrl;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Start polling for notifications
  startPolling(userId: number, userType: 'company' | 'freelancer'): void {
    // Poll every 10 seconds
    interval(10000).pipe(
      switchMap(() => this.getUnreadCount(userId, userType))
    ).subscribe(count => {
      this.unreadCountSubject.next(count);
    });

    // Initial load
    this.getUnreadCount(userId, userType).subscribe(count => {
      this.unreadCountSubject.next(count);
    });
  }

  getNotifications(userId: number, userType: 'company' | 'freelancer'): Observable<Notification[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/${userType}/${userId}`).pipe(
      map(notifications => notifications.map(n => ({
        ...n,
        created_at: new Date(n.created_at)
      })))
    );
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/all`).pipe(
      map(notifications => notifications.map(n => ({
        ...n,
        created_at: new Date(n.created_at)
      })))
    );
  }

  getUnreadCount(userId: number, userType: 'company' | 'freelancer'): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/${userType}/${userId}/unread-count`).pipe(
      map(response => response.count)
    );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(userId: number, userType: 'company' | 'freelancer'): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${userType}/${userId}/read-all`, {});
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${notificationId}`);
  }
}
