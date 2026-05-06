import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-cl-sidebar',
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled">
      <!-- Animated background mesh -->
      <div class="navbar-mesh"></div>

      <!-- LEFT: Logo -->
      <div class="navbar-left">
        <div class="logo">
          <div class="logo-icon">
            <span class="logo-letter">M</span>
            <div class="logo-glow"></div>
          </div>
          <span class="logo-text">Match<span class="accent">y</span></span>
        </div>
      </div>

      <!-- CENTER: Nav Links -->
      <div class="navbar-center">
        <a *ngFor="let item of navItems; let i = index"
           [routerLink]="item.route"
           class="nav-link"
           routerLinkActive="active"
           [style.animation-delay]="(i * 0.07) + 's'">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span class="notif-badge" *ngIf="item.badge && unreadCount > 0">{{ unreadCount }}</span>
          <span class="nav-link-bg"></span>
        </a>
      </div>

      <!-- RIGHT -->
      <div class="navbar-right">

        <!-- Theme Toggle -->
        <button class="theme-btn" (click)="toggleTheme()" [title]="isDark ? 'Light mode' : 'Dark mode'">
          <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
          <span class="theme-track">
            <span class="theme-thumb" [class.dark]="isDark"></span>
          </span>
        </button>

        <!-- User Pill -->
        <div class="user-pill" *ngIf="authService.currentUser">
          <span class="online-dot"></span>
          <span class="user-greeting">Hello, <strong>{{ authService.currentUser?.firstName || authService.currentUser?.name }}</strong></span>
          <div class="user-avatar">
            <span>{{ getInitials(authService.currentUser?.name || '') }}</span>
            <div class="avatar-ring"></div>
          </div>
        </div>

        <!-- Logout -->
        <button class="btn-logout" (click)="logout()">
          <span>Logout</span>
          <span class="logout-icon">⏻</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

    :host { display: block; }

    /* ══════════════════════════════════════
       NAVBAR BASE
    ══════════════════════════════════════ */
    .navbar {
      width: 100%;
      height: 70px;
      background: rgba(8, 10, 20, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 200;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      transition: all 0.3s ease;
      animation: navSlideIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
    }

    .navbar.scrolled {
      height: 60px;
      background: rgba(8, 10, 20, 0.98);
      box-shadow: 0 4px 30px rgba(0,0,0,0.5);
    }

    /* Animated mesh background */
    .navbar-mesh {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 40% 100% at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 70%),
        radial-gradient(ellipse 30% 100% at 80% 50%, rgba(168,85,247,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    @keyframes navSlideIn {
      from { opacity: 0; transform: translateY(-100%); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ══════════════════════════════════════
       LOGO
    ══════════════════════════════════════ */
    .navbar-left { flex-shrink: 0; z-index: 1; }

    .logo {
      display: flex;
      align-items: center;
      gap: 11px;
      animation: fadeInLeft 0.6s ease both 0.1s;
    }

    .logo-icon {
      position: relative;
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px rgba(99,102,241,0.5), 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: rotate(-8deg) scale(1.1);
        box-shadow: 0 0 30px rgba(99,102,241,0.7), 0 4px 20px rgba(0,0,0,0.4);
      }
    }

    .logo-letter {
      color: white;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 20px;
      position: relative;
      z-index: 1;
    }

    .logo-glow {
      position: absolute; inset: 0; border-radius: 11px;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
    }

    .logo-text {
      color: white;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 21px;
      letter-spacing: -0.5px;
    }

    .accent {
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ══════════════════════════════════════
       NAV LINKS
    ══════════════════════════════════════ */
    .navbar-center {
      display: flex;
      align-items: center;
      gap: 2px;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      border-radius: 10px;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.25s ease;
      position: relative;
      white-space: nowrap;
      animation: navItemIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
      overflow: hidden;
    }

    .nav-link-bg {
      position: absolute;
      inset: 0;
      border-radius: 10px;
      background: rgba(255,255,255,0.06);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .nav-link:hover { color: rgba(255,255,255,0.9); }
    .nav-link:hover .nav-link-bg { opacity: 1; }

    .nav-link.active {
      color: white;
      font-weight: 600;
    }

    .nav-link.active .nav-link-bg {
      opacity: 1;
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15));
      border: 1px solid rgba(99,102,241,0.3);
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 25%; right: 25%;
      height: 2px;
      background: linear-gradient(90deg, #6366f1, #a855f7);
      border-radius: 2px 2px 0 0;
      box-shadow: 0 0 8px rgba(99,102,241,0.8);
    }

    .nav-icon { font-size: 15px; position: relative; z-index: 1; }
    .nav-label { position: relative; z-index: 1; }

    .notif-badge {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      box-shadow: 0 0 8px rgba(239,68,68,0.5);
      animation: badgePulse 2s ease infinite;
      position: relative; z-index: 1;
    }

    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.1); }
    }

    @keyframes navItemIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ══════════════════════════════════════
       RIGHT SECTION
    ══════════════════════════════════════ */
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      z-index: 1;
      animation: fadeInRight 0.6s ease both 0.2s;
    }

    /* Theme toggle */
    .theme-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50px;
      padding: 5px 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .theme-btn:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.15);
    }

    .theme-icon { font-size: 14px; }

    .theme-track {
      width: 28px; height: 16px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      position: relative;
      transition: background 0.3s ease;
    }

    .theme-thumb {
      position: absolute;
      width: 12px; height: 12px;
      background: white;
      border-radius: 50%;
      top: 2px; left: 2px;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }

    .theme-thumb.dark {
      transform: translateX(12px);
      background: #818cf8;
    }

    /* User pill */
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 50px;
      padding: 4px 6px 4px 10px;
      transition: all 0.2s ease;
    }

    .user-pill:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(99,102,241,0.3);
    }

    .online-dot {
      width: 7px; height: 7px;
      background: #22c55e;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 8px rgba(34,197,94,0.7);
      animation: onlinePulse 2s ease infinite;
    }

    @keyframes onlinePulse {
      0%, 100% { box-shadow: 0 0 8px rgba(34,197,94,0.7); }
      50%       { box-shadow: 0 0 14px rgba(34,197,94,0.9); }
    }

    .user-greeting {
      color: rgba(255,255,255,0.65);
      font-size: 12.5px;
      white-space: nowrap;
      strong { color: rgba(255,255,255,0.9); font-weight: 600; }
    }

    .user-avatar {
      position: relative;
      width: 30px; height: 30px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 11px;
      flex-shrink: 0;
    }

    .avatar-ring {
      position: absolute; inset: -2px;
      border-radius: 50%;
      border: 1.5px solid rgba(99,102,241,0.5);
      animation: ringRotate 4s linear infinite;
      border-top-color: #818cf8;
    }

    @keyframes ringRotate {
      to { transform: rotate(360deg); }
    }

    /* Logout */
    .btn-logout {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 18px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      border: none;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 4px 15px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .btn-logout::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .btn-logout:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99,102,241,0.6);
    }
    .btn-logout:hover::before { opacity: 1; }
    .btn-logout:active { transform: translateY(0); }

    .logout-icon { font-size: 14px; }

    /* ══════════════════════════════════════
       ANIMATIONS
    ══════════════════════════════════════ */
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ClSidebarComponent {
  unreadCount = 0;
  isDark = true;
  isScrolled = false;

  navItems = [
    { label: 'Dashboard',     icon: '📊', route: '/client/dashboard',     badge: false },
    { label: 'My Projects',   icon: '📁', route: '/client/projects',      badge: false },
    { label: 'Proposals',     icon: '📝', route: '/client/proposals',     badge: false },
    { label: 'Notifications', icon: '🔔', route: '/client/notifications', badge: true  },
    { label: 'Profile',       icon: '⚙️', route: '/client/profile',       badge: false },
  ];

  constructor(
    public authService: AuthService,
    private router: Router,
    private notifService: NotificationService
  ) {
    this.isDark = localStorage.getItem('cl-theme') !== 'light';
    this.applyTheme();

    const userId = this.authService.currentUser?.id;
    if (userId) {
      this.notifService.countUnread(userId).subscribe({
        next: r => this.unreadCount = r.count,
        error: () => this.unreadCount = 0
      });
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 20;
    });
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('cl-theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme(): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', this.isDark ? 'dark' : 'light');

    if (this.isDark) {
      root.style.setProperty('--bo-bg-primary',    '#080a14');
      root.style.setProperty('--bo-bg-secondary',  '#0f1320');
      root.style.setProperty('--bo-bg-sidebar',    '#080a14');
      root.style.setProperty('--bo-text-primary',  '#e8eaf6');
      root.style.setProperty('--bo-text-secondary','#7986a3');
      root.style.setProperty('--bo-border',        'rgba(255,255,255,0.07)');
      root.style.setProperty('--shadow-card',      '0 4px 24px rgba(0,0,0,0.4)');
      root.style.setProperty('--primary',          '#6366f1');
      root.style.setProperty('--radius-md',        '16px');
    } else {
      root.style.setProperty('--bo-bg-primary',    '#f0f2fb');
      root.style.setProperty('--bo-bg-secondary',  '#ffffff');
      root.style.setProperty('--bo-bg-sidebar',    '#080a14');
      root.style.setProperty('--bo-text-primary',  '#1a1d2e');
      root.style.setProperty('--bo-text-secondary','#6b7280');
      root.style.setProperty('--bo-border',        'rgba(0,0,0,0.07)');
      root.style.setProperty('--shadow-card',      '0 4px 24px rgba(99,102,241,0.08)');
      root.style.setProperty('--primary',          '#6366f1');
      root.style.setProperty('--radius-md',        '16px');
    }
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/']); }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}