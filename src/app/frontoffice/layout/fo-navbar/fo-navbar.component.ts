import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../frontoffice/services/auth.service';
import { NotificationsService } from '../../../frontoffice/services/notifications.service';
import { Notification } from '../../../frontoffice/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fo-navbar',
  templateUrl: './fo-navbar.component.html',
  styleUrls: ['./fo-navbar.component.scss']
})
export class FoNavbarComponent implements OnInit, OnDestroy {
  isScrolled = false;
  isMenuOpen = false;
  showNotifications = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService, 
    private router: Router,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated && this.authService.currentUser) {
      this.loadNotifications();
      this.notificationsService.startPolling(this.authService.currentUser.id, 'freelancer');
      
      const sub = this.notificationsService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      });
      this.subscriptions.push(sub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 30;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotifications = false;
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (this.authService.currentUser) {
      this.notificationsService.getNotifications(this.authService.currentUser.id, 'freelancer')
        .subscribe(notifications => {
          this.notifications = notifications;
        });
    }
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.is_read) {
      this.notificationsService.markAsRead(notification.id).subscribe(() => {
        notification.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
    
    if (notification.link) {
      this.router.navigate([notification.link]);
      this.showNotifications = false;
    }
  }

  markAllAsRead(): void {
    if (this.authService.currentUser) {
      this.notificationsService.markAllAsRead(this.authService.currentUser.id, 'freelancer')
        .subscribe(() => {
          this.notifications.forEach(n => n.is_read = true);
          this.unreadCount = 0;
        });
    }
  }

  deleteNotification(event: MouseEvent, notificationId: number): void {
    event.stopPropagation();
    this.notificationsService.deleteNotification(notificationId).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.loadNotifications();
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  goToDashboard(): void {
    this.router.navigate(['/backoffice/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
