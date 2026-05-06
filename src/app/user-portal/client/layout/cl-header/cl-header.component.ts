import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cl-header',
  template: `
    <header class="cl-header">
      <div class="header-left">
        <h2 class="page-context">Client Portal</h2>
      </div>
      <div class="header-right">
        <button class="btn-outline" (click)="goHome()">← Home</button>
        <span class="user-greeting" *ngIf="authService.currentUser">
          Hello, {{ authService.currentUser?.firstName || authService.currentUser?.name }}
        </span>
      </div>
    </header>
  `,
  styles: [`
    .cl-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: var(--bo-bg-secondary); border-bottom: 1px solid var(--bo-border); }
    .page-context { font-size: 16px; font-weight: 600; color: var(--bo-text-primary); }
    .header-right { display: flex; align-items: center; gap: 14px; }
    .user-greeting { font-size: 14px; color: var(--bo-text-secondary); }
    .btn-outline { padding: 7px 14px; font-size: 13px; border: 1px solid var(--bo-border); border-radius: 6px; background: transparent; color: var(--bo-text-secondary); cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
  `]
})
export class ClHeaderComponent {
  constructor(public authService: AuthService, private router: Router) {}
  goHome(): void { this.router.navigate(['/']); }
}
