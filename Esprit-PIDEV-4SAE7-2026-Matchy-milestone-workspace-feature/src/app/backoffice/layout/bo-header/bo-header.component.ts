import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bo-header',
  template: `
    <header class="bo-page-header-enhanced">
      <div class="header-left">
        <div class="header-tabs" [class.users-active]="showUsers" [class.projects-active]="!showUsers">
          <button class="header-tab" [class.active]="showUsers" (click)="showUsers = true">
            <span class="tab-icon">👥</span>
            Users
          </button>
          <button class="header-tab" [class.active]="!showUsers" (click)="showUsers = false">
            <span class="tab-icon">📁</span>
            Projects
          </button>
        </div>
      </div>
      <div class="header-right">
        <app-location-icon></app-location-icon>
        <app-notification-bell></app-notification-bell>
        <app-theme-toggle></app-theme-toggle>
        <a class="front-office-link" (click)="goToFront()">
          Front Office
          <span class="link-arrow">→</span>
        </a>
      </div>
    </header>
  `,
  styleUrls: ['./bo-header.component.scss']
})
export class BoHeaderComponent {
  showUsers = true;
  constructor(private router: Router) {}
  goToFront(): void { this.router.navigate(['/']); }
}
