import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from '../../frontoffice/services/notifications.service';
import { AuthService } from '../../frontoffice/services/auth.service';
import { Notification } from '../../frontoffice/models/notification.model';

@Component({
  selector: 'app-bo-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class BoNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  selectedFilter = 'all';

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationsService.getAllNotifications()
      .subscribe(notifications => {
        this.notifications = notifications;
        this.applyFilter();
      });
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredNotifications = this.notifications;
    } else if (this.selectedFilter === 'unread') {
      this.filteredNotifications = this.notifications.filter(n => !n.is_read);
    } else {
      this.filteredNotifications = this.notifications.filter(n => n.type === this.selectedFilter);
    }
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.is_read) {
      this.notificationsService.markAsRead(notification.id).subscribe(() => {
        notification.is_read = true;
      });
    }
    
    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }

  markAllAsRead(): void {
    if (this.authService.currentUser) {
      this.notificationsService.markAllAsRead(this.authService.currentUser.id, 'company')
        .subscribe(() => {
          this.notifications.forEach(n => n.is_read = true);
          this.applyFilter();
        });
    }
  }

  deleteNotification(notificationId: number): void {
    this.notificationsService.deleteNotification(notificationId).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.applyFilter();
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }
}
