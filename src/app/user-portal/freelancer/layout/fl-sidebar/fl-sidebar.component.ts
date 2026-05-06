import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fl-navbar',
  template: `
    <nav class="fl-navbar">
      <!-- Logo -->
      <a routerLink="/freelancer/dashboard" class="navbar-logo">
        <div class="logo-icon">M</div>
        <span class="logo-text">Match<span class="accent">y</span></span>
      </a>

      <!-- Nav Links -->
      <div class="navbar-links">
        <a *ngFor="let item of navItems" [routerLink]="item.route"
           class="nav-link" routerLinkActive="active">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span class="notif-dot" *ngIf="item.badge && unreadCount > 0">{{ unreadCount }}</span>
        </a>
      </div>

      <!-- Right: User + Logout -->
      <div class="navbar-right" *ngIf="authService.currentUser">
        <a routerLink="/freelancer/notifications" class="notif-btn" title="Notifications">
          🔔
          <span class="notif-bubble" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </a>
        <div class="user-chip">
          <div class="user-avatar">{{ getInitials() }}</div>
          <div class="user-info">
            <span class="user-name">{{ authService.currentUser?.firstName || authService.currentUser?.name }}</span>
            <span class="user-role">Freelancer</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Logout">
          <span>⏻</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .fl-navbar {
      width: 100%; height: 64px; background: var(--bo-bg-sidebar);
      display: flex; align-items: center; padding: 0 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.18); position: sticky; top: 0; z-index: 100;
      flex-shrink: 0;
    }

    .navbar-logo {
      display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0;
      .logo-icon {
        width: 32px; height: 32px; background: var(--primary); border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: 16px;
      }
      .logo-text { color: white; font-weight: 700; font-size: 18px; font-family: var(--font-display); }
      .accent { color: #a855f7; }
    }

    .navbar-links {
      display: flex; align-items: center; gap: 4px;
      position: absolute; left: 50%; transform: translateX(-50%);
    }

    .nav-link {
      display: flex; align-items: center; gap: 7px; padding: 8px 14px;
      border-radius: 8px; color: rgba(255,255,255,0.6); text-decoration: none;
      font-size: 14px; font-weight: 500; transition: all 0.2s; position: relative;
      white-space: nowrap;
      &:hover { background: rgba(168,85,247,0.15); color: white; }
      &.active { background: rgba(168,85,247,0.2); color: #c084fc; }
      .nav-icon { font-size: 15px; }
      .notif-dot {
        background: #ef4444; color: white; font-size: 10px; font-weight: 700;
        padding: 1px 5px; border-radius: 10px; margin-left: 2px;
      }
    }

    .navbar-right {
      display: flex; align-items: center; gap: 12px; margin-left: auto; flex-shrink: 0;
    }

    .notif-btn {
      position: relative; font-size: 18px; text-decoration: none;
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 8px; transition: background 0.2s;
      &:hover { background: rgba(255,255,255,0.1); }
      .notif-bubble {
        position: absolute; top: 2px; right: 2px; background: #ef4444;
        color: white; font-size: 9px; font-weight: 700; min-width: 16px; height: 16px;
        border-radius: 10px; display: flex; align-items: center; justify-content: center;
        padding: 0 3px;
      }
    }

    .user-chip {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.07); border-radius: 10px; padding: 6px 12px;
      .user-avatar {
        width: 28px; height: 28px; background: #a855f7; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: 11px; flex-shrink: 0;
      }
      .user-info { display: flex; flex-direction: column;
        .user-name { color: white; font-size: 13px; font-weight: 600; line-height: 1.2; }
        .user-role { color: rgba(255,255,255,0.45); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
      }
    }

    .logout-btn {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
      color: #f87171; border-radius: 8px; width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; cursor: pointer; transition: all 0.2s;
      &:hover { background: rgba(239,68,68,0.2); color: #ef4444; }
    }

    @media (max-width: 768px) {
      .nav-link .nav-label { display: none; }
      .user-chip .user-info { display: none; }
      .fl-navbar { padding: 0 16px; }
    }
  `]
})
export class FlNavbarComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private wsSub?: Subscription;

  navItems = [
    { label: 'Dashboard',       icon: '📊', route: '/freelancer/dashboard',  badge: false },
    { label: 'Browse Projects', icon: '🔍', route: '/freelancer/projects',   badge: false },
    { label: 'My Proposals',    icon: '📝', route: '/freelancer/proposals',  badge: false },
    { label: 'My Badges',       icon: '🏆', route: '/freelancer/badges',     badge: false },
    { label: 'Profile',         icon: '⚙️', route: '/freelancer/profile',    badge: false },
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
    private notifService: NotificationService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser?.id;
    if (userId) {
      this.notifService.countUnread(userId).subscribe({
        next: r => this.unreadCount = r.count,
        error: () => this.unreadCount = 0
      });
      this.wsService.connect(String(userId));
      this.wsSub = this.wsService.onNotification().subscribe(() => {
        this.unreadCount++;
      });
    }
  }

  ngOnDestroy(): void { this.wsSub?.unsubscribe(); }

  logout(): void { this.authService.logout(); this.router.navigate(['/']); }

  getInitials(): string {
    const u = this.authService.currentUser;
    if (!u) return '?';
    const name = u.name || ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }
}