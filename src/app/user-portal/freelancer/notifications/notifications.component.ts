import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-fl-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class FlNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filtered: Notification[] = [];
  isLoading = true;
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  private pollTimer: any;

  get unreadCount() { return this.notifications.filter(n => !n.read).length; }

  constructor(
    public authService: AuthService,
    private notifService: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.checkAuth();
    this.load();
    this.pollTimer = setInterval(() => this.load(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  load(showSpinner = true): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) { this.isLoading = false; return; }
    if (showSpinner) this.isLoading = true;
    this.notifService.getForUser(userId).subscribe({
      next: n => {
        this.notifications = n.sort((a, b) =>
          (b.createdAt || '') > (a.createdAt || '') ? 1 : -1);
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  setFilter(f: 'all' | 'unread' | 'read'): void {
    this.activeFilter = f;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'unread') this.filtered = this.notifications.filter(n => !n.read);
    else if (this.activeFilter === 'read') this.filtered = this.notifications.filter(n => n.read);
    else this.filtered = [...this.notifications];
  }

  markRead(n: Notification): void {
    if (!n.read && n.id) {
      this.notifService.markAsRead(n.id).subscribe(() => {
        n.read = true;
        this.applyFilter();
      });
    }
  }

  markAllRead(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    this.notifService.markAllAsRead(userId).subscribe(() => {
      this.notifications.forEach(n => n.read = true);
      this.applyFilter();
    });
  }

  deleteNotif(e: Event, id: number): void {
    e.stopPropagation();
    this.notifService.delete(id).subscribe(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.applyFilter();
    });
  }

  getIcon(type: string): string {
    const m: Record<string, string> = {
      PROJECT_CREATED:   '🚀',
      PROPOSAL_RECEIVED: '📝',
      PROPOSAL_ACCEPTED: '🎉',
      PROPOSAL_REJECTED: '❌',
      DEADLINE_REMINDER: '⏰',
      NEW_MESSAGE:       '💬',
      SYSTEM:            '⚙️',
    };
    return m[type] || '🔔';
  }

  getTypeClass(type: string): string {
    const m: Record<string, string> = {
      PROJECT_CREATED:   'type-info',
      PROPOSAL_RECEIVED: 'type-info',
      PROPOSAL_ACCEPTED: 'type-success',
      PROPOSAL_REJECTED: 'type-error',
      DEADLINE_REMINDER: 'type-warning',
      NEW_MESSAGE:       'type-info',
      SYSTEM:            'type-warning',
    };
    return m[type] || 'type-info';
  }

  getTypeLabel(type: string): string {
    const m: Record<string, string> = {
      PROJECT_CREATED:   'New Project',
      PROPOSAL_RECEIVED: 'Proposal',
      PROPOSAL_ACCEPTED: 'Accepted',
      PROPOSAL_REJECTED: 'Rejected',
      DEADLINE_REMINDER: 'Deadline',
      NEW_MESSAGE:       'Message',
      SYSTEM:            'System',
    };
    return m[type] || 'Notification';
  }

  timeAgo(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }
}
