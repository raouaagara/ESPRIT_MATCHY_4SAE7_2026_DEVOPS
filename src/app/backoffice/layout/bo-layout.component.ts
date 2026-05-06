import { Component } from '@angular/core';

@Component({
  selector: 'app-bo-layout',
  template: `
    <div class="bo-layout">
      <app-bo-sidebar></app-bo-sidebar>
      <div class="bo-main">
        <app-bo-header></app-bo-header>
        <main class="bo-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .bo-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bo-bg-primary);
      font-family: var(--font-body);
    }
    .bo-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .bo-content {
      flex: 1;
      padding: 24px 28px;
      overflow-y: auto;
    }
  `]
})
export class BoLayoutComponent {}
