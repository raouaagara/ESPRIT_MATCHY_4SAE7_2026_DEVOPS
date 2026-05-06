import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fl-layout',
  template: `
    <div class="fl-layout">
      <button class="back-home-btn" (click)="goHome()" title="Back to main site">
        <span class="arrow">←</span>
        <span class="label">Home</span>
      </button>
      <app-fl-navbar></app-fl-navbar>
      <main class="fl-content">
        <router-outlet></router-outlet>
      </main>
      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: [`
    .fl-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--bo-bg-primary);
      font-family: var(--font-body);
    }
    .fl-content {
      flex: 1;
      padding: 28px 32px;
      overflow-y: auto;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .back-home-btn {
      position: fixed;
      top: 14px;
      left: 16px;
      z-index: 1100;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 600;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(99,102,241,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: inherit;
    }
    .back-home-btn:hover {
      transform: translateX(-2px);
      box-shadow: 0 6px 18px rgba(99,102,241,0.5);
    }
    .back-home-btn .arrow { font-size: 16px; line-height: 1; }
    @media (max-width: 768px) {
      .fl-content { padding: 16px; }
      .back-home-btn .label { display: none; }
    }
  `]
})
export class FlLayoutComponent {
  constructor(private router: Router) {}
  goHome(): void { this.router.navigate(['/']); }
}