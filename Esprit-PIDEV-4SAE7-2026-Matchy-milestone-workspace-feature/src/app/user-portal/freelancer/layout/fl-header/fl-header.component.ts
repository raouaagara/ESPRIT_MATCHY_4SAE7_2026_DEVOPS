import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-fl-header',
  template: `
    <header class="fl-header">

      <!-- LEFT : Brand -->
      <div class="header-brand">
        <div class="brand-logo">M</div>
        <span class="brand-name">Matchy</span>
        <span class="brand-divider">·</span>
        <span class="brand-badge">Freelancer</span>
      </div>

      <!-- RIGHT : Actions -->
      <div class="header-right">

        <!-- Dark/Light toggle -->
        <button class="btn-theme" (click)="toggleTheme()" [title]="isDark ? 'Switch to Light' : 'Switch to Dark'">
          <span>{{ isDark ? '☀️' : '🌙' }}</span>
          <span class="theme-lbl">{{ isDark ? 'Light' : 'Dark' }}</span>
        </button>

        <button class="btn-home" (click)="goHome()">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Home
        </button>

        <div class="header-sep"></div>

        <div class="user-pill" *ngIf="authService.currentUser">
          <div class="user-avatar">
            {{ (authService.currentUser?.firstName || authService.currentUser?.name || 'U')[0].toUpperCase() }}
          </div>
          <span class="user-name">
            {{ authService.currentUser?.firstName || authService.currentUser?.name }}
          </span>
        </div>
      </div>

    </header>
  `,
  styles: [`
    :host {
      --accent:  #6366f1;
      --purple:  #a855f7;
      --a-light: rgba(99,102,241,0.1);
    }

    .fl-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      height: 60px;
      background: var(--bo-bg-secondary);
      border-bottom: 1.5px solid var(--bo-border);
      box-shadow: 0 1px 12px rgba(99,102,241,0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      gap: 16px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 900;
      color: #fff;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--bo-text-primary);
      letter-spacing: -0.3px;
    }

    .brand-divider {
      color: var(--bo-text-secondary);
      font-size: 16px;
      opacity: 0.4;
    }

    .brand-badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      background: var(--a-light);
      padding: 3px 10px;
      border-radius: 50px;
      letter-spacing: 0.03em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .btn-theme {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 600;
      border: 1.5px solid rgba(124,106,247,0.3);
      background: rgba(124,106,247,0.08);
      color: #9d8ff9;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn-theme .theme-lbl { letter-spacing: 0.02em; }
    .btn-theme:hover {
      background: rgba(124,106,247,0.16);
      border-color: rgba(124,106,247,0.5);
    }

    .btn-home {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: var(--bo-text-secondary);
      background: transparent;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .btn-home svg { transition: transform 0.2s; }
    .btn-home:hover {
      background: var(--a-light);
      color: var(--accent);
    }
    .btn-home:hover svg { transform: translateX(-3px); }

    .header-sep {
      width: 1px;
      height: 22px;
      background: var(--bo-border);
      flex-shrink: 0;
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 4px;
      border: 1.5px solid var(--bo-border);
      border-radius: 50px;
      cursor: default;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .user-pill:hover {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--a-light);
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--bo-text-primary);
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class FlHeaderComponent {
  isDark = false;

  constructor(public authService: AuthService, private router: Router) {
    this.authService.checkAuth();
    this.isDark = localStorage.getItem('theme') === 'dark'
               || document.body.classList.contains('dark');
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark', this.isDark);
    const html = document.documentElement;
    if (this.isDark) {
      html.classList.add('bo-dark');
      html.classList.remove('bo-light');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.add('bo-light');
      html.classList.remove('bo-dark');
      html.setAttribute('data-theme', 'light');
    }
  }

  goHome(): void { this.router.navigate(['/']); }
}