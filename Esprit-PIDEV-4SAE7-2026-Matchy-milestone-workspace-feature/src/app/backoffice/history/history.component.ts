import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../frontoffice/services/notifications.service';
import { AuthService } from '../../frontoffice/services/auth.service';
import { Notification } from '../../frontoffice/models/notification.model';

@Component({
  selector: 'app-bo-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class BoHistoryComponent implements OnInit {
  allNotifications: Notification[] = [];
  groupedNotifications: { [key: string]: Notification[] } = {};

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    if (this.authService.currentUser) {
      this.notificationsService.getNotifications(this.authService.currentUser.id, 'company')
        .subscribe(notifications => {
          this.allNotifications = notifications;
          this.groupByDate();
        });
    }
  }

  groupByDate(): void {
    this.groupedNotifications = {};
    
    this.allNotifications.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (this.isSameDay(date, today)) {
        dateKey = 'Today';
      } else if (this.isSameDay(date, yesterday)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!this.groupedNotifications[dateKey]) {
        this.groupedNotifications[dateKey] = [];
      }
      this.groupedNotifications[dateKey].push(notification);
    });
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  getDateKeys(): string[] {
    return Object.keys(this.groupedNotifications);
  }

  handleNotificationClick(notification: Notification): void {
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }

  getTimeOnly(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'application_received': 'Application',
      'application_accepted': 'Accepted',
      'application_rejected': 'Rejected',
      'interview_scheduled': 'Interview'
    };
    return labels[type] || type;
  }
}
